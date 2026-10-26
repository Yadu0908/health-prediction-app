from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, UniqueConstraint
from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    date_of_birth = Column(String(10), nullable=False)  # stored in dd/mm/yyyy format
    email = Column(String(255), nullable=False, index=True)
    glucose = Column(Float, nullable=False)
    haemoglobin = Column(Float, nullable=False)
    cholesterol = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)  # AI-generated health prediction
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("email", "date_of_birth", name="uq_patient_email_dob"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "date_of_birth": self.date_of_birth,
            "email": self.email,
            "glucose": self.glucose,
            "haemoglobin": self.haemoglobin,
            "cholesterol": self.cholesterol,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
