import { proxyAuthRequest } from "../auth/proxy"

export async function GET(request: Request) {
  return proxyAuthRequest(request, "/connections", "GET")
}
