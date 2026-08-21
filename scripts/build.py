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


def content_is_public(meta: dict) -> bool:
    """Return False for drafts/hidden content, True otherwise.

    Missing `publicado` intentionally means public for backward compatibility.
    Supported hidden aliases:
      publicado: false
      estado: borrador | privado | oculto
    """
    estado = str(meta.get("estado", "")).strip().lower()
    if estado in {"borrador", "privado", "oculto", "draft"}:
        return False

    value = meta.get("publicado", True)

    if isinstance(value, bool):
        return value

    return str(value).strip().lower() not in {
        "false", "0", "no", "off", "borrador", "privado", "oculto"
    }

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

        if not content_is_public(meta):
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

        if not content_is_public(meta):
            continue

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

        if not content_is_public(meta):
            continue

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



def discover_dates():
    base = CONTENT / "fechas"
    dates = []
    warnings = []
    errors = []

    if not base.exists():
        return dates, warnings, errors

    for md in sorted(base.rglob("*.md")):
        if md.name.startswith("."):
            continue

        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        if not content_is_public(meta):
            continue

        if (meta.get("tipo") or "fecha") != "fecha":
            continue

        date = str(meta.get("fecha", "")).strip()
        title = str(meta.get("titulo", "")).strip()

        if not date:
            errors.append(f"{md.relative_to(ROOT)}: falta 'fecha'.")
            continue

        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD."
            )
            continue

        if not title:
            title = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", md.stem)
            title = title.replace("-", " ").strip().title() or "Fecha importante"
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        dates.append({
            "id": md.stem,
            "tipo": "fecha",
            "clave": str(meta.get("clave", "")).strip(),
            "fecha": date,
            "titulo": title,
            "contador": bool(meta.get("contador", False)),
            "aniversario": bool(meta.get("aniversario", False)),
            "destacada": bool(meta.get("destacada", False)),
            "enlace": str(meta.get("enlace", "")).strip(),
            "mensajeAniversario": str(meta.get("mensaje_aniversario", "")).strip(),
            "texto": body.strip(),
        })

    keys = [item["clave"] for item in dates if item["clave"]]
    duplicated_keys = sorted({key for key in keys if keys.count(key) > 1})
    for key in duplicated_keys:
        errors.append(f"contenido/fechas: clave duplicada '{key}'.")

    dates.sort(key=lambda item: (item["fecha"], item["id"]))
    return dates, warnings, errors


def discover_songs():
    base = CONTENT / "canciones"
    songs = []
    warnings = []
    errors = []

    if not base.exists():
        return songs, warnings, errors

    for md in sorted(base.rglob("*.md")):
        if md.name.startswith("."):
            continue

        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        if not content_is_public(meta):
            continue

        if (meta.get("tipo") or "cancion") != "cancion":
            continue

        date = str(meta.get("fecha", "")).strip()
        title = str(meta.get("titulo", "")).strip()
        artist = str(meta.get("artista", "")).strip()
        filename = str(meta.get("archivo", "")).strip()
        root_file = bool(meta.get("archivo_raiz", False))
        spotify = str(meta.get("spotify", "")).strip()
        youtube = str(meta.get("youtube", "")).strip()
        apple_music = str(meta.get("apple_music", "")).strip()
        cover = str(meta.get("portada", "")).strip()

        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                errors.append(
                    f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD o déjala vacía."
                )
                continue

        if not title:
            title = md.parent.name if md.name == "cancion.md" else md.stem
            title = title.replace("-", " ").strip().title() or "Canción"
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        folder = md.parent
        images, audio, _ = find_media(folder)

        audio_src = ""

        if filename:
            if root_file:
                if not (ROOT / filename).exists():
                    errors.append(
                        f"{md.relative_to(ROOT)}: archivo raíz '{filename}' no existe."
                    )
                    continue
                audio_src = filename
            else:
                if not (folder / filename).exists():
                    errors.append(
                        f"{md.relative_to(ROOT)}: archivo de audio '{filename}' no existe en la carpeta."
                    )
                    continue
                audio_src = f"{folder.relative_to(ROOT).as_posix()}/{filename}"
        elif audio:
            filename = audio[0]
            audio_src = f"{folder.relative_to(ROOT).as_posix()}/{filename}"

        if cover:
            if not (folder / cover).exists():
                errors.append(
                    f"{md.relative_to(ROOT)}: portada '{cover}' no existe."
                )
                continue
        elif images:
            cover = images[0]

        if not audio_src and not any([spotify, youtube, apple_music]):
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene archivo local ni enlace externo."
            )

        rel_folder = folder.relative_to(ROOT).as_posix()
        song_id = (
            folder.name
            if md.name == "cancion.md"
            else md.relative_to(base).with_suffix("").as_posix().replace("/", "--")
        )

        songs.append({
            "id": song_id,
            "tipo": "cancion",
            "fecha": date,
            "titulo": title,
            "artista": artist,
            "archivo": filename,
            "src": audio_src,
            "archivoRaiz": root_file,
            "spotify": spotify,
            "youtube": youtube,
            "appleMusic": apple_music,
            "portada": cover,
            "favorito": bool(meta.get("favorito", False)),
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "audio": audio,
        })

    songs.sort(
        key=lambda item: (item["fecha"] or "0000-00-00", item["id"]),
        reverse=True,
    )
    return songs, warnings, errors


