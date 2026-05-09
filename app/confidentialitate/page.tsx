import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConfidentialitatePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="size-12 rounded-full">
          <Link href="/" aria-label="Inapoi acasa">
            <ArrowLeft className="size-6" />
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Politica de Confidentialitate
        </h1>
      </header>
      
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Colectarea Datelor
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Riza nu colecteaza date personale de la utilizatori. Nu solicitam nume, 
            adrese de email sau alte informatii de identificare. Aplicatia poate fi 
            utilizata complet anonim.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Stocarea Desenelor
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Desenele create in aplicatie sunt stocate local pe dispozitivul utilizatorului. 
            Nu avem acces la aceste desene si nu le transferam pe serverele noastre.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Partajarea
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Functia de partajare foloseste API-urile native ale dispozitivului. 
            Cand partajati un desen, acesta este trimis direct prin aplicatia aleasa 
            (WhatsApp, email, etc.) fara a trece prin serverele noastre.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Cookie-uri si Tracking
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Nu folosim cookie-uri de tracking, nu integram servicii de analytics third-party 
            si nu afisam reclame. Confidentialitatea copilului dumneavoastra este prioritatea noastra.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Siguranta Copiilor
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Riza este proiectata cu siguranta copiilor in minte. Nu contine link-uri externe, 
            nu permite comunicarea cu alti utilizatori si nu expune copiii la continut 
            generat de utilizatori.
          </p>
        </section>
        
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            Contact
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Pentru intrebari despre confidentialitate, contactati-ne la: 
            <a href="mailto:privacy@riza.app" className="text-primary hover:underline ml-1">
              privacy@riza.app
            </a>
          </p>
        </section>
        
        <p className="text-sm text-muted-foreground pt-4 border-t border-border">
          Ultima actualizare: Ianuarie 2026
        </p>
      </div>
    </main>
  )
}
