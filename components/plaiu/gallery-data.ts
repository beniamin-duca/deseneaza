export interface GalleryItem {
  id: string
  who: string // first name + age, e.g. "Maria, 6 ani"
  hearts: number
  art: string // raw inline SVG markup for the artwork
}

// Seeded from the design's sample artworks. Each `art` is the inner SVG of the
// corresponding <div class="art"> in docs/plaiu-design/Plaiu Home.html.
export const GALLERY_SEED: GalleryItem[] = [
  {
    id: 'maria',
    who: 'Maria, 6 ani',
    hearts: 34,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: soare și căsuță">
            <rect width="100" height="100" fill="#FFFDF6"/>
            <circle cx="22" cy="22" r="11" fill="#FFD93D"/>
            <g stroke="#FFD93D" stroke-width="2.6" stroke-linecap="round"><path d="M22 5v6"/><path d="M22 33v6"/><path d="M5 22h6"/><path d="M33 22h6"/><path d="M10 10l4 4"/><path d="M30 30l4 4"/></g>
            <path d="M52 50 L72 35 L92 50 Z" fill="#E63946"/>
            <rect x="56" y="50" width="32" height="30" fill="#FFE5C2" stroke="#B08968" stroke-width="2"/>
            <rect x="67" y="62" width="11" height="18" fill="#B08968"/>
            <path d="M2 84 Q 50 76 100 84" stroke="#7CB342" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M14 84 v-7 M22 84 v-9 M30 84 v-7" stroke="#5d8a2c" stroke-width="2" stroke-linecap="round"/>
          </svg>`,
  },
  {
    id: 'andrei',
    who: 'Andrei, 5 ani',
    hearts: 51,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: curcubeu">
            <rect width="100" height="100" fill="#EAF6FF"/>
            <g fill="none" stroke-width="6" stroke-linecap="round">
              <path d="M14 86 A 36 36 0 0 1 86 86" stroke="#E63946"/>
              <path d="M22 86 A 28 28 0 0 1 78 86" stroke="#FFD93D"/>
              <path d="M30 86 A 20 20 0 0 1 70 86" stroke="#7CB342"/>
              <path d="M38 86 A 12 12 0 0 1 62 86" stroke="#6BB6E8"/>
            </g>
            <circle cx="78" cy="22" r="9" fill="#FFD93D"/>
            <g fill="#fff"><circle cx="24" cy="30" r="8"/><circle cx="34" cy="28" r="10"/><circle cx="44" cy="32" r="7"/></g>
          </svg>`,
  },
  {
    id: 'sofia',
    who: 'Sofia, 7 ani',
    hearts: 28,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: pisică">
            <rect width="100" height="100" fill="#FFF0F6"/>
            <path d="M32 30 L26 14 L42 26 Z" fill="#B08968"/>
            <path d="M68 30 L74 14 L58 26 Z" fill="#B08968"/>
            <circle cx="50" cy="52" r="28" fill="#FFD93D"/>
            <circle cx="40" cy="48" r="3.4" fill="#2D3047"/>
            <circle cx="60" cy="48" r="3.4" fill="#2D3047"/>
            <path d="M46 58 Q 50 62 54 58" stroke="#2D3047" stroke-width="2.4" fill="none" stroke-linecap="round"/>
            <path d="M50 56 v3" stroke="#2D3047" stroke-width="2" stroke-linecap="round"/>
            <g stroke="#2D3047" stroke-width="1.8" stroke-linecap="round"><path d="M22 54h12M22 60h12M66 54h12M66 60h12"/></g>
          </svg>`,
  },
  {
    id: 'luca',
    who: 'Luca, 4 ani',
    hearts: 40,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: floare">
            <rect width="100" height="100" fill="#F3FBE8"/>
            <path d="M50 92 V52" stroke="#5d8a2c" stroke-width="4" stroke-linecap="round"/>
            <path d="M50 70 Q 34 64 30 74 Q 44 78 50 70Z" fill="#7CB342"/>
            <g fill="#F06BA8"><ellipse cx="50" cy="28" rx="9" ry="14"/><ellipse cx="50" cy="56" rx="9" ry="14"/><ellipse cx="36" cy="42" rx="14" ry="9"/><ellipse cx="64" cy="42" rx="14" ry="9"/></g>
            <circle cx="50" cy="42" r="9" fill="#FFD93D"/>
          </svg>`,
  },
  {
    id: 'ana',
    who: 'Ana, 8 ani',
    hearts: 62,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: pește">
            <rect width="100" height="100" fill="#E7F6FB"/>
            <path d="M30 50 C42 32 68 32 80 50 C68 68 42 68 30 50Z" fill="#6BB6E8"/>
            <path d="M30 50 L16 38 L20 50 L16 62 Z" fill="#2f7fb8"/>
            <circle cx="68" cy="44" r="4" fill="#fff"/><circle cx="69" cy="44" r="2" fill="#2D3047"/>
            <path d="M52 38 Q 56 50 52 62" stroke="#2f7fb8" stroke-width="2.4" fill="none"/>
            <g stroke="#2f7fb8" stroke-width="2" fill="none" stroke-linecap="round"><path d="M10 78 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0"/></g>
          </svg>`,
  },
  {
    id: 'david',
    who: 'David, 6 ani',
    hearts: 45,
    art: `<svg viewBox="0 0 100 100" aria-label="Desen: fluture">
            <rect width="100" height="100" fill="#FBF0FF"/>
            <path d="M50 30 V72" stroke="#2D3047" stroke-width="3" stroke-linecap="round"/>
            <circle cx="50" cy="26" r="4" fill="#2D3047"/>
            <path d="M47 23 q-4 -7 -8 -6 M53 23 q4 -7 8 -6" stroke="#2D3047" stroke-width="1.8" fill="none" stroke-linecap="round"/>
            <path d="M48 40 C26 22 12 36 22 52 C12 66 34 72 48 56 Z" fill="#9B7EDE"/>
            <path d="M52 40 C74 22 88 36 78 52 C88 66 66 72 52 56 Z" fill="#F06BA8"/>
            <circle cx="30" cy="40" r="3" fill="#fff"/><circle cx="70" cy="40" r="3" fill="#fff"/>
          </svg>`,
  },
]
