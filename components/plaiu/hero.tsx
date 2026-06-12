import { PlaiuMascot } from './plaiu-mascot'
import { HeroDoodle } from './hero-doodle'
import { Reveal } from './reveal'
import Link from 'next/link'

const MEADOW_SCENE = `<div class="cloud" aria-hidden="true">
    <svg viewBox="0 0 120 60"><g fill="#ffffff"><circle cx="32" cy="36" r="20"/><circle cx="56" cy="30" r="24"/><circle cx="84" cy="38" r="18"/><rect x="30" y="36" width="58" height="20" rx="10"/></g></svg>
  </div>
  <div class="sun" aria-hidden="true">
    <svg viewBox="0 0 100 100"><g class="rays" stroke="#FFD93D" stroke-width="5" stroke-linecap="round"><line x1="50" y1="6" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="94"/><line x1="6" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="94" y2="50"/><line x1="18" y1="18" x2="27" y2="27"/><line x1="73" y1="73" x2="82" y2="82"/><line x1="82" y1="18" x2="73" y2="27"/><line x1="27" y1="73" x2="18" y2="82"/></g><circle cx="50" cy="50" r="22" fill="#FFD93D"/></svg>
  </div>
  <div class="meadow" aria-hidden="true">
    <svg viewBox="0 0 1600 170" preserveAspectRatio="xMidYMax slice">
      <path class="backhill" d="M0 90 C 250 40 480 60 760 50 C 1060 40 1300 70 1600 48 L1600 170 L0 170 Z" fill="#8FCB54"/>
      <path d="M0 120 C 300 80 560 110 880 96 C 1180 84 1400 116 1600 100 L1600 170 L0 170 Z" fill="#7CB342"/>
      <g class="flori" fill="none">
        <g transform="translate(180 118)"><line x1="0" y1="0" x2="0" y2="20" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#E63946" opacity=".55"/></g>
        <g transform="translate(420 128)"><line x1="0" y1="0" x2="0" y2="18" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#FFD93D" opacity=".55"/></g>
        <g transform="translate(700 124)"><line x1="0" y1="0" x2="0" y2="20" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#6BB6E8" opacity=".55"/></g>
        <g transform="translate(980 130)"><line x1="0" y1="0" x2="0" y2="18" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#E63946" opacity=".55"/></g>
        <g transform="translate(1240 122)"><line x1="0" y1="0" x2="0" y2="20" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#FFD93D" opacity=".55"/></g>
        <g transform="translate(1420 130)"><line x1="0" y1="0" x2="0" y2="18" stroke="#5d8a2c" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#6BB6E8" opacity=".55"/></g>
      </g>
    </svg>
  </div>`

export function Hero() {
  return (
    <section className="hero">
      <HeroDoodle />
      <div className="hero-inner">
        <PlaiuMascot />
        <Reveal as="span" delay={1} className="eyebrow">Desenăm gratis · fără cont</Reveal>
        <Reveal as="h1" delay={1}>
          Ce desenăm azi pe{' '}
          <span className="hl">Plaiu<svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11 Q 60 2 100 8 T 197 6" stroke="#FFD93D" strokeWidth="7" fill="none" strokeLinecap="round" /></svg></span>?
        </Reveal>
        <Reveal as="p" delay={2} className="tagline">Pe-un plai de desene, pe-o gură de joacă.</Reveal>
        <Reveal as="p" delay={2} className="sub">Apasă pe un mod și începe — fără cont, fără așteptare, fără reclame.</Reveal>
        <Reveal delay={3} className="hero-actions">
          <Link className="btn btn-primary" href="/desen">Hai să desenăm!</Link>
          <a className="btn btn-ghost" href="#parinti">Pentru părinți</a>
        </Reveal>
        <Reveal as="ul" delay={3} className="chips">
          {['Fără cont', 'Fără reclame', 'Sigur pentru cei mici'].map((t) => (
            <li key={t}><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>{t}</li>
          ))}
        </Reveal>
      </div>
      <div dangerouslySetInnerHTML={{ __html: MEADOW_SCENE }} />
    </section>
  )
}
