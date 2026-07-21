import type { NextFunction, Request, Response } from "express";
import {
  getTrackById,
  listLibraryTracks,
  resolveTrackFilePath,
  trackFileExists,
} from "../music/library.js";

function normalizeParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/** GET /api/music — küratörlü katalog (auth gerekmez) */
export function listMusicLibrary(_req: Request, res: Response) {
  return res.json({ tracks: listLibraryTracks() });
}

/** GET /api/music/:id/file — MP3 stream */
export function streamMusicFile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = normalizeParam(req.params.id)?.trim() || "";
    const track = getTrackById(id);
    if (!track) {
      return res.status(404).json({ error: "Müzik bulunamadı." });
    }
    if (!trackFileExists(track)) {
      return res.status(404).json({ error: "Müzik dosyası sunucuda yok." });
    }

    const filePath = resolveTrackFilePath(track);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    return next(err);
  }
}
