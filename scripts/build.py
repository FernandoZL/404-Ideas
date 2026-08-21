#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import re
import shutil
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "contenido"
GENERATED = ROOT / "data" / "generated"
SITE = ROOT / "_site"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
AUDIO_EXTS = {".mp3", ".m4a", ".aac", ".wav"}
VIDEO_EXTS = {".mp4", ".mov", ".m4v"}

def parse_scalar(value: str):
    value = value.strip()
    if value == "":
        return ""
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    return value

def parse_front_matter(text: str):
    if not text.startswith("---"):
        return {}, text

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text

    raw = parts[1].strip().splitlines()
    body = parts[2].lstrip()
    data = {}
    current_list = None

    for line in raw:
        if not line.strip():
            continue

        if re.match(r"^\s*-\s+", line) and current_list:
            if not isinstance(data.get(current_list), list):
                data[current_list] = []
            data[current_list].append(
                re.sub(r"^\s*-\s+", "", line).strip()
            )
            continue

        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not match:
            continue

        key, value = match.groups()

        if value == "":
            data[key] = ""
            current_list = key
        elif value == "[]":
            data[key] = []
            current_list = None
        else:
            data[key] = parse_scalar(value)
            current_list = None

    return data, body

def find_media(folder: Path):
    images, audio, videos = [], [], []

    for item in sorted(folder.iterdir(), key=lambda p: p.name.lower()):
        if not item.is_file():
            continue

        ext = item.suffix.lower()

        if ext in IMAGE_EXTS:
            images.append(item.name)
        elif ext in AUDIO_EXTS:
            audio.append(item.name)
        elif ext in VIDEO_EXTS:
            videos.append(item.name)

    return images, audio, videos

def discover_memories():
    base = CONTENT / "recuerdos"
    memories = []
    warnings = []
    errors = []

    if not base.exists():
        return memories, warnings, errors

    for md in sorted(base.rglob("recuerdo.md")):
        # Never index inbox even if structure changes later.
        if "inbox" in md.parts:
            continue

        folder = md.parent
        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        date = str(meta.get("fecha", "")).strip()
        title = str(meta.get("titulo", "")).strip()

        if not date:
            errors.append(f"{md.relative_to(ROOT)}: falta 'fecha'.")
            continue

        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            errors.append(f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD.")
            continue

        if not title:
            # Fallback from directory slug.
            slug = folder.name
            title = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", slug)
            title = title.replace("-", " ").strip().title() or "Recuerdo sin título"
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        images, audio, videos = find_media(folder)

        cover = str(meta.get("portada", "")).strip()
        if cover:
            if not (folder / cover).exists():
                errors.append(
                    f"{md.relative_to(ROOT)}: la portada declarada '{cover}' no existe."
                )
                continue
        elif images:
            cover = images[0]
            warnings.append(
                f"{md.relative_to(ROOT)}: sin portada; se usará '{cover}'."
            )

        rel_folder = folder.relative_to(ROOT).as_posix()

        memories.append({
            "id": folder.name,
            "tipo": meta.get("tipo") or "recuerdo",
            "fecha": date,
            "titulo": title,
            "categoria": meta.get("categoria") or "",
            "favorito": bool(meta.get("favorito", False)),
            "portada": cover,
            "tags": meta.get("tags") if isinstance(meta.get("tags"), list) else [],
            "musica": meta.get("musica") or "",
            "lugar": meta.get("lugar") or "",
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "audio": audio,
            "videos": videos,
        })

    memories.sort(key=lambda item: (item["fecha"], item["id"]), reverse=True)
    return memories, warnings, errors

def write_generated(memories):
    GENERATED.mkdir(parents=True, exist_ok=True)

    (GENERATED / "recuerdos.json").write_text(
        json.dumps(memories, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    stats = {
        "recuerdos": len(memories),
        "fotografias": sum(len(m["imagenes"]) for m in memories),
        "videos": sum(len(m["videos"]) for m in memories),
        "audios": sum(len(m["audio"]) for m in memories),
        "favoritos": sum(1 for m in memories if m["favorito"]),
        "ultimaActualizacion": datetime.now().astimezone().isoformat(timespec="seconds"),
    }

    (GENERATED / "estadisticas.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

def copy_if_exists(source: Path, destination: Path):
    if source.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

def build_site(memories):
    if SITE.exists():
        shutil.rmtree(SITE)

    SITE.mkdir(parents=True)

    # Current site: preserved exactly in the first migration.
    copy_if_exists(ROOT / "index.html", SITE / "index.html")
    shutil.copytree(ROOT / "css", SITE / "css")
    shutil.copytree(ROOT / "js", SITE / "js")
    shutil.copytree(ROOT / "data", SITE / "data")
    shutil.copytree(ROOT / "herramientas", SITE / "herramientas")

    # Keep the existing song if the repository already contains it.
    copy_if_exists(ROOT / "dembow.mp3", SITE / "dembow.mp3")

    # Publish only media that belongs to indexed memories.
    for memory in memories:
        source_folder = ROOT / memory["carpeta"]
        target_folder = SITE / memory["carpeta"]
        target_folder.mkdir(parents=True, exist_ok=True)

        for filename in memory["imagenes"] + memory["audio"] + memory["videos"]:
            copy_if_exists(source_folder / filename, target_folder / filename)

    # Explicitly do NOT copy contenido/inbox.

def main():
    memories, warnings, errors = discover_memories()

    for warning in warnings:
        print(f"WARNING: {warning}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    write_generated(memories)
    build_site(memories)

    print("=" * 62)
    print("NUESTRO LUGAR - BUILD CORRECTO")
    print("=" * 62)
    print(f"Recuerdos:   {len(memories)}")
    print(f"Fotografías: {sum(len(m['imagenes']) for m in memories)}")
    print(f"Salida:       {SITE}")
    print("Inbox:        excluido de publicación")
    print("=" * 62)

if __name__ == "__main__":
    main()
