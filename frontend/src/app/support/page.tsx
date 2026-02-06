import { ArrowRight, Mail, MessageSquare, Phone, HelpCircle, Users, Search, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SupportPage() {
  const supportChannels = [
    {
      title: "Chat en direct",
      description: "Discutez avec notre équipe en temps réel",
      icon: MessageSquare,
      color: "primary",
      availability: "Lun-Ven 9h-18h",
      responseTime: "Moins de 2 minutes",
      plans: ["Pro", "Business"],
      action: "Ouvrir le chat"
    },
    {
      title: "Support e-mail",
      description: "Envoyez-nous vos questions détaillées", 
      icon: Mail,
      color: "secondary",
      availability: "24/7",
      responseTime: "Moins de 4 heures",
      plans: ["Gratuit", "Pro", "Business"],
      action: "Envoyer un email"
    },
    {
      title: "Support téléphonique",
      description: "Appelez nos experts pour un support immédiat",
      icon: Phone, 
      color: "accent",
      availability: "Lun-Ven 9h-17h",
      responseTime: "Immédiat",
      plans: ["Business"],
      action: "Programmer un appel"
    },
    {
      title: "Centre d&apos;aide",
      description: "Consultez notre base de connaissances",
      icon: HelpCircle,
      color: "primary",
      availability: "24/7",
      responseTime: "Immédiat", 
      plans: ["Gratuit", "Pro", "Business"],
      action: "Parcourir les articles"
    }
  ];

  const quickActions = [
    {
      title: "Signaler un bug",
      description: "Quelque chose ne fonctionne pas comme prévu ?",
      icon: AlertCircle,
      color: "destructive",
      action: "Signaler"
    },
    {
      title: "Demander une fonctionnalité",
      description: "Suggérez des améliorations pour AREA",
      icon: Users,
      color: "primary", 
      action: "Suggérer"
    },
    {
      title: "Problème de facturation",
      description: "Questions sur votre abonnement ou facturation",
      icon: CheckCircle,
      color: "secondary",
      action: "Contacter"
    },
    {
      title: "Problème de sécurité",
      description: "Signalez un problème de sécurité critique",
      icon: AlertCircle,
      color: "destructive",
      action: "Signaler en urgence"
    }
  ];

  const statusData = [
    {
      service: "API AREA",
      status: "Opérationnel",
      uptime: "99.97%",
      color: "green"
    },
    {
      service: "Intégrations Gmail", 
      status: "Opérationnel",
      uptime: "99.95%",
      color: "green"
    },
    {
      service: "Intégrations Slack",
      status: "Ralentissement mineur",
      uptime: "99.82%", 
      color: "yellow"
    },
    {
      service: "Dashboard Web",
      status: "Opérationnel",
      uptime: "99.98%",
      color: "green"
    }
  ];

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          q: "Comment créer ma première automatisation ?",
          a: "Connectez-vous à votre dashboard, cliquez sur 'Nouvelle Area', choisissez un déclencheur et une action, puis activez votre automatisation."
        },
        {
          q: "Combien d'automatisations puis-je créer ?",
          a: "Le plan gratuit permet 10 automatisations actives. Les plans Pro et Business offrent respectivement 100 et un nombre illimité."
        }
      ]
    },
    {
      category: "Technique", 
      questions: [
        {
          q: "Pourquoi mon automatisation ne se déclenche pas ?",
          a: "Vérifiez que les services sont correctement connectés, que les permissions sont accordées et consultez les logs dans votre dashboard."
        },
        {
          q: "Comment utiliser les webhooks ?",
          a: "Les webhooks sont disponibles dans les plans Pro et Business. Consultez notre documentation technique pour les configurer."
        }
      ]
    },
    {
      category: "Facturation",
      questions: [
        {
          q: "Puis-je annuler mon abonnement à tout moment ?",
          a: "Oui, vous pouvez annuler votre abonnement depuis votre dashboard. L'annulation prend effet à la fin de votre période de facturation."
        },
        {
          q: "Proposez-vous des remises pour les associations ?",
          a: "Oui, nous offrons des tarifs préférentiels pour les associations et organisations à but non lucratif. Contactez-nous pour plus d'informations."
        }
      ]
    }
  ];

  const communityResources = [
    {
      title: "Forum communautaire",
      description: "Posez vos questions et partagez vos automatisations avec la communauté",
      members: "2,500+ membres",
      icon: Users,
      link: "/community"
    },
    {
      title: "Discord AREA",
      description: "Chat en temps réel avec d'autres utilisateurs et notre équipe",
      members: "1 200+ membres", 
      icon: MessageSquare,
      link: "https://discord.gg/area"
    },
    {
      title: "Tutoriels YouTube",
      description: "Vidéos étape par étape pour maîtriser toutes les fonctionnalités",
      members: "50+ vidéos",
      icon: ExternalLink,
      link: "https://youtube.com/@area"
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
              Centre de
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {" "}Support
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 max-w-3xl mx-auto text-foreground/80">
              Nous sommes là pour vous aider ! Trouvez des réponses instantanées ou contactez notre équipe d&apos;experts.
            </p>
            
            {/* Barre de recherche */}
            <div className="mt-10 max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <Input 
                  className="pl-10 pr-4 py-3 text-lg"
                  placeholder="Rechercher de l&apos;aide..."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Choisissez votre canal de support
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Plusieurs options pour obtenir de l&apos;aide rapidement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-lg bg-${channel.color}/10 flex items-center justify-center mb-4`}>
                    <channel.icon className={`h-6 w-6 text-${channel.color}`} />
                  </div>
                  <CardTitle className="text-lg">{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Disponibilité:</span>
                      <span className="font-medium">{channel.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Réponse:</span>
                      <span className="font-medium">{channel.responseTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {channel.plans.map((plan, planIndex) => (
                      <span key={planIndex} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {plan}
                      </span>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline" size="sm">
                    {channel.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-24 sm:py-32 relative bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Actions rapides
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Besoin d&apos;aide spécifique ? Accédez directement aux bons canaux
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-10 h-10 rounded-lg bg-${action.color}/10 flex items-center justify-center mb-3`}>
                    <action.icon className={`h-5 w-5 text-${action.color}`} />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 mb-4">{action.description}</p>
                  <Button className="w-full" variant="outline" size="sm">
                    {action.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Status Dashboard */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Statut des services
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Surveillance en temps réel de tous nos services
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Statut actuel des services</CardTitle>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Tous les systèmes opérationnels</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusData.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        service.color === 'green' ? 'bg-green-500' : 
                        service.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{service.service}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-foreground/70">{service.status}</span>
                      <span className="text-sm font-mono">{service.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-center">
                <Link href="/status">
                  <Button variant="outline">
                    Voir le statut détaillé
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 sm:py-32 relative bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Trouvez rapidement des réponses aux questions les plus courantes
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xl font-semibold text-foreground mb-4">{category.category}</h3>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <Card key={faqIndex} className="border-2 hover:border-primary/50 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-base">{faq.q}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/docs">
              <Button variant="outline" size="lg">
                Voir toutes les FAQ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Resources */}
      <section className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ressources communautaires
            </h2>
            <p className="mt-4 text-lg text-foreground/80">
              Rejoignez notre communauté active et apprenez des autres utilisateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityResources.map((resource, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <resource.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-foreground/70 mb-4">{resource.members}</p>
                  <Link href={resource.link}>
                    <Button className="w-full" variant="outline">
                      Rejoindre
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 relative bg-destructive/5 border-t-2 border-destructive/20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="border-2 border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Problème critique ?</CardTitle>
              <CardDescription>
                Si vous rencontrez un problème de sécurité critique ou un incident majeur, 
                contactez-nous immédiatement.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="destructive">
                  Signaler un incident de sécurité
                </Button>
                <Button variant="outline">
                  Urgence Business (clients Enterprise)
                </Button>
              </div>
              <p className="text-sm text-foreground/70">
                Temps de réponse garanti : &lt; 1 heure pour les incidents critiques
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Vous n&apos;avez pas trouvé votre réponse ?
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground/80">
              Notre équipe support est disponible pour vous aider avec vos questions spécifiques.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Button size="lg" className="gap-2">
                <Mail className="h-4 w-4" />
                Contacter le support
              </Button>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  Parcourir la documentation
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
            Support disponible 24/7 • Temps de réponse moyen : 2h
          </p>
        </div>
      </footer>
    </div>
  );
}
