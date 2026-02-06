import { ArrowRight, Users, Target, Heart, Lightbulb, Shield, Globe, Award, Calendar, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutUsPage() {
  const teamMembers = [
    {
      name: "Sophie Martin",
      role: "CEO & Co-fondatrice",
      description: "Passionnée d&apos;innovation et d&apos;automatisation, Sophie guide AREA vers l&apos;excellence.",
      avatar: "/api/placeholder/120/120"
    },
    {
      name: "Alexandre Dubois",
      role: "CTO & Co-fondateur", 
      description: "Expert en architecture cloud et sécurité, Alexandre assure la robustesse de notre plateforme.",
      avatar: "/api/placeholder/120/120"
    },
    {
      name: "Marie Lefebvre",
      role: "Head of Product",
      description: "Designer UX/UI experte, Marie façonne l&apos;expérience utilisateur d&apos;AREA.",
      avatar: "/api/placeholder/120/120"
    },
    {
      name: "Thomas Bernard",
      role: "Lead Developer",
      description: "Développeur full-stack passionné, Thomas développe les fonctionnalités qui vous simplifient la vie.",
      avatar: "/api/placeholder/120/120"
    }
  ];

  const stats = [
    {
      number: "50K+",
      label: "Utilisateurs actifs",
      icon: Users
    },
    {
      number: "1M+", 
      label: "Automatisations créées",
      icon: Target
    },
    {
      number: "99.9%",
      label: "Uptime garanti",
      icon: Shield
    },
    {
      number: "15+",
      label: "Pays desservis",
      icon: Globe
    }
  ];

  const values = [
    {
      title: "Innovation",
      description: "Nous repoussons constamment les limites de l&apos;automatisation pour vous offrir les meilleures solutions.",
      icon: Lightbulb,
      color: "primary"
    },
    {
      title: "Simplicité",
      description: "Nous croyons que la technologie doit être accessible à tous, sans compromis sur la puissance.",
      icon: Heart,
      color: "secondary"
    },
    {
      title: "Fiabilité",
      description: "Votre confiance est notre priorité. Nos services sont conçus pour fonctionner 24/7 sans interruption.",
      icon: Shield,
      color: "accent"
    },
    {
      title: "Collaboration", 
      description: "Nous favorisons le partage et la collaboration pour créer une communauté d&apos;utilisateurs engagés.",
      icon: Users,
      color: "primary"
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Fond gradient global uniforme */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 -z-10" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
              À propos 
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {" "}d&apos;AREA
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 max-w-3xl mx-auto text-foreground/80">
              Nous sommes une équipe passionnée qui révolutionne la façon dont les gens automatisent leur quotidien. 
              Notre mission : rendre l&apos;automatisation accessible à tous.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link href="/areas">
                <Button size="lg" className="gap-2">
                  Découvrir nos solutions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-sm text-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Histoire Section */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center mb-16">
              Notre Histoire
            </h2>
            
            <div className="space-y-8">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>2023 - Les Débuts</CardTitle>
                      <CardDescription>La naissance d&apos;une vision</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Tout a commencé quand nos fondateurs, frustrés par la complexité des outils d&apos;automatisation existants, 
                    ont décidé de créer une solution simple et puissante. L&apos;idée d&apos;AREA était née : démocratiser l&apos;automatisation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-secondary/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                      <Target className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>2024 - L&apos;Expansion</CardTitle>
                      <CardDescription>Croissance et innovation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Avec plus de 10 000 utilisateurs en seulement 6 mois, nous avons élargi notre équipe et nos intégrations. 
                    Nouveaux services, nouvelles fonctionnalités, toujours avec la même philosophie : la simplicité avant tout.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-accent/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Award className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>2025 - L&apos;Avenir</CardTitle>
                      <CardDescription>Innovation continue</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">
                    Aujourd&apos;hui, avec plus de 50 000 utilisateurs et des millions d&apos;automatisations créées, nous continuons d&apos;innover. 
                    IA, nouvelles intégrations, collaboration d&apos;équipe : l&apos;avenir d&apos;AREA s&apos;annonce passionnant.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs Section */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Nos Valeurs
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Les principes qui guident chaque décision chez AREA
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 hover-lift">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-300">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Équipe Section */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Notre Équipe
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Les visionnaires derrière AREA
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 hover-lift text-center">
                <CardHeader>
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Réalisations Section */}
      <section className="py-24 sm:py-32 relative bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Nos Réalisations
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Ce que nous avons accompli ensemble
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Automatisations Réussies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">1M+</div>
                <p className="text-sm text-foreground/80">
                  Plus d&apos;un million d&apos;automatisations créées par nos utilisateurs, 
                  leur faisant économiser des milliers d&apos;heures chaque mois.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 hover:bg-secondary/5 dark:hover:bg-secondary/10 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  Présence Internationale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">15</div>
                <p className="text-sm text-foreground/80">
                  Pays dans le monde utilisent AREA quotidiennement, 
                  avec un support client disponible 24/7 en plusieurs langues.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 hover:bg-accent/5 dark:hover:bg-accent/10 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  Satisfaction Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-2">4.9/5</div>
                <p className="text-sm text-foreground/80">
                  Note moyenne de satisfaction basée sur plus de 10 000 avis clients, 
                  témoignant de la qualité de notre service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Restons en Contact
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Une question ? Une suggestion ? Nous sommes là pour vous écouter.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 hover-lift text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>Contactez-nous par email</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">contact@area.com</p>
                <p className="text-sm text-foreground/70 mt-2">
                  Réponse sous 24h garantie
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 hover:bg-secondary/5 dark:hover:bg-secondary/10 hover-lift text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Support</CardTitle>
                <CardDescription>Assistance technique 24/7</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">support@area.com</p>
                <p className="text-sm text-foreground/70 mt-2">
                  Équipe d&apos;experts disponible
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 hover:bg-accent/5 dark:hover:bg-accent/10 hover-lift text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Bureaux</CardTitle>
                <CardDescription>Nos locaux</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">Lyon, France</p>
                <p className="text-sm text-foreground/70 mt-2">
                  Visite sur rendez-vous
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Rejoignez l&apos;Aventure AREA
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground/80">
              Faites partie de la révolution de l&apos;automatisation. 
              Créez votre première automation en moins de 5 minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/areas">
                <Button size="lg" variant="outline">
                  Voir les exemples
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t relative">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-center text-sm text-foreground/70">
            © 2025 AREA. Tous droits réservés. • 
            <span className="mx-2">•</span>
            Fait avec ❤️ à Lyon, France
          </p>
        </div>
      </footer>
    </div>
  );
}