import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL: SQLite stored locally in backend directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./health_prediction.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides an active database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
