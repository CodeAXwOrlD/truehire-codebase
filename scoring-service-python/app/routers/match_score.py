import re
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter(prefix="/match-score", tags=["match-score"])

KNOWN_TECH_SKILLS = [
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "typescript", "javascript",
    "python", "fastapi", "django", "flask", "node.js", "nodejs", "express", "go", "golang",
    "rust", "java", "spring", "c++", "c#", ".net", "ruby", "rails", "php", "laravel",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "graphql", "rest", "grpc", "prisma", "typeorm", "docker", "kubernetes", "k8s",
    "aws", "gcp", "azure", "ci/cd", "terraform", "linux", "git", "tailwind", "css", "html",
    "llm", "openai", "pytorch", "tensorflow", "nlp", "machine learning", "distributed systems"
]


class ParseResumeInput(BaseModel):
    resume_text: str


class ParsedProfileResult(BaseModel):
    skills: List[str]
    experience_years: int
    detected_roles: List[str]
    summary: str


class MatchScoreInput(BaseModel):
    candidate_skills: List[str] = Field(default_factory=list)
    candidate_experience_years: int = Field(0)
    job_title: str
    job_tags: List[str] = Field(default_factory=list)
    job_description: str = ""


class MatchScoreResult(BaseModel):
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]
    alignment_summary: str
    tailoring_tips: List[str]


def extract_skills_from_text(text: str) -> List[str]:
    lower_text = " " + text.lower() + " "
    found = []
    for skill in KNOWN_TECH_SKILLS:
        pattern = r"(?:^|[\s,.\-;/()\[\]])" + re.escape(skill) + r"(?:[\s,.\-;/()\[\]]|$)"
        if re.search(pattern, lower_text):
            canonical = skill.capitalize()
            if skill in ["next.js", "nextjs"]:
                canonical = "Next.js"
            elif skill in ["node.js", "nodejs"]:
                canonical = "Node.js"
            elif skill in ["postgresql", "postgres"]:
                canonical = "PostgreSQL"
            elif skill in ["aws", "gcp", "css", "html", "nlp", "llm"]:
                canonical = skill.upper()
            elif skill in ["ci/cd"]:
                canonical = "CI/CD"
            found.append(canonical)
    return sorted(list(set(found)))


@router.post("/parse-resume")
def parse_resume(data: ParseResumeInput):
    skills = extract_skills_from_text(data.resume_text)
    exp_matches = re.findall(r"(\d+)\+?\s*(?:years|yrs)", data.resume_text, re.IGNORECASE)
    years = max([int(y) for y in exp_matches if int(y) < 40], default=3)

    roles = []
    lower = data.resume_text.lower()
    if "frontend" in lower: roles.append("Frontend Engineer")
    if "backend" in lower: roles.append("Backend Engineer")
    if "fullstack" in lower or "full stack" in lower: roles.append("Fullstack Engineer")
    if "devops" in lower or "infra" in lower: roles.append("DevOps / Infrastructure Engineer")
    if "ai" in lower or "machine learning" in lower: roles.append("AI / ML Engineer")

    if not roles:
        roles = ["Software Engineer"]

    return JSONResponse({
        "data": {
            "skills": skills,
            "experience_years": years,
            "detected_roles": roles,
            "summary": f"Detected {len(skills)} tech skills across {years}+ years of software development.",
        },
        "error": None,
    })


@router.post("/calculate")
def calculate_match(data: MatchScoreInput):
    candidate_skills_lower = [s.lower() for s in data.candidate_skills]
    job_text = f"{data.job_title} {' '.join(data.job_tags)} {data.job_description}"
    required_skills = extract_skills_from_text(job_text)

    if not required_skills:
        required_skills = data.job_tags if data.job_tags else ["TypeScript", "React", "Node.js"]

    matched = []
    missing = []

    for req in required_skills:
        if req.lower() in candidate_skills_lower:
            matched.append(req)
        else:
            missing.append(req)

    if required_skills:
        match_ratio = len(matched) / len(required_skills)
    else:
        match_ratio = 0.8

    title_words = [w.lower() for w in data.job_title.split() if len(w) > 3]
    synergy_bonus = 0.1 if any(w in " ".join(candidate_skills_lower) for w in title_words) else 0.0

    percentage = int(min(98, max(25, (match_ratio * 75) + (synergy_bonus * 100) + 15)))

    tips = []
    if missing:
        tips.append(f"Highlight any experience you have with {', '.join(missing[:3])} in your portfolio.")
    if percentage >= 85:
        tips.append("Your tech stack closely mirrors the core requirements for this position.")
    else:
        tips.append("Review the job description to emphasize transferable system design patterns.")

    return JSONResponse({
        "data": {
            "match_percentage": percentage,
            "matched_skills": matched,
            "missing_skills": missing,
            "alignment_summary": f"Matched {len(matched)} of {len(required_skills)} key technical competencies.",
            "tailoring_tips": tips,
        },
        "error": None,
    })
