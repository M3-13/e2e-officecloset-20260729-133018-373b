from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./wardrobe.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(sessions)"))
        columns = [row[1] for row in result.fetchall()]
        if "expires_at" not in columns:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN expires_at DATETIME"))
            conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
