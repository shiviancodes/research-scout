import json
import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

DOMAINS = ("finance", "healthcare", "energy", "concepts")

TYPE_MAP = {
    "brief": "project-brief",
    "concept": "concept",
    "findings": "findings",
    "synthesis": "synthesis",
}

FILENAME_RE = re.compile(r"^(?P<year>\d{4})-W(?P<week>\d{2})-(?P<rest>.+)\.md$")


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


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("BACKEND_PORT", "8766"))
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
