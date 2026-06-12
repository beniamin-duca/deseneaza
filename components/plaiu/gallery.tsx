import Link from 'next/link'
import { Reveal } from './reveal'
import { GALLERY_SEED } from './gallery-data'

const HEART = `<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg>`

export function Gallery() {
  return (
    <section className="sec gallery" id="galerie">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">De pe Plaiu</span>
          <h2>Desenele de azi ale celor mici</h2>
          <p>Mândri de ce-au făcut copiii. O selecție caldă, aleasă cu mâna — pe care o poate vedea oricine.</p>
        </Reveal>
        <div className="wall">
          {GALLERY_SEED.map((g) => (
            <figure className="poly reveal" key={g.id}>
              <div className="art" dangerouslySetInnerHTML={{ __html: g.art }} />
              <figcaption className="cap">
                <span className="who">{g.who}</span>
                <span className="heart">
                  <span dangerouslySetInnerHTML={{ __html: HEART }} />
                  {g.hearts}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <Reveal className="gallery-cta">
          <Link className="btn btn-primary" href="/desen">Desenează și tu</Link>
          <span className="gnote">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="#7CB342"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            Galeria e verificată de oameni înainte de publicare — doar prenume și vârstă, niciodată date personale.
          </span>
        </Reveal>
      </div>
    </section>
  )
}
