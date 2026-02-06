export interface SpotifyProfile {
  id: string
  display_name: string
  email?: string
  images?: Array<{
    url: string
    height?: number
    width?: number
  }>
  followers?: {
    total: number
  }
  country?: string
  product?: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string | null
  uri: string
  external_urls: {
    spotify: string
  }
  tracks: {
    total: number
  }
  public?: boolean
  collaborative?: boolean
  owner: {
    id: string
    display_name: string
  }
  images?: Array<{
    url: string
    height?: number
    width?: number
  }>
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
    external_urls: {
      spotify: string
    }
  }>
  album: {
    id: string
    name: string
    images: Array<{
      url: string
      height?: number
      width?: number
    }>
    external_urls: {
      spotify: string
    }
  }
  duration_ms: number
  explicit: boolean
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyCurrentlyPlaying {
  item?: SpotifyTrack
  is_playing: boolean
  progress_ms?: number
  currently_playing_type?: 'track' | 'episode' | 'ad' | 'unknown'
}

export interface SpotifyConnectionStatus {
  connected: boolean
  profile?: SpotifyProfile
  connectedAt?: string
}
