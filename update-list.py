#!/usr/bin/env python3
"""Run this inside the Badi Di folder (python update-list.py).
It lists every photo in "di photos" and every video in "wishes"
and rewrites media-list.js, so you don't have to type the names."""
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
PHOTO_FOLDER, VIDEO_FOLDER = "di photos", "wishes"
MUSIC_FOLDER = "song"
IMG = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
VID = {".mp4", ".webm", ".mov", ".m4v"}
AUDIO = {".mp3", ".wav", ".ogg", ".m4a", ".aac"}

def natural(s):  # photo2 comes before photo10
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

def files(folder, exts):
    p = os.path.join(here, folder)
    if not os.path.isdir(p):
        print(f'Folder not found: "{folder}" (it must sit next to this script)')
        return []
    return sorted((f for f in os.listdir(p) if os.path.splitext(f)[1].lower() in exts), key=natural)

photos, videos = files(PHOTO_FOLDER, IMG), files(VIDEO_FOLDER, VID)
music_files = files(MUSIC_FOLDER, AUDIO)
music_file = music_files[0] if music_files else ""
dump = lambda L: json.dumps(L, ensure_ascii=False, indent=2)
with open(os.path.join(here, "media-list.js"), "w", encoding="utf-8") as f:
    f.write(f'''/* Written by update-list.py. Edit by hand to change names or order. */
const PHOTO_FOLDER = {json.dumps(PHOTO_FOLDER)};
const PHOTOS = {dump(photos)};

const VIDEO_FOLDER = {json.dumps(VIDEO_FOLDER)};
const VIDEOS = {dump(videos)};

const MUSIC_FOLDER = {json.dumps(MUSIC_FOLDER)};
const MUSIC_FILE = {json.dumps(music_file)};
''')
print(f"Found {len(photos)} photos, {len(videos)} videos, and {len(music_files)} music files. media-list.js updated.")
