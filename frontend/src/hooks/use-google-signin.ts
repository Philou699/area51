"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void
          prompt: (
            callback?: (notification: GooglePromptNotification) => void,
          ) => void
        }
      }
    }
  }

  interface GooglePromptNotification {
    isNotDisplayed?: () => boolean
    isSkippedMoment?: () => boolean
    getNotDisplayedReason?: () => string | null | undefined
    getSkippedReason?: () => string | null | undefined
  }
}

interface UseGoogleSignInOptions {
  onToken: (token: string) => Promise<void>
}

interface UseGoogleSignInResult {
  isReady: boolean
  isLoading: boolean
  error: string | null
  signIn: () => void
  resetError: () => void
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

export function useGoogleSignIn({ onToken }: UseGoogleSignInOptions): UseGoogleSignInResult {
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, [])
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callbackRef = useRef(onToken)

  callbackRef.current = onToken

  useEffect(() => {
    if (!clientId) {
      setError("Google Sign-In n'est pas configuré. Ajoutez NEXT_PUBLIC_GOOGLE_CLIENT_ID à votre environnement.")
      return
    }

    let cancelled = false

    const initializeClient = () => {
      if (cancelled) {
        return
      }

      const googleId = window.google?.accounts?.id
      if (!googleId) {
        setError("Impossible d'initialiser Google Sign-In pour le moment.")
        return
      }

      googleId.initialize({
        client_id: clientId,
        ux_mode: "popup",
        cancel_on_tap_outside: true,
        callback: async (response: { credential?: string | null }) => {
          if (!response.credential) {
            setIsLoading(false)
            setError("La connexion Google n'a pas fourni de jeton.")
            return
          }

          try {
            await callbackRef.current(response.credential)
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Échec de la connexion Google."
            setError(message)
          } finally {
            setIsLoading(false)
          }
        },
      })

      setIsReady(true)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SCRIPT_SRC}"]`,
    )

    if (existingScript) {
      if (existingScript.dataset.ready === "true") {
        initializeClient()
        return () => {
          cancelled = true
        }
      }

      const handler = () => {
        existingScript.dataset.ready = "true"
        initializeClient()
      }

      existingScript.addEventListener("load", handler)
      existingScript.addEventListener("error", () => {
        setError("Impossible de charger Google Sign-In.")
      })

      return () => {
        cancelled = true
        existingScript.removeEventListener("load", handler)
      }
    }

    const script = document.createElement("script")
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.dataset.ready = "false"
    script.onload = () => {
      script.dataset.ready = "true"
      initializeClient()
    }
    script.onerror = () => {
      if (!cancelled) {
        setError("Impossible de charger Google Sign-In.")
      }
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [clientId])

  const signIn = useCallback(() => {
    if (!clientId) {
      setError("Configuration Google manquante.")
      return
    }

    const googleId = window.google?.accounts?.id
    if (!googleId) {
      setError("Google Sign-In n'est pas encore prêt. Réessayez dans un instant.")
      return
    }

    setError(null)
    setIsLoading(true)

    googleId.prompt((notification) => {
      const wasDismissed = notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()
      if (wasDismissed) {
        setIsLoading(false)

        const reason =
          notification.getNotDisplayedReason?.() ?? notification.getSkippedReason?.()

        if (reason && reason !== "dismissed_by_user") {
          setError("La fenêtre Google n'a pas pu s'afficher. Vérifiez que les pop-ups ne sont pas bloqués.")
        }
      }
    })
  }, [clientId])

  const resetError = useCallback(() => setError(null), [])

  return {
    isReady,
    isLoading,
    error,
    signIn,
    resetError,
  }
}
