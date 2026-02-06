import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Users, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="page-background flex min-h-screen flex-col">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-light-blue/30 bg-light-blue/10 px-4 py-1.5 text-sm font-medium text-navy dark:border-light-blue/40 dark:bg-light-blue/10 dark:text-white">
            <Star className="h-4 w-4 text-light-blue" />
            Tarifs transparents
          </div>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight text-navy md:text-6xl lg:text-7xl dark:text-white">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">
              plan AREA
            </span>
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Automatisez vos services préférés avec notre plateforme AREA. Commencez gratuitement et évoluez selon vos besoins.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Plan Gratuit */}
          <Card className="group border-2 border-border bg-card p-8 transition-all hover:border-light-blue hover:shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between gap-x-4">
                <CardTitle className="text-xl font-bold text-navy dark:text-white">Gratuit</CardTitle>
                <div className="p-2 bg-light-blue/10 rounded-lg">
                  <Zap className="h-5 w-5 text-light-blue" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Parfait pour découvrir AREA
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight text-navy dark:text-white">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>5 Areas actives</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Services de base</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Support communauté</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-navy text-white hover:bg-navy-dark dark:bg-light-blue dark:text-navy dark:hover:bg-light-blue-muted">
                <Link href="/signup">
                  Commencer gratuitement
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plan Pro */}
          <Card className="group border-2 border-light-blue bg-card p-8 transition-all hover:shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="inline-flex items-center gap-1 rounded-full bg-light-blue/10 px-3 py-1 text-xs font-medium text-light-blue">
                <Star className="h-3 w-3" />
                Populaire
              </div>
            </div>
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between gap-x-4">
                <CardTitle className="text-xl font-bold text-light-blue">Pro</CardTitle>
                <div className="p-2 bg-gradient-to-br from-light-blue to-mint rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Pour les utilisateurs avancés
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">9€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Areas illimitées</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Tous les services</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Webhooks personnalisés</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-light-blue flex-shrink-0" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-gradient-to-r from-light-blue to-mint text-white hover:opacity-90">
                <Link href="/signup">
                  Choisir Pro
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plan Enterprise */}
          <Card className="group border-2 border-border bg-card p-8 transition-all hover:border-mint hover:shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between gap-x-4">
                <CardTitle className="text-xl font-bold text-navy dark:text-white">Enterprise</CardTitle>
                <div className="p-2 bg-mint/10 rounded-lg">
                  <Users className="h-5 w-5 text-mint" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Pour les équipes et entreprises
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight text-navy dark:text-white">49€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-mint flex-shrink-0" />
                  <span>Tout du plan Pro</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-mint flex-shrink-0" />
                  <span>Équipes multiples</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-mint flex-shrink-0" />
                  <span>SSO & sécurité avancée</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-mint flex-shrink-0" />
                  <span>Support dédié</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full border-mint text-mint hover:bg-mint/10">
                <Link href="/contact">
                  Contactez-nous
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
