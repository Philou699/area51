import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Code, 
  Webhook, 
  Lightbulb, 
  MessageCircle, 
  Play,
  Github,
  Music,
  Film,
  MessageSquare,
  Cloud,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="page-background flex min-h-screen flex-col">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-32 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-light-blue/30 bg-light-blue/10 px-4 py-1.5 text-sm font-medium text-navy dark:border-light-blue/40 dark:bg-light-blue/10 dark:text-white">
            <BookOpen className="h-4 w-4 text-light-blue" />
            Documentation complète
          </div>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight text-navy md:text-6xl lg:text-7xl dark:text-white">
            Documentation{" "}
            <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">
              AREA
            </span>
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Apprenez à utiliser notre plateforme d&apos;automatisation pour connecter vos services préférés et créer des workflows puissants.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button size="lg" className="bg-navy text-white hover:bg-navy-dark dark:bg-light-blue dark:text-navy dark:hover:bg-light-blue-muted">
              <Play className="mr-2 h-4 w-4" />
              Guide de démarrage
            </Button>
            <Button size="lg" variant="outline" className="border-navy text-navy hover:bg-navy/5 dark:border-light-blue dark:text-light-blue dark:hover:bg-light-blue/10">
              <Code className="mr-2 h-4 w-4" />
              Documentation API
            </Button>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Démarrage rapide</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez nos ressources pour commencer rapidement avec AREA
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Guide de démarrage */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-light-blue hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10 transition-transform group-hover:scale-110 dark:bg-light-blue/20">
                  <Play className="h-6 w-6 text-light-blue" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">Guide de démarrage</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Découvrez comment créer votre première AREA en quelques minutes avec notre guide pas à pas.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-light-blue hover:text-light-blue-muted group/button">
                  <Link href="#" className="flex items-center gap-1">
                    Commencer
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Services disponibles */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-mint hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint/10 transition-transform group-hover:scale-110 dark:bg-mint/20">
                  <Zap className="h-6 w-6 text-mint" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">Services disponibles</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                      <Music className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-navy dark:text-white">Spotify</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <Github className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-navy dark:text-white">GitHub</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <Film className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-navy dark:text-white">Letterboxd</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                      <MessageSquare className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-navy dark:text-white">Discord</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <Cloud className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-navy dark:text-white">OpenWeather</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Reference */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-light-blue hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10 transition-transform group-hover:scale-110 dark:bg-light-blue/20">
                  <Code className="h-6 w-6 text-light-blue" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">API Reference</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Documentation complète de notre API REST avec exemples de code et authentification.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-light-blue hover:text-light-blue-muted group/button">
                  <Link href="#" className="flex items-center gap-1">
                    Consulter l&apos;API
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-mint hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint/10 transition-transform group-hover:scale-110 dark:bg-mint/20">
                  <Webhook className="h-6 w-6 text-mint" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">Webhooks</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configurez des webhooks pour recevoir des notifications en temps réel de vos automatisations.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-mint hover:text-mint-muted group/button">
                  <Link href="#" className="flex items-center gap-1">
                    Configuration
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Exemples */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-light-blue hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10 transition-transform group-hover:scale-110 dark:bg-light-blue/20">
                  <Lightbulb className="h-6 w-6 text-light-blue" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">Exemples d&apos;usage</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Découvrez des cas d&apos;usage populaires et des exemples concrets pour vous inspirer.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-light-blue hover:text-light-blue-muted group/button">
                  <Link href="#" className="flex items-center gap-1">
                    Voir les exemples
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="group border-2 border-border bg-card transition-all hover:border-mint hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint/10 transition-transform group-hover:scale-110 dark:bg-mint/20">
                  <MessageCircle className="h-6 w-6 text-mint" />
                </div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-3">Support</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Besoin d&apos;aide ? Contactez notre équipe de support dédiée.
                </p>
                <Button asChild variant="ghost" className="p-0 h-auto text-mint hover:text-mint-muted group/button">
                  <Link href="/support" className="flex items-center gap-1">
                    Contactez-nous
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section Actions et Réactions */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Actions et Réactions disponibles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez tous les déclencheurs et actions que vous pouvez utiliser dans vos automatisations AREA.
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Actions */}
            <Card className="border-2 border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-navy dark:text-white">
                  <div className="p-2 bg-light-blue/10 rounded-lg dark:bg-light-blue/20">
                    <Zap className="h-6 w-6 text-light-blue" />
                  </div>
                  Actions (Déclencheurs)
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Les événements qui déclenchent vos automatisations
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-light-blue pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                      <Music className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">Spotify</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Nouvelle chanson likée, playlist mise à jour, changement de lecture en cours...</p>
                </div>
                
                <div className="border-l-4 border-mint pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <Github className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">GitHub</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Nouvelle issue, pull request mergée, release publiée, commit...</p>
                </div>
                
                <div className="border-l-4 border-light-blue pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <Film className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">Letterboxd</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Nouveau film regardé, critique ajoutée, film ajouté à la watchlist...</p>
                </div>

                <div className="border-l-4 border-mint pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">OpenWeather</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Changement météo, alerte météorologique, température seuil...</p>
                </div>
              </CardContent>
            </Card>

            {/* Réactions */}
            <Card className="border-2 border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-navy dark:text-white">
                  <div className="p-2 bg-mint/10 rounded-lg dark:bg-mint/20">
                    <Target className="h-6 w-6 text-mint" />
                  </div>
                  Réactions
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Les actions exécutées automatiquement
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-mint pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <Webhook className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">Webhooks</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Envoyer des données vers vos propres services et applications...</p>
                </div>
                
                <div className="border-l-4 border-light-blue pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                      <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">Discord</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Envoyer des messages, créer des embeds, ajouter des réactions...</p>
                </div>
                
                <div className="border-l-4 border-mint pl-4 py-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                      <Music className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-navy dark:text-white">Spotify</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Ajouter à une playlist, suivre un artiste, liker des chansons...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-light-blue/5 dark:bg-light-blue/10 rounded-2xl p-12">
          <h3 className="text-2xl font-bold text-navy dark:text-white mb-4">
            Prêt à commencer ?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Créez votre première automatisation dès maintenant et découvrez la puissance d&apos;AREA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-navy text-white hover:bg-navy-dark dark:bg-light-blue dark:text-navy dark:hover:bg-light-blue-muted">
              Créer une AREA
            </Button>
            <Button size="lg" variant="outline" className="border-navy text-navy hover:bg-navy/5 dark:border-light-blue dark:text-light-blue dark:hover:bg-light-blue/10">
              Voir les exemples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
