"""
Solar BESS Profitability Advisor – FastAPI application entry point.
"""

from __future__ import annotations
import os
import sys
from contextlib import asynccontextmanager

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.analyze import router as analyze_router
from routers.export import router as export_router
from routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Solar BESS Advisor API starting...")
    yield
    print("Solar BESS Advisor API shutting down.")


app = FastAPI(
    title="Solar BESS Profitability Advisor",
    description=(
        "Financial analysis API for utility-scale Solar + BESS projects in India. "
        "Computes NPV, IRR, payback, revenue stacks, and sensitivity analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (5173) and production build origin
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(analyze_router)
app.include_router(export_router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Solar BESS Profitability Advisor",
        "version": "1.0.0",
        "docs": "/docs",
    }
