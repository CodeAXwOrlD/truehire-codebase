import re
import io
import base64
from fastapi import APIRouter, UploadFile, File
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
    "llm", "openai", "pytorch", "tensorflow", "nlp", "machine learning", "distributed systems",
    "kafka", "rabbitmq", "celery", "websocket", "webrtc", "solidity", "web3", "supabase",
    "firebase", "vercel", "cloudflare", "nginx", "apache", "ansible", "jenkins", "github actions",
    "swift", "kotlin", "flutter", "react native", "unity", "unreal", "figma",
]


class ParseResumeInput(BaseModel):
    resume_text: str


class ParseResumeB64Input(BaseModel):
    """For base64-encoded file content sent from Node.js backend."""
    content_b64: str
    filename: str  # .pdf or .docx


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
            elif skill in ["k8s", "kubernetes"]:
                canonical = "Kubernetes"
            elif skill == "react native":
                canonical = "React Native"
            elif skill == "github actions":
                canonical = "GitHub Actions"
            elif skill == "machine learning":
                canonical = "Machine Learning"
            elif skill == "distributed systems":
                canonical = "Distributed Systems"
            found.append(canonical)
    return sorted(list(set(found)))


def detect_roles(text: str) -> List[str]:
    lower = text.lower()
    roles = []
    if "frontend" in lower or "front-end" in lower or "ui engineer" in lower:
        roles.append("Frontend Engineer")
    if "backend" in lower or "back-end" in lower or "server-side" in lower:
        roles.append("Backend Engineer")
    if "fullstack" in lower or "full stack" in lower or "full-stack" in lower:
        roles.append("Fullstack Engineer")
    if "devops" in lower or "infrastructure" in lower or "platform engineer" in lower:
        roles.append("DevOps / Infrastructure Engineer")
    if "ai " in lower or "machine learning" in lower or "ml engineer" in lower:
        roles.append("AI / ML Engineer")
    if "mobile" in lower or "ios" in lower or "android" in lower:
        roles.append("Mobile Engineer")
    if "data engineer" in lower or "data scientist" in lower:
        roles.append("Data Engineer")
    return roles if roles else ["Software Engineer"]


def extract_text_from_pdf_bytes(content: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except ImportError:
        return ""
    except Exception:
        return ""


def extract_text_from_docx_bytes(content: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except ImportError:
        return ""
    except Exception:
        return ""


def extract_experience_info(text: str) -> tuple[int, int, str]:
    """
    Carefully parse work experience from resume text:
    - Searches for explicit work experience statements (e.g. 'X years of experience', 'X yrs exp')
    - Searches for months of internship/work (e.g. '3 month internship', '1 month at...', '3 months intern')
    - Ignores academic degrees ('3rd year student', '4-year B.Tech')
    - Returns (years: int, total_months: int, label: str)
    - Defaults to 0 (Entry level) if no explicit years of experience are found! Never defaults to 3!
    """
    # 1. Search for explicit work experience patterns with years
    explicit_year_patterns = [
        r"(?:experience|exp|worked|working)\s*(?:for|of|:)?\s*(\d+)\+?\s*(?:years?|yrs?)",
        r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:relevant\s+)?(?:experience|exp|in software|as a|professional)",
        r"(?:total\s+)?experience\s*[:\-]?\s*(\d+)\+?\s*(?:years?|yrs?)",
    ]
    
    found_years = []
    for pat in explicit_year_patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            val = int(m)
            if 0 < val < 45:
                found_years.append(val)

    # 2. Search for explicit months (e.g. "3 months internship", "1 month job", "3 mos intern")
    found_months = []
    month_matches = re.findall(r"\b(\d+)\s*(?:months?|mos?)\b", text, re.IGNORECASE)
    for m in month_matches:
        val = int(m)
        if 0 < val < 48:
            found_months.append(val)

    # 3. Check for intern / fresher / early career indicators
    is_fresher_or_intern = bool(
        re.search(r"\b(intern|internship|fresher|trainee|apprentice|student|graduate trainee)\b", text, re.IGNORECASE)
    )

    total_months = sum(found_months) if found_months else 0

    if found_years:
        years = max(found_years)
        label = f"{years}+ years"
    elif total_months > 0:
        # e.g. 3 months internship + 1 month job = 4 months
        years = 1 if total_months >= 12 else 0
        label = f"{total_months} months (Entry / Early Career)"
    elif is_fresher_or_intern:
        years = 0
        label = "Entry Level / Intern (< 1 yr)"
    else:
        # Default to 0 (Entry Level), never hardcode 3!
        years = 0
        label = "Entry Level (< 1 yr)"

    return years, total_months, label


@router.post("/extract-resume")
def extract_resume_from_file(data: ParseResumeB64Input):
    """
    Accepts a base64-encoded PDF or DOCX file, extracts text,
    then runs NLP skill extraction and accurate experience detection.
    """
    try:
        content = base64.b64decode(data.content_b64)
    except Exception:
        return JSONResponse({"data": None, "error": "Invalid base64 content"}, status_code=400)

    filename_lower = data.filename.lower()
    if filename_lower.endswith(".pdf"):
        text = extract_text_from_pdf_bytes(content)
    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        text = extract_text_from_docx_bytes(content)
    else:
        # Treat as plain text
        try:
            text = content.decode("utf-8", errors="ignore")
        except Exception:
            text = ""

    if not text.strip():
        return JSONResponse({
            "data": None,
            "error": "Could not extract text from this file. Please ensure it is a valid PDF or DOCX."
        }, status_code=422)

    skills = extract_skills_from_text(text)
    years, total_months, exp_label = extract_experience_info(text)
    roles = detect_roles(text)

    if years == 0:
        if total_months > 0:
            summary = f"Extracted {len(skills)} technical skills with {total_months} month(s) of experience/internship ({exp_label})."
        else:
            summary = f"Extracted {len(skills)} technical skills for Early Career / Entry level."
    else:
        summary = f"Extracted {len(skills)} technical skills across {years}+ year(s) of software development."

    return JSONResponse({
        "data": {
            "skills": skills,
            "experience_years": years,
            "detected_roles": roles,
            "raw_text_length": len(text),
            "summary": summary,
        },
        "error": None,
    })


@router.post("/parse-resume")
def parse_resume(data: ParseResumeInput):
    """Parse raw resume text with accurate experience detection."""
    skills = extract_skills_from_text(data.resume_text)
    years, total_months, exp_label = extract_experience_info(data.resume_text)
    roles = detect_roles(data.resume_text)

    if years == 0:
        if total_months > 0:
            summary = f"Extracted {len(skills)} technical skills with {total_months} month(s) of experience/internship ({exp_label})."
        else:
            summary = f"Extracted {len(skills)} technical skills for Early Career / Entry level."
    else:
        summary = f"Extracted {len(skills)} technical skills across {years}+ year(s) of software development."

    return JSONResponse({
        "data": {
            "skills": skills,
            "experience_years": years,
            "detected_roles": roles,
            "summary": summary,
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
