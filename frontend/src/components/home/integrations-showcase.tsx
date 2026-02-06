import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search } from "lucide-react"

export function IntegrationsShowcase() {
  const categories = [
    { name: "Communication", count: 150, color: "light-blue" },
    { name: "CRM & ventes", count: 200, color: "mint" },
    { name: "Marketing", count: 180, color: "soft-yellow" },
    { name: "Productivité", count: 220, color: "light-blue" },
    { name: "E-commerce", count: 140, color: "mint" },
    { name: "Analytique", count: 90, color: "soft-yellow" },
  ]

  const popularApps = [
    { name: "Slack", logo: "/images/slack.svg", color: "#4A154B", users: "50K+" },
    { name: "Gmail", logo: "/images/gmail.svg", color: "#EA4335", users: "45K+" },
    { name: "Discord", logo: "/images/discord.svg", color: "#5865F2", users: "40K+" },
    { name: "Github", logo: "/images/github.svg", color: "#181717", users: "38K+" },
    { name: "Notion", logo: "/images/notion.svg", color: "#000000", users: "35K+" },
    { name: "Strava", logo: "/images/strava.svg", color: "#FC4C02", users: "32K+" },
    { name: "Spotify", logo: "/images/spotify.svg", color: "#1DB954", users: "30K+" },
    { name: "Trello", logo: "/images/trello.svg", color: "#0052CC", users: "28K+" },
  ]

  return (
    <section id="integrations" className="bg-transparent px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold text-navy md:text-5xl dark:text-white">
            Connectez-vous à{" "}
            <span className="bg-gradient-to-r from-light-blue to-mint bg-clip-text text-transparent">plus de 1 200 applications</span>
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Intégrez tous vos outils favoris. De la communication à l’analyse, nous proposons des intégrations
            natives et approfondies.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="group cursor-pointer border-2 border-border bg-card p-6 transition-all hover:border-light-blue hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-bold text-navy dark:text-white">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} intégrations</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-light-blue dark:text-gray-300" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-12">
          <h3 className="mb-6 text-center text-2xl font-bold text-navy dark:text-white">Intégrations les plus populaires</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {popularApps.map((app, index) => (
              <Card
                key={index}
                className="group cursor-pointer border-2 border-border bg-card p-4 transition-all hover:border-mint hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${app.color}15` }}
                  >
                    <span
                      className="block h-6 w-6"
                      style={{
                        WebkitMaskImage: `url(${app.logo})`,
                        maskImage: `url(${app.logo})`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                        backgroundColor: app.color,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-navy dark:text-white">{app.name}</div>
                    <div className="text-xs text-muted-foreground">{app.users} utilisateurs</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="group border-navy text-navy hover:bg-navy hover:text-white bg-transparent dark:border-light-blue dark:text-light-blue dark:hover:bg-light-blue/15"
          >
            <Search className="mr-2 h-4 w-4" />
            Explorer toutes les intégrations
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
