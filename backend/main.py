import json
import mimetypes
import os
import re
from datetime import date, datetime
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

OUTPUTS_DIR = PROJECT_ROOT / "outputs"
PROMPTS_DIR = PROJECT_ROOT / "prompts"
REGISTRY_PATH = OUTPUTS_DIR / "registry.json"
WORKSPACE_PATH = OUTPUTS_DIR / "ideas-workspace.json"
STANDARDS_PATH = PROMPTS_DIR / "STANDARDS.md"

if not WORKSPACE_PATH.exists():
    WORKSPACE_PATH.write_text('{"ideas": {}}', encoding="utf-8")

INPUTS_DIR = PROJECT_ROOT / "inputs"
SETTINGS_PATH = INPUTS_DIR / "settings.json"
UPLOAD_DOMAINS = ("finance", "healthcare", "energy")
DOMAINS = ("finance", "healthcare", "energy", "concepts")

TYPE_MAP = {
    "brief": "project-brief",
    "concept": "concept",
    "findings": "findings",
    "synthesis": "synthesis",
}

FILENAME_RE = re.compile(r"^(?P<year>\d{4})-W(?P<week>\d{2})-(?P<rest>.+)\.md$")
SLUG_SAFE = re.compile(r"[^a-z0-9]+")


def _slugify(text: str) -> str:
    slug = SLUG_SAFE.sub("-", text.lower()).strip("-")
    return slug[:60]


def _unique_slug(registry_ideas: list, base: str) -> str:
    existing = {e["slug"] for e in registry_ideas}
    slug = base
    n = 2
    while slug in existing:
        slug = f"{base[:57]}-{n}"
        n += 1
    return slug


def _read_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"ideas": []}
    try:
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Registry file is not valid JSON: {exc.msg} at line {exc.lineno}.",
        )


def _write_registry(data: dict) -> None:
    REGISTRY_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _parse_md_meta(content: str) -> tuple[str, str]:
    """Return (title, summary) from markdown. Raises HTTPException if no H1 found."""
    lines = content.splitlines()
    title: Optional[str] = None
    summary: Optional[str] = None

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not stripped.startswith("## "):
            title = stripped[2:].strip()
            break

    if title is None:
        raise HTTPException(
            status_code=400,
            detail="File must contain a top-level heading (# Title).",
        )

    # First paragraph after ## Overview, fall back to first non-heading paragraph
    in_overview = False
    for line in lines:
        stripped = line.strip()
        if re.match(r"^## overview", stripped, re.IGNORECASE):
            in_overview = True
            continue
        if in_overview:
            if stripped.startswith("#"):
                break
            if stripped:
                summary = stripped
                break

    if summary is None:
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                summary = stripped
                break

    return title, summary or ""


def _safe_filename(name: str) -> str:
    """Strip path traversal characters from an uploaded filename."""
    name = re.sub(r"[/\\]", "", name)
    name = name.lstrip(".")
    return name or "upload"


app = FastAPI(title="research-scout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class StandardsBody(BaseModel):
    content: str


class WorkspacePatch(BaseModel):
    status: Optional[str] = None
    todos: Optional[list[str]] = None
    archived: Optional[bool] = None
    archived_at: Optional[str] = None
    remove_entry: Optional[bool] = None


class RegisterBody(BaseModel):
    slug: str
    title: str
    summary: str
    domain: str
    tier: Literal["brief", "concept"]
    path: str
    sources: Optional[list[str]] = None


class InputsSettingsPatch(BaseModel):
    domain: str
    active: bool


def parse_filename(filename: str) -> dict:
    match = FILENAME_RE.match(filename)
    if not match:
        return {"date": None, "type": "unknown"}
    year = match.group("year")
    week = match.group("week")
    rest = match.group("rest")
    trailing = rest.rsplit("-", 1)[-1].lower()
    file_type = TYPE_MAP.get(trailing, "unknown")
    return {"date": f"{year}-W{week}", "type": file_type}


def resolve_inside(base: Path, *parts: str) -> Path:
    candidate = (base / Path(*parts)).resolve()
    base_resolved = base.resolve()
    if base_resolved != candidate and base_resolved not in candidate.parents:
        raise HTTPException(status_code=400, detail="Invalid path.")
    return candidate


@app.get("/api/outputs")
def list_outputs():
    if not OUTPUTS_DIR.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Outputs directory not found at {OUTPUTS_DIR}.",
        )
    items = []
    for domain in DOMAINS:
        domain_dir = OUTPUTS_DIR / domain
        if not domain_dir.exists():
            continue
        for md in sorted(domain_dir.glob("*.md")):
            meta = parse_filename(md.name)
            items.append(
                {
                    "domain": domain,
                    "filename": md.name,
                    "date": meta["date"],
                    "type": meta["type"],
                    "path": str(md.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                }
            )
    return items


@app.get("/api/outputs/{domain}/{filename}")
def get_output(domain: str, filename: str):
    if domain not in DOMAINS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown domain '{domain}'. Expected one of: {', '.join(DOMAINS)}.",
        )
    domain_dir = OUTPUTS_DIR / domain
    target = resolve_inside(domain_dir, filename)
    if target.parent != domain_dir.resolve() or not target.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"File '{filename}' not found in domain '{domain}'.",
        )
    meta = parse_filename(target.name)
    return {
        "content": target.read_text(encoding="utf-8"),
        "metadata": {
            "domain": domain,
            "filename": target.name,
            "date": meta["date"],
            "type": meta["type"],
        },
    }


