const DEV_PREFILL_BY_CATEGORY = {
  wedding: {
    slug: 'elif-mert-nisan',
    title: 'Elif & Mert Nişan Kutlaması',
    eventDate: '2026-09-12T19:30',
    mainText:
      'Ailelerimizin sevgisiyle bu özel günümüzde sizleri yanımızda görmekten büyük mutluluk duyarız.',
    themeColor: '#b0425f',
    musicId: 'the-mountain-wedding',
    musicUrl: '',
    textFallbacks: [
      'Hikayemiz üniversitede başladı; her yıl daha güzel bir anı biriktirdik.',
      'Program: Karşılama 19:00, yüzük töreni 20:00, kutlama 21:00.',
      'Katılımınız bizim için çok değerli. Sevgilerimizle.',
    ],
  },
  birthday: {
    slug: 'iyi-ki-dogdun-beste',
    title: 'İyi Ki Doğdun Beste',
    eventDate: '2026-06-15T18:00',
    mainText:
      'Bugün senin günün! Seni çok seviyoruz ve bu özel günde yanında olmaktan mutluyuz.',
    themeColor: '#c9a46a',
    musicId: 'kontraa-water',
    musicUrl: '',
    textFallbacks: [
      'Bugün senin günün — kutlu olsun!',
      'Seninle geçirdiğimiz her anı çok seviyoruz.',
      'İyi ki doğdun, iyi ki varsın.',
    ],
  },
  anniversary: {
    slug: 'aylin-kerem-yildonumu',
    title: 'Aylin & Kerem — 5. Yıldönümü',
    eventDate: '2026-11-20T20:00',
    mainText:
      'Beş yıldır el ele, gülümseyerek… Bu yolculukta bizimle olduğunuz için teşekkür ederiz.',
    themeColor: '#8b2942',
    musicId: 'leberch-emotion',
    musicUrl: '',
    textFallbacks: [
      'İlk buluşmamızdan bu yana her gün birbirimize daha çok yaklaştık.',
      'Bu akşam birlikte kutlayacağımız anılar için sabırsızlanıyoruz.',
      'Sevgiyle kalın.',
    ],
  },
  default: {
    slug: 'ozel-gun-ornek',
    title: 'Özel Gün Kutlaması',
    eventDate: '2026-08-01T19:00',
    mainText: 'Bu özel günde sizleri aramızda görmekten mutluluk duyarız.',
    themeColor: '#c41e3a',
    musicId: 'grand-project-wonders',
    musicUrl: '',
    textFallbacks: [
      'Sizinle paylaşmak istediğimiz güzel bir mesaj.',
      'Detaylar için bizi takip edebilirsiniz.',
      'Sevgilerimizle.',
    ],
  },
}

export function resolveDevPrefill(categoryCode) {
  if (!categoryCode || typeof categoryCode !== 'string') {
    return DEV_PREFILL_BY_CATEGORY.default
  }
  const key = categoryCode.trim().toLowerCase()
  return DEV_PREFILL_BY_CATEGORY[key] ?? DEV_PREFILL_BY_CATEGORY.default
}

export const DEV_PREFILL_ENABLED = import.meta.env.DEV
