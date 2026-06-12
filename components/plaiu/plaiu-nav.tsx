import Link from 'next/link'

export function PlaiuNav() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="wordmark" href="/" aria-label="Plaiu — acasă">
          Plaiu<span className="dot" />
        </Link>
        <nav className="nav-links" aria-label="Navigare">
          <a className="nav-link" href="#moduri">Desenează</a>
          <a className="nav-link" href="#verticale">Verticale</a>
          <a className="nav-link" href="#parinti">Pentru părinți</a>
          <div className="nav-cta-wrap">
            <Link className="btn btn-primary" href="/desen">Hai să desenăm</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
