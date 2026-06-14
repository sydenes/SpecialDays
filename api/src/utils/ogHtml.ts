import type { PageOgMeta } from "../db/queries/pageOg.queries.js";
import { env } from "../config/env.js";

export type ResolvedOgMeta = {
  slug: string;
  title: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveOgImageUrl(meta: PageOgMeta): string {
  const hero = meta.heroImageUrl?.trim();
  if (hero && /^https?:\/\//i.test(hero)) return hero;

  if (meta.firstPhotoId) {
    const apiBase = env.PUBLIC_API_URL.replace(/\/$/, "");
    return `${apiBase}/api/pages/${encodeURIComponent(meta.slug)}/photos/${encodeURIComponent(meta.firstPhotoId)}/image`;
  }

  const site = env.PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${site}/favicon.svg`;
}

export function resolveOgMeta(meta: PageOgMeta): ResolvedOgMeta {
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, "");
  return {
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    pageUrl: `${site}/${encodeURIComponent(meta.slug)}`,
    imageUrl: resolveOgImageUrl(meta),
  };
}

export function buildOgHtml(resolved: ResolvedOgMeta, options?: { redirectToSpa?: boolean }): string {
  const title = escapeHtml(resolved.title);
  const description = escapeHtml(resolved.description);
  const pageUrl = escapeHtml(resolved.pageUrl);
  const imageUrl = escapeHtml(resolved.imageUrl);
  const redirect = options?.redirectToSpa
    ? `<meta http-equiv="refresh" content="0;url=${pageUrl}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="tr_TR" />
  <meta property="og:site_name" content="Special Days" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  ${redirect}
</head>
<body>
  <p><a href="${pageUrl}">${title}</a></p>
</body>
</html>`;
}

export function injectOgIntoIndexHtml(indexHtml: string, resolved: ResolvedOgMeta): string {
  const block = `
    <title>${escapeHtml(resolved.title)}</title>
    <meta name="description" content="${escapeHtml(resolved.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:site_name" content="Special Days" />
    <meta property="og:title" content="${escapeHtml(resolved.title)}" />
    <meta property="og:description" content="${escapeHtml(resolved.description)}" />
    <meta property="og:url" content="${escapeHtml(resolved.pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(resolved.imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(resolved.title)}" />
    <meta name="twitter:description" content="${escapeHtml(resolved.description)}" />
    <meta name="twitter:image" content="${escapeHtml(resolved.imageUrl)}" />
  `;

  return indexHtml.replace(/<title>[^<]*<\/title>/i, block.trim());
}
