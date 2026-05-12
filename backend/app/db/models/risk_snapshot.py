from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_date = Column(Date, nullable=False, unique=True, index=True)
    composite_score = Column(Float, nullable=False)
    risk_label = Column(String(16), nullable=False)

    valuation_score = Column(Float, nullable=True)
    macro_stress_score = Column(Float, nullable=True)
    leverage_credit_score = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    concentration_score = Column(Float, nullable=True)

    indicator_vector = Column(Text, nullable=True)   # JSON
    data_freshness = Column(Text, nullable=True)      # JSON
    warnings = Column(Text, nullable=True)            # JSON array

    created_at = Column(DateTime, server_default=func.now())
