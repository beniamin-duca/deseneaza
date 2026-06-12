import { Reveal } from './reveal'

const HILLS = `<svg class="hills-deco" viewBox="0 0 1600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 300 10 560 30 880 22 C 1180 14 1400 36 1600 26 L1600 60 L0 60 Z" fill="#ffffff"/></svg>`

export function StoryBand() {
  return (
    <Reveal as="section" className="story">
      <div className="story-in">
        <p className="quote">„Pe-un picior de <span className="em">plai</span>,<br />pe-o gură de rai.”</p>
        <p className="src">— Miorița</p>
        <p className="lede"><em>Plaiu</em> e pajiștea înaltă, locul poveștilor bunicilor noștri. Am construit un plai digital cald și sigur, unde orice copil își poate aduce imaginația la viață. Pentru că orice copil merită un plai al lui.</p>
        <div dangerouslySetInnerHTML={{ __html: HILLS }} />
      </div>
    </Reveal>
  )
}
