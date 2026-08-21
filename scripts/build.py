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
            "direccion": meta.get("direccion") or "",
            "latitud": meta.get("latitud") or "",
            "longitud": meta.get("longitud") or "",
            "maps": meta.get("maps") or "",
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "audio": audio,
            "videos": videos,
        })

    memories.sort(key=lambda item: (item["fecha"], item["id"]), reverse=True)
    return memories, warnings, errors


def discover_phrases():
    base = CONTENT / "frases"
    phrases = []
    warnings = []
    errors = []

    if not base.exists():
        return phrases, warnings, errors

    for md in sorted(base.rglob("*.md")):
        if md.name.startswith("."):
            continue

        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        phrase_text = body.strip()
        if not phrase_text:
            warnings.append(f"{md.relative_to(ROOT)}: frase vacía; se omitirá.")
            continue

        date = str(meta.get("fecha", "")).strip()
        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                errors.append(
                    f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD o déjala vacía."
                )
                continue

        rel = md.relative_to(base).with_suffix("").as_posix()
        phrase_id = rel.replace("/", "--")

        phrases.append({
            "id": phrase_id,
            "tipo": meta.get("tipo") or "frase",
            "fecha": date,
            "texto": phrase_text,
            "contexto": meta.get("contexto") or "",
            "favorito": bool(meta.get("favorito", False)),
            "origen": meta.get("origen") or "",
        })

    phrases.sort(
        key=lambda item: (item["fecha"] or "0000-00-00", item["id"]),
        reverse=True,
    )
    return phrases, warnings, errors


def discover_letters():
    base = CONTENT / "cartas"
    letters = []
    warnings = []
    errors = []

    if not base.exists():
        return letters, warnings, errors

    for md in sorted(base.rglob("*.md")):
        if md.name.startswith("."):
            continue

        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        if (meta.get("tipo") or "").strip() not in ("", "carta"):
            continue

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
            title = md.parent.name if md.name == "carta.md" else md.stem
            title = title.replace("-", " ").strip().title() or "Carta"
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        folder = md.parent
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

        rel_folder = folder.relative_to(ROOT).as_posix()
        letter_id = (
            folder.name
            if md.name == "carta.md"
            else md.relative_to(base).with_suffix("").as_posix().replace("/", "--")
        )

        letters.append({
            "id": letter_id,
            "tipo": "carta",
            "fecha": date,
            "titulo": title,
            "portada": cover,
            "musica": meta.get("musica") or "",
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "audio": audio,
            "videos": videos,
        })

    letters.sort(key=lambda item: (item["fecha"], item["id"]), reverse=True)
    return letters, warnings, errors


def write_generated(memories, phrases, letters):
    GENERATED.mkdir(parents=True, exist_ok=True)

    (GENERATED / "recuerdos.json").write_text(
        json.dumps(memories, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    (GENERATED / "frases.json").write_text(
        json.dumps(phrases, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    (GENERATED / "cartas.json").write_text(
        json.dumps(letters, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    gallery = []
    for memory in memories:
        for filename in memory["imagenes"]:
            gallery.append({
                "id": f"{memory['id']}::{filename}",
                "recuerdoId": memory["id"],
                "titulo": memory["titulo"],
                "fecha": memory["fecha"],
                "favorito": memory["favorito"],
                "tags": memory["tags"],
                "src": f"{memory['carpeta']}/{filename}",
            })

    gallery.sort(key=lambda item: (item["fecha"], item["id"]), reverse=True)
    (GENERATED / "galeria.json").write_text(
        json.dumps(gallery, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    places_by_key = {}
    for memory in memories:
        place_name = str(memory.get("lugar") or "").strip()
        address = str(memory.get("direccion") or "").strip()
        latitude = str(memory.get("latitud") or "").strip()
        longitude = str(memory.get("longitud") or "").strip()
        maps_url = str(memory.get("maps") or "").strip()

        if not any([place_name, address, latitude, longitude, maps_url]):
            continue

        key = (
            f"{latitude},{longitude}"
            if latitude and longitude
            else (place_name + "|" + address).lower()
        )

        if key not in places_by_key:
            places_by_key[key] = {
                "id": re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")[:90],
                "nombre": place_name,
                "direccion": address,
                "latitud": latitude,
                "longitud": longitude,
                "maps": maps_url,
                "recuerdos": [],
                "primeraFecha": memory["fecha"],
                "ultimaFecha": memory["fecha"],
            }

        place = places_by_key[key]
        place["recuerdos"].append({
            "id": memory["id"],
            "titulo": memory["titulo"],
            "fecha": memory["fecha"],
        })
        place["primeraFecha"] = min(place["primeraFecha"], memory["fecha"])
        place["ultimaFecha"] = max(place["ultimaFecha"], memory["fecha"])

    places = list(places_by_key.values())
    places.sort(key=lambda item: (item["ultimaFecha"], item["nombre"]), reverse=True)

    (GENERATED / "lugares.json").write_text(
        json.dumps(places, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    stats = {
        "recuerdos": len(memories),
        "fotografias": len(gallery),
        "videos": sum(len(m["videos"]) for m in memories),
        "audios": sum(len(m["audio"]) for m in memories),
        "favoritos": sum(1 for m in memories if m["favorito"]),
        "frases": len(phrases),
        "cartas": len(letters),
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

def build_site(memories, letters):
    if SITE.exists():
        shutil.rmtree(SITE)

    SITE.mkdir(parents=True)

    # Public root pages. Keep all navigation pages at the project root so
    # relative paths continue to work on GitHub Pages project sites.
    public_pages = [
        "index.html", "historia.html", "recuerdos.html", "fotos.html",
        "recuerdo.html", "archivo.html", "lugares.html",
        "frases.html", "cartas.html", "carta.html", "expediente-0606.html",
    ]
    for page in public_pages:
        copy_if_exists(ROOT / page, SITE / page)
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


    # Publish media that belongs to letters.
    for letter in letters:
        source_folder = ROOT / letter["carpeta"]
        target_folder = SITE / letter["carpeta"]
        target_folder.mkdir(parents=True, exist_ok=True)

        for filename in letter["imagenes"] + letter["audio"] + letter["videos"]:
            copy_if_exists(source_folder / filename, target_folder / filename)

    # Explicitly do NOT copy contenido/inbox.

def main():
    memories, memory_warnings, memory_errors = discover_memories()
    phrases, phrase_warnings, phrase_errors = discover_phrases()
    letters, letter_warnings, letter_errors = discover_letters()

    warnings = memory_warnings + phrase_warnings + letter_warnings
    errors = memory_errors + phrase_errors + letter_errors

    for warning in warnings:
        print(f"WARNING: {warning}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    write_generated(memories, phrases, letters)
    build_site(memories, letters)

    print("=" * 62)
    print("NUESTRO LUGAR - BUILD CORRECTO")
    print("=" * 62)
    print(f"Recuerdos:   {len(memories)}")
    print(f"Fotografías: {sum(len(m['imagenes']) for m in memories)}")
    print(f"Frases:      {len(phrases)}")
    print(f"Cartas:      {len(letters)}")
    print(f"Salida:       {SITE}")
    print("Inbox:        excluido de publicación")
    print("=" * 62)

if __name__ == "__main__":
    main()
