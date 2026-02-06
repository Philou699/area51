import { proxyAuthRequest } from "../proxy";

/**
 * Endpoint /api/auth/register
 */
export async function POST(request: Request) {
  return proxyAuthRequest(request, "/auth/register", "POST");
}
