const MASCOT_SVG = `
<svg class="m-copil" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="Mascotă Plaiu — copil pe plai">
  <ellipse cx="100" cy="182" rx="78" ry="15" fill="#7CB342"/>
  <ellipse cx="100" cy="179" rx="66" ry="12" fill="#8FCB54"/>
  <circle cx="44" cy="180" r="3" fill="#FFD93D"/>
  <circle cx="158" cy="181" r="3" fill="#E63946"/>
  <circle cx="146" cy="174" r="2" fill="#FFD93D"/>
  <path d="M 72 134 L 128 134 L 132 174 L 68 174 Z" fill="#FFF8E7" stroke="#e7dcc2" stroke-width="1.5"/>
  <rect x="93" y="134" width="14" height="40" fill="#E63946"/>
  <rect x="93" y="142" width="14" height="2" fill="#FFD93D"/>
  <rect x="93" y="158" width="14" height="2" fill="#FFD93D"/>
  <circle cx="100" cy="102" r="31" fill="#FFE5C2"/>
  <path d="M 70 92 Q 70 63 100 59 Q 130 63 130 92 Q 130 80 100 78 Q 70 80 70 92 Z" fill="#3A2618"/>
  <circle cx="91" cy="102" r="3" fill="#2D3047"/>
  <circle cx="109" cy="102" r="3" fill="#2D3047"/>
  <circle cx="83" cy="113" r="4" fill="#FFA8A8" opacity="0.6"/>
  <circle cx="117" cy="113" r="4" fill="#FFA8A8" opacity="0.6"/>
  <path d="M 92 118 Q 100 126 108 118" stroke="#2D3047" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g transform="translate(140 150) rotate(-20)">
    <rect x="0" y="-30" width="7" height="32" fill="#FFD93D"/>
    <rect x="0" y="-35" width="7" height="5" fill="#E63946"/>
    <polygon points="0,2 3.5,12 7,2" fill="#2D3047"/>
  </g>
</svg>`

export function PlaiuMascot() {
  return <div className="mascot reveal" dangerouslySetInnerHTML={{ __html: MASCOT_SVG }} />
}
