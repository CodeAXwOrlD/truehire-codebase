from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/match-score", tags=["match-score"])


@router.get("/health")
def match_score_health():
    return JSONResponse({"data": {"status": "match_score router active"}, "error": None})
