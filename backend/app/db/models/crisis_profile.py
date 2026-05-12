from sqlalchemy import Column, Integer, String, Float, Date, Text
from app.db.base import Base


class CrisisProfile(Base):
    __tablename__ = "crisis_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False, unique=True)
    display_name = Column(String(128), nullable=False)
    peak_date = Column(Date, nullable=True)
    peak_composite_score = Column(Float, nullable=True)
    drawdown_pct = Column(Float, nullable=True)
    indicator_vector = Column(Text, nullable=False)  # JSON
    description = Column(Text, nullable=True)
