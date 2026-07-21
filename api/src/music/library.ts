import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

export type LibraryTrack = {
  id: string;
  file: string;
  title: string;
  artist: string;
  mood?: string;
};

/**
 * Küratörlü varsayılan müzikler.
 * Dosyalar MUSIC_LIBRARY_PATH altında (şimdilik Project SpecialDay/musics).
 * R2'ye geçince aynı id'ler korunabilir.
 */
export const MUSIC_LIBRARY: LibraryTrack[] = [
  {
    id: "the-mountain-wedding",
    file: "the_mountain-wedding-455512.mp3",
    title: "Wedding",
    artist: "The Mountain",
    mood: "düğün",
  },
  {
    id: "leberch-emotion",
    file: "leberch-emotion-sentimental-509727.mp3",
    title: "Emotion Sentimental",
    artist: "Leberch",
    mood: "romantik",
  },
  {
    id: "grand-project-wonders",
    file: "grand_project-wonders-of-the-earth-550792.mp3",
    title: "Wonders of the Earth",
    artist: "Grand Project",
    mood: "sinematik",
  },
  {
    id: "darwin-frecuencia",
    file: "darwin_code-frecuencia-humana-20-484565.mp3",
    title: "Frecuencia Humana",
    artist: "Darwin Code",
    mood: "sakin",
  },
  {
    id: "kontraa-water",
    file: "kontraa-water-afro-pop-music-445661.mp3",
    title: "Water",
    artist: "Kontraa",
    mood: "neşeli",
  },
];

const byId = new Map(MUSIC_LIBRARY.map((t) => [t.id, t]));

/** SpecialDays kökünün bir üstündeki musics/ (varsayılan lokal klasör) */
function defaultMusicLibraryPath(): string {
  const specialDaysRoot = fileURLToPath(new URL("../../..", import.meta.url));
  return resolve(specialDaysRoot, "..", "musics");
}

export function getMusicLibraryDir(): string {
  const fromEnv = env.MUSIC_LIBRARY_PATH?.trim();
  if (fromEnv) return resolve(fromEnv);
  return defaultMusicLibraryPath();
}

export function getTrackById(id: string): LibraryTrack | null {
  const key = typeof id === "string" ? id.trim() : "";
  return byId.get(key) ?? null;
}

export function resolveTrackFilePath(track: LibraryTrack): string {
  return resolve(getMusicLibraryDir(), track.file);
}

export function trackFileExists(track: LibraryTrack): boolean {
  return existsSync(resolveTrackFilePath(track));
}

export function listLibraryTracks() {
  return MUSIC_LIBRARY.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    mood: track.mood ?? null,
    available: trackFileExists(track),
    streamUrl: `/api/music/${encodeURIComponent(track.id)}/file`,
  }));
}
