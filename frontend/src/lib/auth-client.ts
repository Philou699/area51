type ErrorPayload = {
  message?: string | string[]
  [key: string]: unknown
}

export class AuthApiError extends Error {
  status: number
  payload?: ErrorPayload

  constructor(message: string, status: number, payload?: ErrorPayload) {
    super(message)
    this.name = "AuthApiError"
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

  throw new AuthApiError(message, response.status, payload)
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    await parseError(response)
  }

  return (await response.json()) as T
}

export interface RegisterPayload {
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  access_token: string
  expires_in: number
  token_type: "Bearer"
  user: {
    id: string
    email: string
    roles: string[]
  }
}

export interface RegisterResponse extends LoginResponse {
  message: string
}

export type GoogleLoginResponse = LoginResponse

export async function registerWithEmail(data: RegisterPayload) {
  return postJson<RegisterResponse>("/api/auth/register", data)
}

export async function loginWithEmail(data: LoginPayload) {
  // rememberMe est géré côté client ; n'envoyons que les identifiants
  const { email, password } = data
  return postJson<LoginResponse>("/api/auth/login", { email, password })
}

export async function loginWithGoogle(token: string) {
  return postJson<GoogleLoginResponse>("/api/auth/oauth2/google", { token })
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  })

  if (!response.ok) {
    await parseError(response)
  }
}
