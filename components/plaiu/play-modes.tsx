'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Reveal } from './reveal'

const COLORAT_TEMPLATES = ['bunny','cat','dog','dinosaur','flower','lion','plane','rocket','sun','tree','unicorn','car']

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`

const IC = {
  liber: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
  colorat: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.5A4 4 0 0 0 22 11.5 10 10 0 0 0 12 2z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><circle cx="16.5" cy="11.5" r="1.2" fill="currentColor"/></svg>`,
  stickere: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.4L21 9l-5 4.3L17.6 21 12 16.9 6.4 21 8 13.3 3 9l6.6-.6L12 2z"/></svg>`,
  surpriza: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4M12 7s1.5-4 4-4a2.5 2.5 0 0 1 0 5h-4"/></svg>`,
}

export function PlayModes() {
  const router = useRouter()
  const surprise = () => {
    const blank = Math.random() < 0.5
    if (blank) router.push('/desen?mode=blank')
    else {
      const t = COLORAT_TEMPLATES[Math.floor(Math.random() * COLORAT_TEMPLATES.length)]
      router.push(`/desen?mode=colorat&template=${t}`)
    }
  }
  return (
    <section className="sec" id="moduri">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">4 moduri de joacă</span>
          <h2>Cu ce începem azi?</h2>
          <p>Două atingeri și creionul e pe pagină. Alege un mod și gata.</p>
        </Reveal>
        <div className="modes-grid">
          <Link className="mode m1 reveal" href="/desen?mode=blank">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.liber }} />
            <h3>Pagină goală</h3>
            <p className="msub">Începe de la zero</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <Link className="mode m2 reveal d1" href="/desen?mode=colorat">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.colorat }} />
            <h3>Pagini de colorat</h3>
            <p className="msub">Alege un desen</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <Link className="mode m3 reveal" href="/desen?mode=blank">
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.stickere }} />
            <h3>Stickere &amp; ștampile</h3>
            <p className="msub">Distrează-te cu stickere</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </Link>
          <button className="mode m4 reveal d1" onClick={surprise} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <span className="stitch" />
            <span className="ic" dangerouslySetInnerHTML={{ __html: IC.surpriza }} />
            <h3>Surpriză!</h3>
            <p className="msub">Lasă Plaiu să aleagă</p>
            <span className="go" dangerouslySetInnerHTML={{ __html: ARROW }} />
          </button>
        </div>
      </div>
    </section>
  )
}