@app.get("/api/registry")
def get_registry():
    if not REGISTRY_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Registry not found at {REGISTRY_PATH.relative_to(PROJECT_ROOT)}.",
        )
    try:
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Registry file is not valid JSON: {exc.msg} at line {exc.lineno}.",
        )


@app.get("/api/standards")
def get_standards():
    if not STANDARDS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Standards file not found at {STANDARDS_PATH.relative_to(PROJECT_ROOT)}.",
        )
    return {"content": STANDARDS_PATH.read_text(encoding="utf-8")}


@app.post("/api/standards")
def save_standards(body: StandardsBody):
    if not PROMPTS_DIR.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Prompts directory not found at {PROMPTS_DIR.relative_to(PROJECT_ROOT)}.",
        )
    STANDARDS_PATH.write_text(body.content, encoding="utf-8")
    return {"content": body.content, "path": str(STANDARDS_PATH.relative_to(PROJECT_ROOT)).replace("\\", "/")}


@app.get("/api/workspace")
def get_workspace():
    if not WORKSPACE_PATH.exists():
        return {"ideas": {}}
    try:
        return json.loads(WORKSPACE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Workspace file is not valid JSON: {exc.msg} at line {exc.lineno}.",
        )


SLUG_RE = re.compile(r'^[a-z0-9-]+$')


@app.post("/api/workspace/{slug}")
def update_workspace(slug: str, patch: WorkspacePatch):
    if not SLUG_RE.fullmatch(slug):
        raise HTTPException(status_code=400, detail="Invalid slug.")
    if WORKSPACE_PATH.exists():
        try:
            data = json.loads(WORKSPACE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Workspace file is not valid JSON: {exc.msg} at line {exc.lineno}.",
            )
    else:
        data = {"ideas": {}}
    ideas = data.setdefault("ideas", {})
    if patch.remove_entry:
        ideas.pop(slug, None)
        WORKSPACE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return {"slug": slug, "removed": True}
    entry = dict(ideas.get(slug, {}))
    update = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if k != "remove_entry"}
    entry.update(update)
    ideas[slug] = entry
    WORKSPACE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"slug": slug, **entry}


@app.post("/api/outputs/upload")
async def upload_output(
    domain: str = Form(...),
    tier: str = Form(...),
    file: UploadFile = File(...),
):
    if domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"domain must be one of: {', '.join(UPLOAD_DOMAINS)}.",
        )
    if tier not in ("brief", "concept"):
        raise HTTPException(status_code=400, detail="tier must be 'brief' or 'concept'.")

    content = (await file.read()).decode("utf-8", errors="replace")
    title, summary = _parse_md_meta(content)

    registry = _read_registry()
    ideas = registry.setdefault("ideas", [])
    slug = _unique_slug(ideas, _slugify(title))

    iso = datetime.now().isocalendar()
    base_name = f"{iso.year}-W{iso.week:02d}-{tier}.md"
    target = OUTPUTS_DIR / domain / base_name
    if target.exists():
        base_name = f"{iso.year}-W{iso.week:02d}-{slug}-{tier}.md"
        target = OUTPUTS_DIR / domain / base_name

    target.write_text(content, encoding="utf-8")

    entry = {
        "slug": slug,
        "title": title,
        "tier": tier,
        "domain": domain,
        "path": f"outputs/{domain}/{base_name}",
        "summary": summary,
        "created": date.today().isoformat(),
        "sources": [],
        "user_uploaded": True,
    }
    ideas.append(entry)
    _write_registry(registry)
    return entry


