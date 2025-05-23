from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./smartadvisor.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()