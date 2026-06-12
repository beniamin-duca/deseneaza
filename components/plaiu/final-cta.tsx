import Link from 'next/link'
import { Reveal } from './reveal'

export function FinalCta() {
  return (
    <Reveal as="section" className="ctaband">
      <h2>Hai pe Plaiu să desenăm!</h2>
      <p>Două atingeri și ești pe pagină. Fără cont, fără grabă.</p>
      <Link className="btn btn-sun" href="/desen">Începe să desenezi</Link>
      <p className="mini">Gratis pentru totdeauna · pentru copii de 3–10 ani</p>
    </Reveal>
  )
}
