// Types pour les services et areas

export interface ConfigSchema {
  type: string
  required?: string[]
  properties?: Record<string, {
    type: string
    description?: string
    format?: string
    enum?: string[]
    default?: unknown
    minimum?: number
    maximum?: number
  }>
}

export interface Action {
  id: number
  key: string
  description: string | null
  configSchema: ConfigSchema | null
}

export interface Reaction {
  id: number
  key: string
  description: string | null
  configSchema: ConfigSchema | null
}

export interface Service {
  id: number
  slug: string
  name: string
  requiresConnection?: boolean
  connected?: boolean
  actions: Action[]
  reactions: Reaction[]
}

export interface ServicesResponse {
  services: Service[]
}

export interface Area {
  id: number
  name: string
  enabled: boolean
  actionConfig: Record<string, unknown> | null
  reactionConfig: Record<string, unknown> | null
  dedupKeyStrategy: string | null
  createdAt: string
  action: Action & {
    service: {
      id: number
      slug: string
      name: string
    }
  }
  reaction: Reaction & {
    service: {
      id: number
      slug: string
      name: string
    }
  }
}

export interface AreasResponse {
  areas: Area[]
}

export interface CreateAreaPayload {
  name: string
  actionId: number
  reactionId: number
  actionConfig?: Record<string, unknown>
  reactionConfig?: Record<string, unknown>
  dedupKeyStrategy?: string
}

export interface UpdateAreaStatusPayload {
  enabled: boolean
}

export interface UpdateAreaPayload {
  name?: string
  actionId?: number
  reactionId?: number
  actionConfig?: Record<string, unknown>
  reactionConfig?: Record<string, unknown>
  dedupKeyStrategy?: string | null
}
