import { proxyAuthRequest } from "../../proxy"

/**
 * Endpoint /api/auth/oauth2/google
 */
export async function POST(request: Request) {
  return proxyAuthRequest(request, "/auth/oauth2/google", "POST")
}
