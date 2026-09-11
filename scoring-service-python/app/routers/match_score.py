import re
import io
import base64
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List

router = APIRouter(prefix="/match-score", tags=["match-score"])

TECH_SKILLS_MAP = {
    # Languages
    "python": "Python", "typescript": "TypeScript", "javascript": "JavaScript",
    "js": "JavaScript", "ts": "TypeScript", "java": "Java", "c++": "C++", "c#": "C#",
    "c": "C", "golang": "Go", "go": "Go", "rust": "Rust", "ruby": "Ruby", "php": "PHP",
    "swift": "Swift", "kotlin": "Kotlin", "dart": "Dart", "scala": "Scala", "sql": "SQL",
    # Frontend
    "react": "React", "react.js": "React", "reactjs": "React", "next.js": "Next.js",
    "nextjs": "Next.js", "vue": "Vue.js", "vue.js": "Vue.js", "angular": "Angular",
    "svelte": "Svelte", "html": "HTML5", "html5": "HTML5", "css": "CSS3", "css3": "CSS3",
    "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS", "bootstrap": "Bootstrap",
    "sass": "SASS/SCSS", "scss": "SASS/SCSS", "redux": "Redux", "zustand": "Zustand",
    # Backend & Frameworks
    "node.js": "Node.js", "nodejs": "Node.js", "node": "Node.js", "express": "Express",
    "express.js": "Express", "fastapi": "FastAPI", "django": "Django", "flask": "Flask",
    "spring": "Spring Boot", "spring boot": "Spring Boot", "nest.js": "NestJS", "nestjs": "NestJS",
    "laravel": "Laravel", "rails": "Ruby on Rails", ".net": ".NET", "dotnet": ".NET",
    # Databases & Storage
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mongodb": "MongoDB",
    "mysql": "MySQL", "redis": "Redis", "sqlite": "SQLite", "prisma": "Prisma",
    "supabase": "Supabase", "firebase": "Firebase", "elasticsearch": "Elasticsearch",
    "dynamodb": "DynamoDB", "cassandra": "Cassandra",
    # Cloud & DevOps
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "aws": "AWS", "gcp": "GCP", "azure": "Azure", "terraform": "Terraform",
    "ci/cd": "CI/CD", "linux": "Linux", "git": "Git", "github": "GitHub",
    "gitlab": "GitLab", "jenkins": "Jenkins", "github actions": "GitHub Actions",
    "nginx": "Nginx", "kafka": "Kafka", "rabbitmq": "RabbitMQ", "celery": "Celery",
    # API & Architecture
    "graphql": "GraphQL", "rest": "REST APIs", "rest api": "REST APIs", "grpc": "gRPC",
    "websocket": "WebSocket", "webrtc": "WebRTC", "distributed systems": "Distributed Systems",
    # AI / Data / Mobile / Design
    "llm": "LLM", "openai": "OpenAI", "pytorch": "PyTorch", "tensorflow": "TensorFlow",
    "pandas": "Pandas", "numpy": "NumPy", "nlp": "NLP", "machine learning": "Machine Learning",
    "figma": "Figma", "postman": "Postman", "flutter": "Flutter", "react native": "React Native",
}

ROLE_PATTERNS = [
    r"\b(?:senior|lead|staff|principal|junior|associate|intern|trainee)?\s*(?:full[\s-]?stack|frontend|front[\s-]?end|backend|back[\s-]?end|software|web|mobile|devops|data|ml|ai|cloud|systems?|qa|automation|security)\s*(?:engineer|developer|architect|intern|trainee|analyst|specialist)\b",
]


class ParseResumeInput(BaseModel):
    resume_text: str


class ParseResumeB64Input(BaseModel):
    content_b64: str
    filename: str


class MatchScoreInput(BaseModel):
    candidate_skills: List[str] = Field(default_factory=list)
    candidate_experience_years: int = Field(0)
    job_title: str
    job_tags: List[str] = Field(default_factory=list)
    job_description: str = ""


