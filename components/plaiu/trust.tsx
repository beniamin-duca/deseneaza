import Link from 'next/link'
import { Reveal } from './reveal'

const ICONS = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="#7CB342" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="#6BB6E8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18"/><circle cx="8" cy="14" r="1.4" fill="#6BB6E8"/><path d="M12 14h5"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg>`,
}

export function Trust() {
  return (
    <section className="sec" id="parinti">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">Pentru părinți</span>
          <h2>Un plai sigur pentru copilul tău</h2>
          <p>Gândit special pentru cei mici: cald, simplu, fără capcane.</p>
        </Reveal>
        <div className="tgrid">
          <Reveal className="tcard">
            <span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.shield }} />
            <h3>Fără cont, fără reclame</h3>
            <p>Nici email, nici nume, nici reclame agresive. Desenele rămân la voi.</p>
          </Reveal>
          <Reveal className="tcard" delay={1}>
            <span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.lock }} />
            <h3>Doar strict necesar</h3>
            <p>Fără urmărire, fără cookie-uri de marketing. „Salvează” descarcă un PNG.</p>
          </Reveal>
          <Reveal className="tcard" delay={2}>
            <span className="tic" dangerouslySetInnerHTML={{ __html: ICONS.heart }} />
            <h3>Făcut cu drag în România</h3>
            <p>Limba română de la cap la coadă și o poveste folk în fiecare colț.</p>
          </Reveal>
        </div>
        <Reveal>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link className="btn btn-ghost" href="/parinti">Cum funcționează Plaiu →</Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
