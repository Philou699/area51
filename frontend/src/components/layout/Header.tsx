"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useAuthUser } from "@/hooks/use-auth-user"

const primaryNav = [
  { href: "/features", label: "Fonctionnalités" },
  { href: "/areas", label: "Automatisations" },
  { href: "/connections", label: "Connexions" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/docs", label: "Documentation" },
]

export function Header() {
  const [open, setOpen] = React.useState(false)
  const authUser = useAuthUser()
  const userInitial = React.useMemo(() => {
    if (!authUser?.email) {
      return "?"
    }
    const trimmed = authUser.email.trim()
    return trimmed ? trimmed.charAt(0).toUpperCase() : "?"
  }, [authUser])

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleEsc)
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("keydown", handleEsc)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const toggleMenu = () => setOpen((value) => !value)
  const closeMenu = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 md:gap-10 px-4 md:px-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-primary/10">
            <Image src="/smallLogo.png" alt="Area51 logo" width={32} height={32} className="h-full w-full" priority />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            AREA<span className="text-primary">51</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/70 md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {authUser ? (
            <>
              <Link
                href="/my-profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-sm font-semibold uppercase text-primary"
                aria-label="Voir mon profil"
              >
                {userInitial}
              </Link>
              <Link
                href="/logout"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Déconnexion
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Se connecter
              </Link>
              <Button size="sm" asChild className="rounded-full px-5 font-semibold">
                <Link href="/signup">Essayer gratuitement</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-label="Ouvrir le menu"
            onClick={toggleMenu}
            className={cn(
              "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors duration-300",
              open ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
            )}
          >
            <span className="sr-only">Ouvrir le menu</span>
            <span
              aria-hidden
              className={cn(
                "absolute h-[2px] w-5 rounded-full bg-current transition-transform duration-300",
                open ? "translate-y-0 rotate-45" : "-translate-y-2.5"
              )}
            />
            <span
              aria-hidden
              className={cn(
                "absolute h-[2px] w-5 rounded-full bg-current transition-opacity duration-300",
                open ? "opacity-0" : "opacity-100"
              )}
            />
            <span
              aria-hidden
              className={cn(
                "absolute h-[2px] w-5 rounded-full bg-current transition-transform duration-300",
                open ? "translate-y-0 -rotate-45" : "translate-y-2.5"
              )}
            />
          </button>
        </div>
      </div>

      <div className={cn("md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "origin-top overflow-hidden border-t border-border bg-background/98 shadow-lg transition-[max-height,opacity] duration-300 ease-out",
            open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!open}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 transition-all duration-300",
              open ? "pb-6 pt-4" : "pb-0 pt-0"
            )}
          >
            <nav className="grid gap-2 text-base font-medium text-foreground/80">
              {primaryNav.map((item) => (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-border/40 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {authUser ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/my-profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-border/40 hover:text-foreground"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-xs font-semibold uppercase text-primary">
                    {userInitial}
                  </span>
                  Mon profil
                </Link>
                <Link
                  href="/logout"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  Se déconnecter
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-border/40 hover:text-foreground"
                >
                  Sign In
                </Link>
                <Button asChild className="rounded-full px-4 py-2 text-sm font-semibold">
                  <Link href="/signup" onClick={closeMenu}>
                    Start Free
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
