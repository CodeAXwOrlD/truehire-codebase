from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/ghost-score", tags=["ghost-score"])


@router.get("/health")
def ghost_score_health():
    return JSONResponse({"data": {"status": "ghost_score router active"}, "error": None})
