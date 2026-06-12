import Link from 'next/link'

export function PlaiuFooter() {
  return (
    <footer>
      <div className="foot-in">
        <div className="foot-brand">
          <Link className="wordmark" href="/">Plaiu<span className="dot" /></Link>
          <span className="foot-credit">Făcut cu <span className="heart">♥</span> în România</span>
        </div>
        <nav className="foot-links" aria-label="Legal">
          <Link href="/parinti">Pentru părinți</Link>
          <Link href="/termeni">Termeni</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
        </nav>
      </div>
    </footer>
  )
}