def discover_video_entries():
    base = CONTENT / "videos"
    items = []
    warnings = []
    errors = []

    if not base.exists():
        return items, warnings, errors

    for md in sorted(base.rglob("*.md")):
        if md.name.startswith("."):
            continue

        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        if not content_is_public(meta):
            continue

        if (meta.get("tipo") or "video") != "video":
            continue

        date = str(meta.get("fecha", "")).strip()
        title = str(meta.get("titulo", "")).strip()
        filename = str(meta.get("archivo", "")).strip()
        youtube = str(meta.get("youtube", "")).strip()
        cover = str(meta.get("portada", "")).strip()

        if not date:
            errors.append(f"{md.relative_to(ROOT)}: falta 'fecha'.")
            continue

        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            errors.append(
                f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD."
            )
            continue

        if not title:
            title = md.parent.name if md.name == "video.md" else md.stem
            title = title.replace("-", " ").strip().title() or "Video"
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        folder = md.parent
        images, _, videos = find_media(folder)

        video_src = ""

        if filename:
            if not (folder / filename).exists():
                errors.append(
                    f"{md.relative_to(ROOT)}: archivo de video '{filename}' no existe."
                )
                continue
            video_src = f"{folder.relative_to(ROOT).as_posix()}/{filename}"
        elif videos:
            filename = videos[0]
            video_src = f"{folder.relative_to(ROOT).as_posix()}/{filename}"

        if cover:
            if not (folder / cover).exists():
                errors.append(
                    f"{md.relative_to(ROOT)}: portada '{cover}' no existe."
                )
                continue
        elif images:
            cover = images[0]

        if not video_src and not youtube:
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene video local ni enlace de YouTube."
            )

        rel_folder = folder.relative_to(ROOT).as_posix()
        video_id = (
            folder.name
            if md.name == "video.md"
            else md.relative_to(base).with_suffix("").as_posix().replace("/", "--")
        )

        items.append({
            "id": video_id,
            "tipo": "video",
            "fecha": date,
            "titulo": title,
            "archivo": filename,
            "src": video_src,
            "youtube": youtube,
            "portada": cover,
            "favorito": bool(meta.get("favorito", False)),
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "videos": videos,
        })

    items.sort(key=lambda item: (item["fecha"], item["id"]), reverse=True)
    return items, warnings, errors



