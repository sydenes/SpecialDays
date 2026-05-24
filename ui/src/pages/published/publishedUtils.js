export const LAYOUTS_WITH_HERO_THUMB_SWAP = new Set([
  'split-hero',
  'stacked',
  'minimal',
  'magazine',
  'timeline',
  'split-scroll',
])

export const LAYOUTS = new Set([
  'split-hero',
  'stacked',
  'minimal',
  'magazine',
  'timeline',
  'split-scroll',
  'letter',
  'party',
  'scrapbook',
  'journey',
  'beauty',
])

export const THEME_WRAP_CLASS = {
  default: 'published-theme-default',
  elegant: 'published-theme-elegant',
  'minimal-clean': 'published-theme-minimal',
  'wedding-gold': 'published-theme-wedding-gold',
  'party-neon': 'published-theme-party',
  scrapbook: 'published-theme-scrapbook',
  'romantic-burgundy': 'published-theme-journey',
  'letter-parchment': 'published-theme-letter',
  'beauty-templatemo': 'published-theme-default',
}

export function resolveLayout(page) {
  const l = page?.templateConfigSchema?.layout
  return typeof l === 'string' && LAYOUTS.has(l) ? l : 'split-hero'
}

export function resolveVisualTheme(cfg) {
  const t = cfg?.visualTheme
  return typeof t === 'string' ? t : 'default'
}

export function resolveHeroPoolMax(cfg) {
  const rules = cfg?.contentRules
  const explicit = rules?.heroPoolMax
  if (typeof explicit === 'number' && explicit > 0) return Math.min(12, explicit)
  const maxPhotos = rules?.maxPhotos
  if (typeof maxPhotos === 'number' && maxPhotos > 0) return Math.min(12, maxPhotos)
  return 6
}

export function isLikelyBirthdayPage(page) {
  const raw = `${page?.title || ''} ${page?.mainText || ''}`.toLocaleLowerCase('tr-TR')
  return /(doğum|dogum|iyi ki doğdun|iyi ki dogdun|birthday)/i.test(raw)
}
