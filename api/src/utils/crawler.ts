import type { Request } from "express";

const CRAWLER_PATTERN =
  /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|googlebot/i;

export function isSocialCrawler(req: Request): boolean {
  const ua = String(req.headers["user-agent"] || "");
  return CRAWLER_PATTERN.test(ua);
}