def discover_specials():
    base = CONTENT / "especiales"
    items = []
    warnings = []
    errors = []

    if not base.exists():
        return items, warnings, errors

    for md in sorted(base.rglob("info.md")):
        text = md.read_text(encoding="utf-8")
        meta, body = parse_front_matter(text)

        if not content_is_public(meta):
            continue

        if (meta.get("tipo") or "especial") != "especial":
            continue

        date = str(meta.get("fecha", "")).strip()
        title = str(meta.get("titulo", "")).strip()
        filename = str(meta.get("archivo", "index.html")).strip() or "index.html"
        cover = str(meta.get("portada", "")).strip()

        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                errors.append(
                    f"{md.relative_to(ROOT)}: fecha inválida '{date}'. Usa AAAA-MM-DD o déjala vacía."
                )
                continue

        if not title:
            title = md.parent.name.replace("-", " ").title()
            warnings.append(
                f"{md.relative_to(ROOT)}: no tiene título; se usará '{title}'."
            )

        folder = md.parent
        target_file = folder / filename

        if not target_file.exists():
            errors.append(
                f"{md.relative_to(ROOT)}: archivo especial '{filename}' no existe."
            )
            continue

        if target_file.suffix.lower() != ".html":
            warnings.append(
                f"{md.relative_to(ROOT)}: '{filename}' no es HTML; se publicará igualmente como archivo."
            )

        images, audio, videos = find_media(folder)

        if cover:
            if not (folder / cover).exists():
                errors.append(
                    f"{md.relative_to(ROOT)}: portada '{cover}' no existe."
                )
                continue
        elif images:
            cover = images[0]

        rel_folder = folder.relative_to(ROOT).as_posix()

        items.append({
            "id": folder.name,
            "tipo": "especial",
            "fecha": date,
            "titulo": title,
            "archivo": filename,
            "url": f"{rel_folder}/{filename}",
            "portada": cover,
            "favorito": bool(meta.get("favorito", False)),
            "texto": body.strip(),
            "carpeta": rel_folder,
            "imagenes": images,
            "audio": audio,
            "videos": videos,
        })

    items.sort(
        key=lambda item: (item["fecha"] or "0000-00-00", item["id"]),
        reverse=True,
    )
    return items, warnings, errors


