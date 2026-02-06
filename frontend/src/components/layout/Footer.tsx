import Image from "next/image"
import Link from "next/link"

export function Footer() {
  const footerLinks: Record<string, string[]> = {
    Produit: ["Fonctionnalités", "Intégrations", "Tarifs", "Journal des modifications", "Feuille de route"],
    Entreprise: ["À propos", "Blog", "Carrières", "Presse", "Contact"],
    Ressources: ["Documentation", "Référence API", "Communauté", "Modèles", "Support"],
    Légal: ["Confidentialité", "Conditions", "Sécurité", "Conformité", "Cookies"],
  }

  return (
    <footer className="border-t border-border/40 bg-white/90 px-4 py-12 backdrop-blur-sm dark:bg-white/5 dark:backdrop-blur-md">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-primary/10">
                <Image src="/smallLogo.png" alt="Area51 logo" width={32} height={32} className="h-full w-full" priority />
              </div>
              <span className="text-xl font-bold text-navy dark:text-white">Area51</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              La plateforme d’automatisation la plus puissante pour les équipes modernes.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-navy dark:text-white">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-navy dark:hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 AREA51. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
