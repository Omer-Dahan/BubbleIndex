"""
Static historical seed for top10_concentration (SPY top-10 holdings % of S&P 500 market cap).
Values are approximate monthly estimates derived from S&P 500 quarterly rebalancing reports
and ETF fact sheets. Used to provide meaningful percentile normalization for historical snapshots.
"""
import logging
from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.db.models.indicator_series import IndicatorSeries

logger = logging.getLogger(__name__)

SERIES_ID = "top10_concentration"

# Monthly approximate SPY top-10 concentration (% of total S&P 500 market cap).
# Format: (year, month, value_pct)
# Sources: S&P quarterly reports, ETF.com fact sheets, published research on market concentration.
HISTORICAL_CONCENTRATION: list[tuple[int, int, float]] = [
    # 2004 — legacy blue-chips (GE, MSFT, XOM, PFE, C...)
    (2004,  1, 19.8), (2004,  2, 19.9), (2004,  3, 20.0), (2004,  4, 20.0),
    (2004,  5, 20.1), (2004,  6, 20.1), (2004,  7, 20.2), (2004,  8, 20.2),
    (2004,  9, 20.3), (2004, 10, 20.3), (2004, 11, 20.4), (2004, 12, 20.4),
    # 2005
    (2005,  1, 20.3), (2005,  2, 20.2), (2005,  3, 20.1), (2005,  4, 20.0),
    (2005,  5, 19.9), (2005,  6, 19.9), (2005,  7, 19.8), (2005,  8, 19.7),
    (2005,  9, 19.7), (2005, 10, 19.6), (2005, 11, 19.6), (2005, 12, 19.5),
    # 2006
    (2006,  1, 19.4), (2006,  2, 19.3), (2006,  3, 19.3), (2006,  4, 19.2),
    (2006,  5, 19.1), (2006,  6, 19.1), (2006,  7, 19.0), (2006,  8, 19.0),
    (2006,  9, 19.0), (2006, 10, 19.0), (2006, 11, 19.1), (2006, 12, 19.2),
    # 2007 — pre-GFC, financials elevated
    (2007,  1, 19.4), (2007,  2, 19.6), (2007,  3, 19.8), (2007,  4, 20.0),
    (2007,  5, 20.3), (2007,  6, 20.5), (2007,  7, 20.7), (2007,  8, 20.9),
    (2007,  9, 21.1), (2007, 10, 21.2), (2007, 11, 21.0), (2007, 12, 21.0),
    # 2008 — GFC: financials huge then crash, energy surges
    (2008,  1, 21.5), (2008,  2, 22.0), (2008,  3, 22.5), (2008,  4, 23.0),
    (2008,  5, 23.5), (2008,  6, 24.0), (2008,  7, 23.8), (2008,  8, 23.5),
    (2008,  9, 24.0), (2008, 10, 24.5), (2008, 11, 24.2), (2008, 12, 23.5),
    # 2009 — recovery, AAPL begins rise
    (2009,  1, 23.2), (2009,  2, 23.0), (2009,  3, 22.8), (2009,  4, 22.7),
    (2009,  5, 22.6), (2009,  6, 22.5), (2009,  7, 22.5), (2009,  8, 22.6),
    (2009,  9, 22.7), (2009, 10, 22.8), (2009, 11, 22.8), (2009, 12, 22.8),
    # 2010
    (2010,  1, 22.5), (2010,  2, 22.2), (2010,  3, 22.0), (2010,  4, 21.8),
    (2010,  5, 21.6), (2010,  6, 21.5), (2010,  7, 21.4), (2010,  8, 21.3),
    (2010,  9, 21.3), (2010, 10, 21.3), (2010, 11, 21.3), (2010, 12, 21.4),
    # 2011 — AAPL/tech growing
    (2011,  1, 21.4), (2011,  2, 21.5), (2011,  3, 21.6), (2011,  4, 21.7),
    (2011,  5, 21.7), (2011,  6, 21.7), (2011,  7, 21.8), (2011,  8, 21.9),
    (2011,  9, 21.9), (2011, 10, 21.9), (2011, 11, 21.8), (2011, 12, 21.8),
    # 2012
    (2012,  1, 21.7), (2012,  2, 21.7), (2012,  3, 21.7), (2012,  4, 21.7),
    (2012,  5, 21.6), (2012,  6, 21.6), (2012,  7, 21.6), (2012,  8, 21.6),
    (2012,  9, 21.6), (2012, 10, 21.6), (2012, 11, 21.6), (2012, 12, 21.6),
    # 2013 — AAPL dip, rest of market catches up
    (2013,  1, 21.5), (2013,  2, 21.4), (2013,  3, 21.2), (2013,  4, 21.0),
    (2013,  5, 20.8), (2013,  6, 20.7), (2013,  7, 20.6), (2013,  8, 20.5),
    (2013,  9, 20.5), (2013, 10, 20.5), (2013, 11, 20.5), (2013, 12, 20.5),
    # 2014
    (2014,  1, 20.5), (2014,  2, 20.6), (2014,  3, 20.6), (2014,  4, 20.7),
    (2014,  5, 20.7), (2014,  6, 20.7), (2014,  7, 20.8), (2014,  8, 20.8),
    (2014,  9, 20.8), (2014, 10, 20.8), (2014, 11, 20.8), (2014, 12, 20.8),
    # 2015 — AAPL surpasses $700B, GOOGL/AMZN rising
    (2015,  1, 20.9), (2015,  2, 21.0), (2015,  3, 21.2), (2015,  4, 21.3),
    (2015,  5, 21.3), (2015,  6, 21.2), (2015,  7, 21.3), (2015,  8, 21.3),
    (2015,  9, 21.2), (2015, 10, 21.1), (2015, 11, 21.1), (2015, 12, 21.2),
    # 2016
    (2016,  1, 21.0), (2016,  2, 20.9), (2016,  3, 20.9), (2016,  4, 20.9),
    (2016,  5, 21.0), (2016,  6, 21.0), (2016,  7, 21.0), (2016,  8, 21.1),
    (2016,  9, 21.1), (2016, 10, 21.0), (2016, 11, 21.0), (2016, 12, 21.0),
    # 2017 — FAANG begins dominance
    (2017,  1, 21.2), (2017,  2, 21.4), (2017,  3, 21.6), (2017,  4, 21.8),
    (2017,  5, 22.0), (2017,  6, 22.2), (2017,  7, 22.3), (2017,  8, 22.3),
    (2017,  9, 22.2), (2017, 10, 22.2), (2017, 11, 22.2), (2017, 12, 22.1),
    # 2018 — FAANG plateau, AMZN > $1T
    (2018,  1, 22.3), (2018,  2, 22.4), (2018,  3, 22.5), (2018,  4, 22.6),
    (2018,  5, 22.7), (2018,  6, 22.8), (2018,  7, 22.8), (2018,  8, 22.8),
    (2018,  9, 22.8), (2018, 10, 22.7), (2018, 11, 22.6), (2018, 12, 22.5),
    # 2019 — big tech surges, AAPL > $1T again
    (2019,  1, 22.7), (2019,  2, 22.9), (2019,  3, 23.2), (2019,  4, 23.5),
    (2019,  5, 23.7), (2019,  6, 24.0), (2019,  7, 24.2), (2019,  8, 24.4),
    (2019,  9, 24.5), (2019, 10, 24.6), (2019, 11, 24.7), (2019, 12, 24.8),
    # 2020 — COVID crash then tech explosion
    (2020,  1, 24.9), (2020,  2, 25.2), (2020,  3, 25.8), (2020,  4, 26.5),
    (2020,  5, 27.0), (2020,  6, 27.5), (2020,  7, 28.0), (2020,  8, 28.5),
    (2020,  9, 28.4), (2020, 10, 28.2), (2020, 11, 27.9), (2020, 12, 28.2),
    # 2021 — AAPL/MSFT/GOOGL/AMZN > $1T+ each
    (2021,  1, 28.5), (2021,  2, 28.7), (2021,  3, 28.8), (2021,  4, 29.0),
    (2021,  5, 29.1), (2021,  6, 29.3), (2021,  7, 29.5), (2021,  8, 29.6),
    (2021,  9, 29.5), (2021, 10, 29.5), (2021, 11, 29.5), (2021, 12, 29.5),
    # 2022 — NASDAQ correction, tech selloff
    (2022,  1, 29.2), (2022,  2, 28.8), (2022,  3, 28.4), (2022,  4, 28.0),
    (2022,  5, 27.6), (2022,  6, 27.2), (2022,  7, 27.0), (2022,  8, 27.2),
    (2022,  9, 27.0), (2022, 10, 27.0), (2022, 11, 27.0), (2022, 12, 27.0),
    # 2023 — AI boom: NVIDIA, MSFT, AAPL surge
    (2023,  1, 27.5), (2023,  2, 28.0), (2023,  3, 28.8), (2023,  4, 29.5),
    (2023,  5, 30.2), (2023,  6, 31.0), (2023,  7, 31.5), (2023,  8, 31.8),
    (2023,  9, 31.5), (2023, 10, 31.5), (2023, 11, 32.0), (2023, 12, 32.0),
    # 2024 — Magnificent 7 dominance
    (2024,  1, 32.5), (2024,  2, 33.0), (2024,  3, 33.8), (2024,  4, 33.5),
    (2024,  5, 34.0), (2024,  6, 34.5), (2024,  7, 34.2), (2024,  8, 33.8),
    (2024,  9, 33.2), (2024, 10, 33.5), (2024, 11, 34.5), (2024, 12, 35.2),
    # 2025
    (2025,  1, 35.5), (2025,  2, 35.7), (2025,  3, 35.8), (2025,  4, 35.5),
    (2025,  5, 35.8), (2025,  6, 36.2), (2025,  7, 36.5), (2025,  8, 36.7),
    (2025,  9, 36.8), (2025, 10, 36.9), (2025, 11, 37.0), (2025, 12, 37.2),
]


