import { proxyAuthRequest } from "../../../auth/proxy"

export async function POST(request: Request) {
  return proxyAuthRequest(request, "/connections/discord/start", "POST")
}