def write_generated(memories, phrases, letters, dates, songs, video_entries, specials):
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

    (GENERATED / "fechas.json").write_text(
        json.dumps(dates, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    (GENERATED / "canciones.json").write_text(
        json.dumps(songs, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    (GENERATED / "videos.json").write_text(
        json.dumps(video_entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    (GENERATED / "especiales.json").write_text(
        json.dumps(specials, ensure_ascii=False, indent=2) + "\n",
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


    # "Recuérdame algo bonito" can pull from any meaningful PUBLIC part
    # of the archive. Technical files, drafts, inbox, tools and admin are
    # intentionally excluded.
    random_groups = {
        "recuerdos": [],
        "fotos": [],
        "frases": [],
        "cartas": [],
        "fechas": [],
        "canciones": [],
        "videos": [],
        "sorpresas": [],
        "lugares": [],
        "expediente": [],
    }

    for memory in memories:
        image = ""
        if memory.get("portada"):
            image = f"{memory['carpeta']}/{memory['portada']}"
        elif memory.get("imagenes"):
            image = f"{memory['carpeta']}/{memory['imagenes'][0]}"

        random_groups["recuerdos"].append({
            "id": memory["id"],
            "tipo": "recuerdo",
            "etiqueta": "Recuerdo",
            "fecha": memory.get("fecha") or "",
            "titulo": memory.get("titulo") or "Un recuerdo",
            "texto": memory.get("texto") or "",
            "imagen": image,
            "url": f"recuerdo.html?id={memory['id']}",
            "accion": "Abrir recuerdo",
        })

    for photo in gallery:
        random_groups["fotos"].append({
            "id": photo["id"],
            "tipo": "foto",
            "etiqueta": "Fotografía",
            "fecha": photo.get("fecha") or "",
            "titulo": photo.get("titulo") or "Una fotografía nuestra",
            "texto": "Una imagen guardada dentro de nuestra historia.",
            "imagen": photo.get("src") or "",
            "url": f"recuerdo.html?id={photo['recuerdoId']}",
            "accion": "Ver fotografía",
        })

    for phrase in phrases:
        random_groups["frases"].append({
            "id": phrase["id"],
            "tipo": "frase",
            "etiqueta": "Frase nuestra",
            "fecha": phrase.get("fecha") or "",
            "titulo": "Una frase nuestra",
            "texto": phrase.get("texto") or "",
            "imagen": "",
            "url": "frases.html",
            "accion": "Ver frases",
        })

    for letter in letters:
        image = ""
        if letter.get("portada"):
            image = f"{letter['carpeta']}/{letter['portada']}"
        elif letter.get("imagenes"):
            image = f"{letter['carpeta']}/{letter['imagenes'][0]}"

        random_groups["cartas"].append({
            "id": letter["id"],
            "tipo": "carta",
            "etiqueta": "Carta",
            "fecha": letter.get("fecha") or "",
            "titulo": letter.get("titulo") or "Una carta",
            "texto": letter.get("texto") or "",
            "imagen": image,
            "url": f"carta.html?id={letter['id']}",
            "accion": "Leer carta",
        })

    for item in dates:
        random_groups["fechas"].append({
            "id": item["id"],
            "tipo": "fecha",
            "etiqueta": "Fecha importante",
            "fecha": item.get("fecha") or "",
            "titulo": item.get("titulo") or "Una fecha importante",
            "texto": item.get("texto") or "",
            "imagen": "",
            "url": item.get("enlace") or "fechas.html",
            "accion": "Volver a esa fecha",
        })

    for song in songs:
        image = ""
        if song.get("portada"):
            image = f"{song['carpeta']}/{song['portada']}"
        elif song.get("imagenes"):
            image = f"{song['carpeta']}/{song['imagenes'][0]}"

        random_groups["canciones"].append({
            "id": song["id"],
            "tipo": "cancion",
            "etiqueta": "Canción",
            "fecha": song.get("fecha") or "",
            "titulo": song.get("titulo") or "Una canción",
            "texto": song.get("texto") or "",
            "imagen": image,
            "url": f"cancion.html?id={song['id']}",
            "accion": "Escuchar",
        })

    for item in video_entries:
        image = ""
        if item.get("portada"):
            image = f"{item['carpeta']}/{item['portada']}"
        elif item.get("imagenes"):
            image = f"{item['carpeta']}/{item['imagenes'][0]}"

        random_groups["videos"].append({
            "id": item["id"],
            "tipo": "video",
            "etiqueta": "Video",
            "fecha": item.get("fecha") or "",
            "titulo": item.get("titulo") or "Un video",
            "texto": item.get("texto") or "",
            "imagen": image,
            "url": f"video.html?id={item['id']}",
            "accion": "Ver video",
        })

    for item in specials:
        image = ""
        if item.get("portada"):
            image = f"{item['carpeta']}/{item['portada']}"
        elif item.get("imagenes"):
            image = f"{item['carpeta']}/{item['imagenes'][0]}"

        random_groups["sorpresas"].append({
            "id": item["id"],
            "tipo": "sorpresa",
            "etiqueta": "Sorpresa",
            "fecha": item.get("fecha") or "",
            "titulo": item.get("titulo") or "Una sorpresa",
            "texto": item.get("texto") or "",
            "imagen": image,
            "url": item.get("url") or "sorpresas.html",
            "accion": "Abrir sorpresa",
        })

    for place in places:
        memory_names = ", ".join(
            memory.get("titulo") or ""
            for memory in (place.get("recuerdos") or [])[:3]
            if memory.get("titulo")
        )

        description = place.get("direccion") or ""
        if memory_names:
            description = (
                f"{description}. {memory_names}".strip(". ")
                if description
                else memory_names
            )

        random_groups["lugares"].append({
            "id": place["id"],
            "tipo": "lugar",
            "etiqueta": "Nuestro lugar",
            "fecha": place.get("ultimaFecha") or "",
            "titulo": place.get("nombre") or "Un lugar nuestro",
            "texto": description or "Un lugar que terminó formando parte de nuestra historia.",
            "imagen": "",
            "url": f"lugares.html?lugar={place['id']}",
            "accion": "Ver lugar",
        })

    # The original #0606 contains several pieces of the relationship that
    # are still part of the archive, even though they predate the new CMS.
    legacy_entries = [
        (
            "historia",
            "Cómo empezó todo",
            "Todo empezó en el trabajo, entre mensajes, pendientes, bromas y conversaciones que fueron dejando de sentirse casuales."
        ),
        (
            "perfil",
            "Tu forma de ser",
            "Cosas tuyas que fui notando y que hicieron que hablar contigo se sintiera diferente."
        ),
        (
            "datos",
            "Cosas que recuerdo",
            "Pequeños detalles a los que puse atención porque venían de ti."
        ),
        (
            "contador",
            "Nuestros tiempos",
            "Tres momentos distintos que terminaron llevándome a lo mismo: tú."
        ),
        (
            "junio",
            "6 de junio",
            "El día de una pregunta bastante informal detrás de la que había cariño, confianza y muchas ganas de elegirte."
        ),
        (
            "milveces",
            "Te amo x1000 ❤️",
            "Como una vez no alcanza, hice un pequeño programa para repetirlo."
        ),
        (
            "final",
            "Un último detalle",
            "Gracias por llegar a mi vida de una forma tan inesperada. Me encanta lo que estamos construyendo."
        ),
    ]

    for section, title, text in legacy_entries:
        random_groups["expediente"].append({
            "id": f"0606-{section}",
            "tipo": "expediente",
            "etiqueta": "Expediente #0606",
            "fecha": "2026-06-06",
            "titulo": title,
            "texto": text,
            "imagen": "",
            "url": f"expediente-0606.html?seccion={section}",
            "accion": "Abrir expediente",
        })

    (GENERATED / "azar.json").write_text(
        json.dumps(random_groups, ensure_ascii=False, indent=2) + "\n",
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
        "fechas": len(dates),
        "canciones": len(songs),
        "videosArchivo": len(video_entries),
        "especiales": len(specials),
        "azar": sum(len(group) for group in random_groups.values()),
        "ultimaActualizacion": datetime.now().astimezone().isoformat(timespec="seconds"),
    }

    (GENERATED / "estadisticas.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_public_site():
    forbidden_path = SITE / "herramientas"
    if forbidden_path.exists():
        raise RuntimeError(
            "SEGURIDAD: _site/herramientas no debe existir en la publicación."
        )

    forbidden_tokens = (
        "herramientas/editor",
        "/herramientas/",
        "Guardar algo nuevo",
        "Preparar para publicar",
    )

    leaks = []
    for path in SITE.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".json"}:
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")
        for token in forbidden_tokens:
            if token in text:
                leaks.append(f"{path.relative_to(SITE)} -> {token}")

    if leaks:
        raise RuntimeError(
            "SEGURIDAD: se encontraron referencias administrativas en el sitio público:\n"
            + "\n".join(leaks)
        )

    if (SITE / "contenido" / "inbox").exists():
        raise RuntimeError(
            "SEGURIDAD: contenido/inbox nunca debe copiarse al sitio público."
        )


    admin_dir = SITE / "gestion-8f3c6a91"
    if not admin_dir.exists():
        raise RuntimeError(
            "ADMIN: el panel web no fue copiado al sitio."
        )

    public_link_leaks = []
    for page in SITE.glob("*.html"):
        text = page.read_text(encoding="utf-8", errors="ignore")
        if "gestion-8f3c6a91" in text:
            public_link_leaks.append(page.name)

    if public_link_leaks:
        raise RuntimeError(
            "ADMIN: el enlace del panel apareció en páginas públicas: "
            + ", ".join(public_link_leaks)
        )


def copy_if_exists(source: Path, destination: Path):
    if source.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

def build_site(memories, letters, songs, video_entries, specials):
    if SITE.exists():
        shutil.rmtree(SITE)

    SITE.mkdir(parents=True)

    # Public root pages. Keep all navigation pages at the project root so
    # relative paths continue to work on GitHub Pages project sites.
    public_pages = [
        "index.html", "historia.html", "recuerdos.html", "fotos.html",
        "recuerdo.html", "archivo.html", "lugares.html",
        "frases.html", "cartas.html", "carta.html", "fechas.html",
        "canciones.html", "cancion.html", "videos.html", "video.html",
        "sorpresas.html", "expediente-0606.html",
    ]
    for page in public_pages:
        copy_if_exists(ROOT / page, SITE / page)
    shutil.copytree(ROOT / "css", SITE / "css")
    shutil.copytree(ROOT / "js", SITE / "js")
    shutil.copytree(ROOT / "data", SITE / "data")

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


    # Publish media that belongs to songs.
    for song in songs:
        source_folder = ROOT / song["carpeta"]
        target_folder = SITE / song["carpeta"]
        target_folder.mkdir(parents=True, exist_ok=True)

        for filename in song["imagenes"] + song["audio"]:
            copy_if_exists(source_folder / filename, target_folder / filename)

    # Publish media that belongs to standalone videos.
    for item in video_entries:
        source_folder = ROOT / item["carpeta"]
        target_folder = SITE / item["carpeta"]
        target_folder.mkdir(parents=True, exist_ok=True)

        for filename in item["imagenes"] + item["videos"]:
            copy_if_exists(source_folder / filename, target_folder / filename)


    # Publish public special experiences only.
    for item in specials:
        source_folder = ROOT / item["carpeta"]
        target_folder = SITE / item["carpeta"]

        if target_folder.exists():
            shutil.rmtree(target_folder)

        shutil.copytree(
            source_folder,
            target_folder,
            ignore=shutil.ignore_patterns("info.md"),
        )

    # Publish the standalone admin client at a non-navigation route.
    # Authentication is provided by the user's GitHub token; no token is stored here.
    admin_source = ROOT / "gestion-8f3c6a91"
    if admin_source.exists():
        shutil.copytree(admin_source, SITE / "gestion-8f3c6a91", dirs_exist_ok=True)

    # Explicitly do NOT copy contenido/inbox.

def main():
    memories, memory_warnings, memory_errors = discover_memories()
    phrases, phrase_warnings, phrase_errors = discover_phrases()
    letters, letter_warnings, letter_errors = discover_letters()
    dates, date_warnings, date_errors = discover_dates()
    songs, song_warnings, song_errors = discover_songs()
    video_entries, video_warnings, video_errors = discover_video_entries()
    specials, special_warnings, special_errors = discover_specials()

    warnings = (
        memory_warnings + phrase_warnings + letter_warnings + date_warnings +
        song_warnings + video_warnings + special_warnings
    )
    errors = (
        memory_errors + phrase_errors + letter_errors + date_errors +
        song_errors + video_errors + special_errors
    )

    for warning in warnings:
        print(f"WARNING: {warning}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    write_generated(memories, phrases, letters, dates, songs, video_entries, specials)
    build_site(memories, letters, songs, video_entries, specials)
    validate_public_site()

    print("=" * 62)
    print("NUESTRO LUGAR - BUILD CORRECTO")
    print("=" * 62)
    print(f"Recuerdos:   {len(memories)}")
    print(f"Fotografías: {sum(len(m['imagenes']) for m in memories)}")
    print(f"Frases:      {len(phrases)}")
    print(f"Cartas:      {len(letters)}")
    print(f"Fechas:      {len(dates)}")
    print(f"Canciones:   {len(songs)}")
    print(f"Videos:      {len(video_entries)}")
    print(f"Sorpresas:   {len(specials)}")
    print(f"Salida:       {SITE}")
    print("Inbox:        excluido de publicación")
    print("Herramientas: excluidas de publicación")
    print("Admin web:    /gestion-8f3c6a91/ (sin enlace público)")
    print("Borradores:   publicado:false no se indexa")
    print("=" * 62)

if __name__ == "__main__":
    main()
