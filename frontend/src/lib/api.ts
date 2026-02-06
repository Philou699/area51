import { clearAuthSession, getActiveAuthStorage, saveAuthSession } from "@/lib/auth-storage"
import type { LoginResponse } from "@/lib/auth-client"
import type {
  ServicesResponse,
  AreasResponse,
  Area,
  CreateAreaPayload,
  UpdateAreaStatusPayload,
  UpdateAreaPayload,
} from "@/types/area"
import type { ConnectionsResponse } from "@/types/connections"
import type { SpotifyProfile, SpotifyPlaylist, SpotifyCurrentlyPlaying } from "@/types/spotify"
import type {
  DiscordGuildsResponse,
  DiscordChannelsResponse,
} from "@/types/connections"

// Error handling
type ErrorPayload = {
  message?: string | string[]
  [key: string]: unknown
}

export class ApiError extends Error {
  status: number
  payload?: ErrorPayload

  constructor(message: string, status: number, payload?: ErrorPayload) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

async function parseError(response: Response): Promise<never> {
  let message = `Unexpected error (${response.status})`
  let payload: ErrorPayload | undefined

  try {
    payload = (await response.json()) as ErrorPayload
    if (payload?.message) {
      message = Array.isArray(payload.message)
        ? payload.message.join(" ")
        : String(payload.message)
    }
  } catch {
    try {
      const text = await response.text()
      if (text) {
        message = text
      }
    } catch {
      // Ignore parsing errors and keep default message
    }
  }

  throw new ApiError(message, response.status, payload)
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const text = await response.text()

  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

let refreshRequest: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  if (!refreshRequest) {
    refreshRequest = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        })

        if (!response.ok) {
          return false
        }

        const data = (await response.json()) as LoginResponse
        const rememberMe = getActiveAuthStorage() === "local"

        saveAuthSession({
          user: data.user,
          accessToken: data.access_token,
          rememberMe,
        })

        return true
      } catch (error) {
        console.error("Échec du rafraîchissement du jeton", error)
        clearAuthSession()
        return false
      } finally {
        refreshRequest = null
      }
    })()
  }

  return refreshRequest
}

// Get authentication token from localStorage or sessionStorage
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  // Try localStorage first (remember me = true)
  const localToken = localStorage.getItem("auth_access_token")
  if (localToken) return localToken

  // Fallback to sessionStorage (remember me = false)
  return sessionStorage.getItem("auth_access_token")
}

// Generic fetch function with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
  allowRetry = true
): Promise<T> {
  const token = getAuthToken()

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(endpoint, {
    ...options,
    credentials: options.credentials ?? "include",
    headers,
  })

  if (response.ok) {
    return parseResponseBody<T>(response)
  }

  if (response.status === 401 && allowRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return fetchWithAuth<T>(endpoint, options, false)
    }
  }

  return await parseError(response)
}

// API functions

/**
 * Get all available services with their actions and reactions
 */
export async function getServices(): Promise<ServicesResponse> {
  return fetchWithAuth<ServicesResponse>("/api/services")
}

/**
 * Get all areas for the authenticated user
 */
export async function getAreas(): Promise<AreasResponse> {
  return fetchWithAuth<AreasResponse>("/api/areas")
}

/**
 * Create a new area
 */
