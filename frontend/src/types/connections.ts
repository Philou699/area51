export interface ConnectionStatus {
  provider: string
  connected: boolean
  connectedAt?: string | null
  details?: Record<string, unknown> | null
}

export interface ConnectionsResponse {
  connections: ConnectionStatus[]
}

export interface DiscordGuild {
  id: string
  name: string
  owner: boolean
  permissions?: string | null
}

export interface DiscordChannel {
  id: string
  name: string
  type: number
  parentId: string | null
  categoryName: string | null
}

export interface DiscordGuildsResponse {
  guilds: DiscordGuild[]
}

export interface DiscordChannelsResponse {
  channels: DiscordChannel[]
}
