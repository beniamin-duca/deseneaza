import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermeniPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="size-12 rounded-full">
          <Link href="/" aria-label="Inapoi acasa">
            <ArrowLeft className="size-6" />
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Termeni si Conditii
        </h1>
      </header>
      
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            1. Acceptarea Termenilor
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Prin utilizarea aplicatiei Riza, acceptati acesti termeni si conditii. 
            Daca nu sunteti de acord cu ei, va rugam sa nu utilizati aplicatia.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            2. Utilizarea Aplicatiei
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Riza este destinata utilizarii de catre copii sub supravegherea parintilor. 
            Aplicatia este gratuita si poate fi utilizata in scopuri personale, non-comerciale.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            3. Proprietate Intelectuala
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Continutul aplicatiei, inclusiv dar fara a se limita la imagini, text si cod, 
            este protejat de legile dreptului de autor. Desenele create de utilizatori 
            raman proprietatea acestora.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            4. Limitarea Raspunderii
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Aplicatia este oferita asa cum este, fara garantii de niciun fel. 
            Nu suntem responsabili pentru nicio dauna rezultata din utilizarea aplicatiei.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            5. Modificari
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ne rezervam dreptul de a modifica acesti termeni in orice moment. 
            Continuarea utilizarii aplicatiei dupa modificari constituie acceptarea noilor termeni.
          </p>
        </section>
        
        <p className="text-sm text-muted-foreground pt-4 border-t border-border">
          Ultima actualizare: Ianuarie 2026
        </p>
      </div>
    </main>
  )
}
