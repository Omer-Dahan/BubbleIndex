"""
One-time script: fetch full historical data (40 years) for all indicator series.
Run this BEFORE backfill_history.py to ensure all series have deep history.

    cd backend
    python fetch_full_history.py
"""
import logging
import sys
from datetime import date, timedelta
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).parent))


def main():
    from app.db.base import Base
    from app.db.session import get_engine, get_session_factory
    import app.db.models.risk_snapshot  # noqa
    import app.db.models.indicator_series  # noqa
    from app.config import get_settings
    from app.core.cache import FileCache
    from app.data.fetchers.fred import FREDFetcher, FRED_SERIES
    from app.data.fetchers.multpl import MultplFetcher
    from app.data.fetchers.shiller import ShillerFetcher
    from app.data.fetchers.ipo import IPOFetcher
    from app.db.models.indicator_series import IndicatorSeries
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    import pandas as pd

    settings = get_settings()
    engine = get_engine()
    Base.metadata.create_all(engine)
    SessionFactory = get_session_factory()
    session = SessionFactory()
    cache = FileCache(settings.cache_dir)

    fred = FREDFetcher(cache, settings)
    multpl = MultplFetcher(cache, settings)
    shiller = ShillerFetcher(cache, settings)
    ipo = IPOFetcher(cache, settings)

    end = date.today()
    start = date(1954, 1, 1)  # FEDFUNDS goes back to 1954

    def store(series_id: str, source: str, df: pd.DataFrame):
        if df.empty:
            logger.warning("  %s: empty, skipping", series_id)
            return
        rows = []
        for _, row in df.iterrows():
            d = row["date"]
            if hasattr(d, "date"):
                d = d.date()
            rows.append({"series_id": series_id, "source": source, "date": d, "value": float(row["value"])})
        stmt = sqlite_insert(IndicatorSeries).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["series_id", "date"],
            set_={"value": stmt.excluded.value},
        )
        session.execute(stmt)
        session.commit()
        logger.info("  %s: stored %d rows (%s → %s)", series_id, len(rows),
                    rows[0]["date"], rows[-1]["date"])

    # 1. FRED series
    logger.info("=== Fetching FRED series (1954–today) ===")
    for name, fred_id in FRED_SERIES.items():
        try:
            df = fred.fetch_series(fred_id, start, end)
            store(fred_id, "fred", df)
        except Exception as e:
            logger.error("  FRED %s (%s): %s", name, fred_id, e)

    # 2. Derived series from FRED data
    logger.info("=== Computing derived series ===")
    from sqlalchemy import and_

    def load_series(sid: str) -> pd.DataFrame:
        rows = session.query(IndicatorSeries).filter(
            IndicatorSeries.series_id == sid
        ).order_by(IndicatorSeries.date).all()
        return pd.DataFrame([{"date": r.date, "value": r.value} for r in rows])

    # yield_curve_spread
    df10 = load_series("DGS10")
    df2 = load_series("DGS2")
    if not df10.empty and not df2.empty:
        merged = pd.merge(df10.rename(columns={"value": "y10"}),
                          df2.rename(columns={"value": "y2"}), on="date", how="inner")
        merged["value"] = merged["y10"] - merged["y2"]
        store("yield_curve_spread", "computed", merged[["date", "value"]])

    # vix_trend (30d % change)
    vix = load_series("VIXCLS")
    if len(vix) >= 31:
        rows = []
        for i in range(30, len(vix)):
            cur = float(vix.iloc[i]["value"])
            past = float(vix.iloc[i - 30]["value"])
            if past != 0:
                rows.append({"date": vix.iloc[i]["date"], "value": (cur - past) / past * 100})
        if rows:
            store("vix_trend", "computed", pd.DataFrame(rows))

    # unemp_trend (6-month delta)
    unrate = load_series("UNRATE")
    if len(unrate) >= 7:
        rows = []
        for i in range(6, len(unrate)):
            rows.append({"date": unrate.iloc[i]["date"],
                         "value": float(unrate.iloc[i]["value"]) - float(unrate.iloc[i - 6]["value"])})
        if rows:
            store("unemp_trend", "computed", pd.DataFrame(rows))

    # cpi_yoy (12-month % change)
    cpi = load_series("CPIAUCSL")
    if len(cpi) >= 13:
        rows = []
        for i in range(12, len(cpi)):
            latest = float(cpi.iloc[i]["value"])
            past = float(cpi.iloc[i - 12]["value"])
            if past != 0:
                rows.append({"date": cpi.iloc[i]["date"], "value": (latest - past) / past * 100})
        if rows:
            store("cpi_yoy", "computed", pd.DataFrame(rows))

    # margin_debt_yoy (4-quarter % change)
    md = load_series("BOGZ1FL663067003Q")
    if len(md) >= 5:
        rows = []
        for i in range(4, len(md)):
            latest = float(md.iloc[i]["value"])
            past = float(md.iloc[i - 4]["value"])
            if past != 0:
                rows.append({"date": md.iloc[i]["date"], "value": (latest - past) / past * 100})
        if rows:
            store("margin_debt_yoy", "computed", pd.DataFrame(rows))

    # 3. Multpl / Shiller scrapes
    logger.info("=== Fetching Multpl / Shiller scrapes ===")
    try:
        df = multpl.fetch_pe_history()
        store("sp500_pe", "multpl", df)
    except Exception as e:
        logger.error("  sp500_pe: %s", e)

    try:
        df = multpl.fetch_ps_history()
        store("sp500_ps", "multpl", df)
    except Exception as e:
        logger.error("  sp500_ps: %s", e)

    try:
        df = shiller.fetch_cape_history()
        store("shiller_cape", "multpl", df)
    except Exception as e:
        logger.error("  shiller_cape: %s", e)

    # 4. IPO volume
    logger.info("=== Loading IPO volume ===")
    try:
        df = ipo.fetch_ipo_yoy_history()
        store("ipo_volume_yoy", "ritter", df)
    except Exception as e:
        logger.error("  ipo_volume_yoy: %s", e)

    # 5. Summary
    logger.info("=== Summary ===")
    from sqlalchemy import func as sqlfunc
    series_ids = ['DDDM01USA156NWDB', 'shiller_cape', 'sp500_pe', 'sp500_ps',
                  'yield_curve_spread', 'FEDFUNDS', 'unemp_trend', 'cpi_yoy',
                  'VIXCLS', 'BAMLH0A0HYM2', 'margin_debt_yoy', 'vix_trend',
                  'ipo_volume_yoy']
    for sid in series_ids:
        count = session.query(sqlfunc.count(IndicatorSeries.id)).filter(IndicatorSeries.series_id == sid).scalar()
        min_d = session.query(sqlfunc.min(IndicatorSeries.date)).filter(IndicatorSeries.series_id == sid).scalar()
        max_d = session.query(sqlfunc.max(IndicatorSeries.date)).filter(IndicatorSeries.series_id == sid).scalar()
        logger.info("  %-30s %5d rows  %s to %s", sid, count, min_d, max_d)

    session.close()
    logger.info("Done. Now delete the risk_snapshots and re-run backfill_history.py")


if __name__ == "__main__":
    main()
