import type { NextFunction, Request, Response } from "express";

type NominatimItem = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
};

const NOMINATIM_UA =
  "SpecialDays/1.0 (local invitation app; contact: support@specialdays.local)";

function shortLabel(item: NominatimItem): string {
  const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : "";
  if (name) return name;
  const display = typeof item.display_name === "string" ? item.display_name : "";
  return display.split(",")[0]?.trim() || display;
}

function mapNominatimResults(raw: NominatimItem[]) {
  return (Array.isArray(raw) ? raw : [])
    .map((item) => {
      const lat = Number.parseFloat(String(item.lat || ""));
      const lon = Number.parseFloat(String(item.lon || ""));
      const address = typeof item.display_name === "string" ? item.display_name.trim() : "";
      if (!address || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return {
        id: String(item.place_id ?? `${lat},${lon}`),
        label: shortLabel(item),
        address,
        lat,
        lon,
      };
    })
    .filter(Boolean);
}

async function nominatimSearch(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "12");
  url.searchParams.set("countrycodes", "tr");
  url.searchParams.set("accept-language", "tr");

  const upstream = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
  });
  if (!upstream.ok) return [];
  const raw = (await upstream.json()) as NominatimItem[];
  return mapNominatimResults(raw);
}

/** GET /api/places/search?q= — Nominatim proxy */
export async function searchPlaces(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      return res.json({ results: [] });
    }

    let results = await nominatimSearch(q);

    // OSM POI eksikse Türkiye bağlamı ile tekrar dene
    if (results.length === 0 && !/\b(türkiye|turkey)\b/i.test(q)) {
      results = await nominatimSearch(`${q}, Türkiye`);
    }

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/places/reverse?lat=&lon= — pin sonrası adres çözümü */
export async function reversePlace(req: Request, res: Response, next: NextFunction) {
  try {
    const lat = Number.parseFloat(typeof req.query.lat === "string" ? req.query.lat : "");
    const lon = Number.parseFloat(typeof req.query.lon === "string" ? req.query.lon : "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "Geçerli lat/lon gerekli." });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "tr");
    url.searchParams.set("zoom", "18");

    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: "Adres çözülemedi." });
    }

    const item = (await upstream.json()) as NominatimItem;
    const address = typeof item.display_name === "string" ? item.display_name.trim() : "";
    return res.json({
      label: shortLabel(item),
      address: address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      lat,
      lon,
    });
  } catch (err) {
    return next(err);
  }
}