export async function createArea(payload: CreateAreaPayload): Promise<Area> {
  return fetchWithAuth<Area>("/api/areas", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Update area status (enable/disable)
 */
export async function updateAreaStatus(
  areaId: number,
  payload: UpdateAreaStatusPayload
): Promise<Area> {
  return fetchWithAuth<Area>(`/api/areas/${areaId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

/**
 * Delete an area
 */
export async function deleteArea(areaId: number): Promise<void> {
  await fetchWithAuth<void>(`/api/areas/${areaId}`, {
    method: "DELETE",
  })
}

export async function updateArea(
  areaId: number,
  payload: UpdateAreaPayload
): Promise<Area> {
  return fetchWithAuth<Area>(`/api/areas/${areaId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

/**
 * Récupère le statut des connexions OAuth de l'utilisateur courant.
 */
export async function getConnections(): Promise<ConnectionsResponse> {
  return fetchWithAuth<ConnectionsResponse>("/api/connections")
}

/**
 * Initialise le flux OAuth GitHub et retourne l'URL d'autorisation à ouvrir.
 */
export async function startGithubConnection(): Promise<{
  authorizeUrl: string
  state: string
}> {
  return fetchWithAuth<{ authorizeUrl: string; state: string }>(
    "/api/connections/github/start"
  )
}

export async function disconnectGithubConnection(): Promise<void> {
  await fetchWithAuth<void>('/api/connections/github', {
    method: 'DELETE',
  })
}

/**
 * Initiate Spotify OAuth flow - redirect to Spotify authorization
 */
export function startSpotifyConnection(): void {
  if (typeof window !== "undefined") {
    const token = getAuthToken()
    if (token) {
      // Set token in header for the redirect
      window.location.href = `/api/auth/spotify?token=${encodeURIComponent(token)}`
    } else {
      window.location.href = '/api/auth/spotify'
    }
  }
}

export async function disconnectSpotifyConnection(): Promise<void> {
  await fetchWithAuth<void>('/api/connections/spotify', {
    method: 'DELETE',
  })
}

/**
 * Get user's Spotify profile
 */
export async function getSpotifyProfile(): Promise<SpotifyProfile> {
  return fetchWithAuth<SpotifyProfile>("/api/spotify/profile")
}

/**
 * Get user's Spotify playlists
 */
export async function getSpotifyPlaylists(): Promise<SpotifyPlaylist[]> {
  return fetchWithAuth<SpotifyPlaylist[]>("/api/spotify/playlists")
}

/**
 * Get currently playing track
 */
export async function getSpotifyNowPlaying(): Promise<SpotifyCurrentlyPlaying | null> {
  return fetchWithAuth<SpotifyCurrentlyPlaying | null>("/api/spotify/now-playing")
}
  
/**
 * Initialise le flux OAuth Discord.
 */
export async function startDiscordConnection(): Promise<{
  authorizeUrl: string
  state: string
}> {
  return fetchWithAuth<{ authorizeUrl: string; state: string }>(
    "/api/connections/discord/start",
    {
      method: "POST",
    }
  )
}

export async function disconnectDiscordConnection(): Promise<void> {
  await fetchWithAuth<void>('/api/connections/discord', {
    method: 'DELETE',
  })
}

/**
 * Finalise la connexion Discord après le retour OAuth.
 */
export async function completeDiscordConnection(payload: {
  code: string
  state: string
  guildId?: string
}): Promise<{
  success: boolean
  provider: string
  account: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  guild?: {
    id: string
    name: string
    owner: boolean
    permissions?: string
  }
}> {
  return fetchWithAuth("/api/connections/discord/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Récupère les guildes (serveurs) Discord disponibles pour l'utilisateur.
 */
export async function getDiscordGuilds(): Promise<DiscordGuildsResponse> {
  return fetchWithAuth<DiscordGuildsResponse>("/api/connections/discord/guilds")
}

/**
 * Récupère les canaux Discord pour une guilde donnée.
 */
export async function getDiscordChannels(
  guildId: string
): Promise<DiscordChannelsResponse> {
  return fetchWithAuth<DiscordChannelsResponse>(
    `/api/connections/discord/guilds/${guildId}/channels`
  )
}

/**
 * Store authentication token in localStorage
 */
export function setAuthToken(token: string, rememberMe = true): void {
  if (typeof window !== "undefined") {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem("auth_access_token", token)
  }
}

/**
 * Remove authentication token from both localStorage and sessionStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_access_token")
    sessionStorage.removeItem("auth_access_token")
  }
}
