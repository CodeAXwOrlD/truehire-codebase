from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter(prefix="/ghost-score", tags=["ghost-score"])


class GhostScoreInput(BaseModel):
    days_open: int = Field(0, description="Number of days the job has been publicly open")
    repost_count: int = Field(0, description="Estimated number of times this role was reposted")
    interviews_count: int = Field(0, description="Interviews logged by candidates or recruiter")
    offers_count: int = Field(0, description="Offers logged for this role")
    has_salary: bool = Field(True, description="Whether salary transparency is provided")
    company_responsiveness: int = Field(80, description="0-100 responsiveness index")
    source: Optional[str] = Field(None, description="Source platform (e.g. LinkedIn, YC, RemoteOK)")


class GhostScoreResult(BaseModel):
    score: int
    risk_level: str  # low | medium | high
    reasons: List[str]
    recommendations: List[str]


def compute_ghost_score(input_data: GhostScoreInput) -> GhostScoreResult:
    # Base risk score calculation
    # 0-29: Low Risk (Active hiring, fresh post, verified interviews)
    # 30-65: Medium Risk (Aging post, few interviews, potential evergreen)
    # 66-100: High Risk (Ghost posting, high reposts, 0 activity after 45+ days)

    score = 10  # baseline healthy score
    reasons = []
    recommendations = []

    # 1. Posting Age Factor
    if input_data.days_open > 60:
        score += 45
        reasons.append(f"Position has been open for {input_data.days_open} days (>60 days is a primary ghost signal)")
    elif input_data.days_open > 30:
        score += 25
        reasons.append(f"Position has been open for {input_data.days_open} days (>30 days threshold)")
    elif input_data.days_open < 7:
        score -= 5
        reasons.append(f"Fresh posting: Opened only {input_data.days_open} days ago")

    # 2. Reposting Frequency Factor
    if input_data.repost_count >= 3:
        score += 30
        reasons.append(f"Role has been reposted {input_data.repost_count} times without hiring closure")
    elif input_data.repost_count == 2:
        score += 15
        reasons.append("Role has been reposted twice across boards")

    # 3. Active Interview / Offer Verification (Strongest anti-ghost signal!)
    if input_data.interviews_count > 0 or input_data.offers_count > 0:
        reduction = min(40, (input_data.interviews_count * 10) + (input_data.offers_count * 20))
        score -= reduction
        reasons.append(f"Active hiring verified: {input_data.interviews_count} interviews / {input_data.offers_count} offers logged")
    elif input_data.days_open > 21:
        score += 15
        reasons.append("No active interview events logged despite 3+ weeks open")

    # 4. Salary Transparency Factor
    if not input_data.has_salary:
        score += 10
        reasons.append("No salary transparency provided in the listing")
    else:
        reasons.append("Clear salary range provided")

    # Clamp score between 0 and 100
    final_score = max(0, min(100, score))

    if final_score < 30:
        risk_level = "low"
        recommendations.append("High hiring intent verified. Great time to apply!")
    elif final_score <= 65:
        risk_level = "medium"
        recommendations.append("Moderate age. Tailor your resume specifically to stand out.")
    else:
        risk_level = "high"
        recommendations.append("Potential evergreen or pipeline-gathering post. Consider applying directly on company careers site.")

    return GhostScoreResult(
        score=final_score,
        risk_level=risk_level,
        reasons=reasons,
        recommendations=recommendations,
    )


@router.post("/calculate")
def calculate_score(data: GhostScoreInput):
    result = compute_ghost_score(data)
    return JSONResponse({"data": result.model_dump(), "error": None})


@router.post("/explain")
def explain_score(data: GhostScoreInput):
    result = compute_ghost_score(data)
    return JSONResponse({"data": result.model_dump(), "error": None})
