from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.models import Base
from app.services.redis import close_redis
from app.api import auth, devices, rules, activity, alerts, commands, location
from app.ws.gateway import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    await close_redis()


app = FastAPI(
    title="Canopy API",
    description="Parental control backend — device agents, rules, activity monitoring, and real-time commands",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")
app.include_router(activity.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(commands.router, prefix="/api/v1")
app.include_router(location.router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "canopy-api"}