def extract_skills_from_text(text: str) -> List[str]:
    found = set()
    lower_text = " " + text.lower() + " "

    # 1. Match from standard tech dictionary with boundary checks
    for key, canonical in TECH_SKILLS_MAP.items():
        pattern = r"(?:^|[\s,.\-;/()\[\]:])" + re.escape(key) + r"(?:[\s,.\-;/()\[\]:]|$)"
        if re.search(pattern, lower_text):
            found.add(canonical)

    # 2. Extract dynamically from explicit Skills / Technical Skills sections
    skill_section = re.search(
        r"(?:skills|technical skills|technologies|tools|competencies|proficiencies)\s*[:\-\n]([\s\S]{1,600}?)(?:\n\s*[A-Z][a-zA-Z\s]{2,25}[:\n]|\Z)",
        text,
        re.IGNORECASE,
    )
    if skill_section:
        items = re.split(r"[,•|\n;/\\]+", skill_section.group(1))
        for item in items:
            clean = item.strip().strip("-:•* ")
            if 2 <= len(clean) <= 25 and not any(w in clean.lower() for w in ["education", "project", "university", "school", "coursework", "summary"]):
                found.add(clean)

    return sorted(list(found))


def detect_roles(text: str) -> List[str]:
    found_roles = set()
    for pat in ROLE_PATTERNS:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            clean = " ".join([w.capitalize() for w in m.strip().split()])
            found_roles.add(clean)

    return sorted(list(found_roles)) if found_roles else []


def extract_text_from_pdf_bytes(content: bytes) -> str:
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception:
        return ""


def extract_text_from_docx_bytes(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception:
        return ""


def extract_experience_info(text: str) -> tuple[int, int, str]:
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

    found_months = []
    month_matches = re.findall(r"\b(\d+)\s*(?:months?|mos?)\b", text, re.IGNORECASE)
    for m in month_matches:
        val = int(m)
        if 0 < val < 48:
            found_months.append(val)

    is_fresher_or_intern = bool(
        re.search(r"\b(intern|internship|fresher|trainee|apprentice|student|graduate trainee)\b", text, re.IGNORECASE)
    )

    total_months = sum(found_months) if found_months else 0

    if found_years:
        years = max(found_years)
        label = f"{years}+ years"
    elif total_months > 0:
        years = 1 if total_months >= 12 else 0
        label = f"{total_months} months (Entry / Early Career)"
    elif is_fresher_or_intern:
        years = 0
        label = "Entry Level / Intern (< 1 yr)"
    else:
        years = 0
        label = "Entry Level (< 1 yr)"

    return years, total_months, label


@router.post("/extract-resume")
def extract_resume_from_file(data: ParseResumeB64Input):
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

    if not candidate_skills_lower:
        return JSONResponse({
            "data": {
                "match_percentage": 0,
                "matched_skills": [],
                "missing_skills": data.job_tags or [],
                "alignment_summary": "Upload resume to compute match score.",
                "tailoring_tips": ["Upload your resume or set your skills to see match alignment."],
            },
            "error": None,
        })

    job_text = f"{data.job_title} {' '.join(data.job_tags)} {data.job_description}"
    required_skills = extract_skills_from_text(job_text)
    if not required_skills:
        required_skills = data.job_tags if data.job_tags else []

    matched = []
    missing = []

    for req in required_skills:
        if req.lower() in candidate_skills_lower:
            matched.append(req)
        else:
            missing.append(req)

    if required_skills:
        match_ratio = len(matched) / len(required_skills)
        percentage = int(round(match_ratio * 100))
    else:
        percentage = 0

    tips = []
    if missing:
        tips.append(f"Highlight any experience you have with {', '.join(missing[:3])} in your portfolio.")
    if percentage >= 80:
        tips.append("Your tech stack closely mirrors the core requirements for this position.")
    elif percentage > 0:
        tips.append("Review the job description to emphasize transferable system design patterns.")

    return JSONResponse({
        "data": {
            "match_percentage": percentage,
            "matched_skills": matched,
            "missing_skills": missing,
            "alignment_summary": f"Matched {len(matched)} of {len(required_skills)} key technical competencies." if required_skills else "No specific technical competencies specified.",
            "tailoring_tips": tips,
        },
        "error": None,
    })
