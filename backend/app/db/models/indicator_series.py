from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func
from app.db.base import Base


class IndicatorSeries(Base):
    __tablename__ = "indicator_series"

    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(String(64), nullable=False)
    source = Column(String(32), nullable=False)  # fred / yfinance / computed
    date = Column(Date, nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("series_id", "date", name="uq_series_date"),
        Index("ix_series_id_date", "series_id", "date"),
    )
