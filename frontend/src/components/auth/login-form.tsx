"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGoogleSignIn } from "@/hooks/use-google-signin"
import { AuthApiError, loginWithEmail, loginWithGoogle } from "@/lib/auth-client"
import { saveAuthSession } from "@/lib/auth-storage"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null)

  const navigateAfterSuccess = useCallback(() => {
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current)
    }
    redirectTimeout.current = setTimeout(() => {
      router.push("/")
    }, 900)
  }, [router])

  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
      }
    }
  }, [])

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof AuthApiError) {
      setError(err.message)
      return
    }

    if (err instanceof Error) {
      setError(err.message)
      return
    }

    setError("Une erreur inattendue est survenue. Veuillez réessayer.")
  }, [])

  const handleGoogleCredential = useCallback(
    async (token: string) => {
      setError(null)
      setSuccess(null)

      const response = await loginWithGoogle(token)

      saveAuthSession({
        user: response.user,
        accessToken: response.access_token,
        rememberMe: true,
      })

      setSuccess("Connexion Google réussie ! Redirection en cours…")
      navigateAfterSuccess()
    },
    [navigateAfterSuccess],
  )

  const {
    isReady: isGoogleReady,
    isLoading: isGoogleLoading,
    error: googleError,
    signIn: triggerGoogleSignIn,
    resetError: resetGoogleError,
  } = useGoogleSignIn({ onToken: handleGoogleCredential })

  useEffect(() => {
    if (googleError) {
      setError(googleError)
    }
  }, [googleError])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    resetGoogleError()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const response = await loginWithEmail({ email, password, rememberMe })

      saveAuthSession({
        user: response.user,
        accessToken: response.access_token,
        rememberMe,
      })

      setSuccess("Connexion réussie ! Redirection en cours…")
      navigateAfterSuccess()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-mint/40 bg-mint-muted/30 text-foreground"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="space-y-3">
        <Button
          variant="outline"
          className="relative w-full bg-white/70 text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          type="button"
          onClick={() => {
            if (!isGoogleReady || isGoogleLoading) {
              return
            }
            resetGoogleError()
            triggerGoogleSignIn()
          }}
          disabled={!isGoogleReady || isGoogleLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion en cours…
            </>
          ) : (
            "Continuer avec Google"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Nous n&apos;enverrons jamais rien sans votre consentement.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Ou continuez avec votre email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
            />
            <label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
              Rester connecté
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-light-blue transition-colors hover:text-light-blue/80"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          className="relative w-full overflow-hidden bg-gradient-to-r from-navy via-light-blue to-mint text-white shadow-lg transition hover:shadow-xl dark:via-light-blue/70"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-light-blue transition-colors hover:text-light-blue/80">
          Inscrivez-vous gratuitement
        </Link>
      </p>
    </div>
  )
}
