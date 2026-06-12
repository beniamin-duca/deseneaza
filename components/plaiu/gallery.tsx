'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Reveal } from './reveal'
import { GALLERY_SEED, type GalleryItem } from './gallery-data'

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(GALLERY_SEED)

  useEffect(() => {
    let cancelled = false
    fetch('/api/gallery', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setItems(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="sec gallery" id="galerie">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">De pe Plaiu</span>
          <h2>Desenele de azi ale celor mici</h2>
          <p>Mândri de ce-au făcut copiii. O selecție caldă, aleasă cu mâna — pe care o poate vedea oricine.</p>
        </Reveal>
        <div className="wall">
          {items.map((g) => (
            <figure className="poly reveal" key={g.id}>
              {g.image ? (
                <div className="art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image}
                    alt={`Desen de ${g.who}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div className="art" dangerouslySetInnerHTML={{ __html: g.art ?? '' }} />
              )}
              <figcaption className="cap">
                <span className="who">{g.who}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <Reveal className="gallery-cta">
          <Link className="btn btn-primary" href="/desen">Desenează și tu</Link>
          <span className="gnote">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7CB342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            Galeria e verificată de oameni înainte de publicare — doar prenume și vârstă, niciodată date personale.
          </span>
        </Reveal>
      </div>
    </section>
  )
}