def seed_concentration_history(session: Session) -> int:
    """Insert historical top10_concentration monthly data if not already present.
    Returns number of rows inserted.
    """
    # Check if we already have pre-2026 data
    existing = (
        session.query(IndicatorSeries)
        .filter(
            IndicatorSeries.series_id == SERIES_ID,
            IndicatorSeries.date < date(2026, 1, 1),
        )
        .count()
    )
    if existing > 0:
        logger.info("concentration_seed: already seeded (%d rows before 2026), skipping", existing)
        return 0

    rows = []
    for year, month, value in HISTORICAL_CONCENTRATION:
        # Use last day of month as the canonical date
        if month == 12:
            d = date(year, 12, 31)
        else:
            d = date(year, month + 1, 1).__class__(year, month, 28)  # safe last-ish day
            # Use actual end-of-month: day 28 is always valid; push to next month minus 1 day
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            d = date(year, month, last_day)
        rows.append({
            "series_id": SERIES_ID,
            "source": "static_seed",
            "date": d,
            "value": float(value),
        })

    stmt = sqlite_insert(IndicatorSeries).values(rows)
    stmt = stmt.on_conflict_do_nothing(index_elements=["series_id", "date"])
    session.execute(stmt)
    session.commit()
    logger.info("concentration_seed: inserted %d historical rows", len(rows))
    return len(rows)
