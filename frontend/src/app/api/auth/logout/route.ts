import { proxyAuthRequest } from "../proxy"

/**
 * Endpoint /api/auth/logout
 */
export async function POST(request: Request) {
  return proxyAuthRequest(request, "/auth/logout", "POST")
}
