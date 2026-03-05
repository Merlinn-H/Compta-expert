from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, categories, dashboard, exchange_rates, reports, tax, transactions
from app.db.database import Base, engine

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Compta Expert API",
    description="Bilingual (FR/EN) accounting app for Quebec & France jurisdictions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(tax.router)
app.include_router(reports.router)
app.include_router(exchange_rates.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "Compta Expert", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