@app.post("/api/registry/register")
def register_output(body: RegisterBody):
    if not SLUG_RE.fullmatch(body.slug):
        raise HTTPException(status_code=400, detail="Invalid slug.")
    if body.domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"domain must be one of: {', '.join(UPLOAD_DOMAINS)}.",
        )

    # Validate path is relative to PROJECT_ROOT and resolves inside OUTPUTS_DIR
    try:
        resolved = resolve_inside(PROJECT_ROOT, *body.path.replace("\\", "/").split("/"))
    except HTTPException:
        raise HTTPException(status_code=400, detail="path must resolve inside outputs/.")
    if OUTPUTS_DIR.resolve() not in resolved.parents:
        raise HTTPException(status_code=400, detail="path must resolve inside outputs/.")
    if resolved.suffix.lower() != ".md" or not resolved.is_file():
        raise HTTPException(status_code=400, detail="path must point to an existing .md file.")

    registry = _read_registry()
    ideas = registry.setdefault("ideas", [])
    if any(e["slug"] == body.slug for e in ideas):
        raise HTTPException(
            status_code=409, detail=f"Slug '{body.slug}' already exists in registry."
        )

    entry = {
        "slug": body.slug,
        "title": body.title,
        "tier": body.tier,
        "domain": body.domain,
        "path": body.path,
        "summary": body.summary,
        "created": date.today().isoformat(),
        "sources": body.sources or [],
        "user_uploaded": True,
    }
    ideas.append(entry)
    _write_registry(registry)
    return entry


@app.get("/api/inputs")
def list_inputs():
    items = []
    for domain in UPLOAD_DOMAINS:
        domain_dir = INPUTS_DIR / domain
        if not domain_dir.exists():
            continue
        for f in sorted(domain_dir.iterdir()):
            if f.name == ".gitkeep" or not f.is_file():
                continue
            items.append(
                {
                    "domain": domain,
                    "filename": f.name,
                    "size": f.stat().st_size,
                    "path": str(f.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                }
            )
    return items


_DEFAULT_SETTINGS = {"energy": False, "finance": False, "healthcare": False}


@app.get("/api/inputs/settings")
def get_inputs_settings():
    if not SETTINGS_PATH.exists():
        return dict(_DEFAULT_SETTINGS)
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Settings file is not valid JSON: {exc.msg} at line {exc.lineno}.",
        )


@app.post("/api/inputs/settings")
def update_inputs_settings(patch: InputsSettingsPatch):
    if patch.domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"domain must be one of: {', '.join(UPLOAD_DOMAINS)}.",
        )
    if SETTINGS_PATH.exists():
        try:
            settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            settings = dict(_DEFAULT_SETTINGS)
    else:
        settings = dict(_DEFAULT_SETTINGS)
    settings[patch.domain] = patch.active
    SETTINGS_PATH.write_text(json.dumps(settings, indent=2), encoding="utf-8")
    return settings


@app.post("/api/inputs/{domain}")
async def upload_input(domain: str, file: UploadFile = File(...)):
    if domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"domain must be one of: {', '.join(UPLOAD_DOMAINS)}.",
        )
    domain_dir = INPUTS_DIR / domain
    domain_dir.mkdir(parents=True, exist_ok=True)

    safe_name = _safe_filename(file.filename or "upload")
    target = resolve_inside(domain_dir, safe_name)
    content = await file.read()
    target.write_bytes(content)

    return {
        "domain": domain,
        "filename": safe_name,
        "path": str(target.relative_to(PROJECT_ROOT)).replace("\\", "/"),
    }


@app.get("/api/inputs/{domain}/{filename}")
def get_input(domain: str, filename: str):
    if domain not in UPLOAD_DOMAINS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown domain '{domain}'.",
        )
    domain_dir = INPUTS_DIR / domain
    target = resolve_inside(domain_dir, filename)
    if not target.is_file():
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    mime, _ = mimetypes.guess_type(filename)
    return Response(
        content=target.read_bytes(),
        media_type=mime or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("BACKEND_PORT", "8766"))
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
