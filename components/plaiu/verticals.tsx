import { Reveal } from './reveal'

const V = [
  { cls: 'tint-povesti', ic: '📖', title: 'Plaiu Povești', text: 'Basmele românești — Făt-Frumos, Capra cu trei iezi, Greuceanu.', delay: undefined as 1 | 2 | undefined },
  { cls: 'tint-sarbatori', ic: '🎄', title: 'Plaiu Sărbători', text: 'Mărțișor, Paște, Crăciun — câte un plai pentru fiecare sărbătoare.', delay: 1 as const },
  { cls: 'tint-biblie', ic: '🦁', title: 'Plaiu Animale', text: 'O lume întreagă de animale de colorat — de la pisici la lei și balene.', delay: 2 as const },
]

export function Verticals() {
  return (
    <section className="sec verticals" id="plaiuri">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="kicker">Mai multe pe Plaiu</span>
          <h2>Tot mai multe plaiuri de explorat</h2>
          <p>Plaiu crește. Poveștile bunicilor, sărbătorile și o lume de animale — toate, colorate de mâinile celor mici.</p>
        </Reveal>
        <div className="vgrid">
          {V.map((v) => (
            // Not yet linked — render as a non-interactive card (no href) so
            // "în curând" teasers don't scroll-jump on tap.
            <div className={`vcard ${v.cls} reveal${v.delay ? ` d${v.delay}` : ''}`} key={v.title} aria-disabled="true">
              <span className="vic">{v.ic}</span>
              <span className="vbadge">în curând</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
