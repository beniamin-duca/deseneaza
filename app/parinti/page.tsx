import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ParintiPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="size-12 rounded-full">
          <Link href="/" aria-label="Inapoi acasa">
            <ArrowLeft className="size-6" />
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Pentru Parinti
        </h1>
      </header>
      
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Despre Riza
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Riza este o aplicatie de desenat creata special pentru copii cu varste intre 3 si 7 ani. 
            Aplicatia ofera un mediu sigur si distractiv pentru creativitate, fara reclame sau 
            continut nepotrivit.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Caracteristici
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Interfata simpla, potrivita pentru degete mici</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Moduri variate: desen liber, colorat, stampile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Fara reclame sau achizitii in aplicatie</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Salvare si partajare usoara a desenelor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Nu necesita cont sau date personale</span>
            </li>
          </ul>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Siguranta
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Riza nu colecteaza date personale si nu necesita conexiune la internet pentru 
            functionalitatea de baza. Desenele sunt stocate local pe dispozitiv si pot fi 
            partajate doar la alegerea utilizatorului.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Contact
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Pentru intrebari sau sugestii, ne puteti contacta la adresa de email: 
            <a href="mailto:contact@riza.app" className="text-primary hover:underline ml-1">
              contact@riza.app
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
