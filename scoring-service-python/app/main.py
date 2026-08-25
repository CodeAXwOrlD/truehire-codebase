from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware.service_auth import ServiceAuthMiddleware
from app.routers import ghost_score, match_score

app = FastAPI(
    title="TrueHire Scoring Service",
    description="Internal-only microservice. Reachable exclusively from backend-node via signed requests.",
    docs_url=None if settings.is_prod else "/docs",
    redoc_url=None if settings.is_prod else "/redoc",
)

app.add_middleware(ServiceAuthMiddleware)

app.include_router(ghost_score.router)
app.include_router(match_score.router)


@app.get("/health")
def health():
    return JSONResponse({"data": {"status": "ok"}, "error": None})
