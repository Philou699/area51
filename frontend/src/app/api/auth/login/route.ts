import { proxyAuthRequest } from "../proxy";

/**
 * Endpoint /api/auth/login
 */
export async function POST(request: Request) {
  return proxyAuthRequest(request, "/auth/login", "POST");
}
