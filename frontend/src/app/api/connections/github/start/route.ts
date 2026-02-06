import { proxyAuthRequest } from "../../../auth/proxy"

export async function POST(request: Request) {
  return proxyAuthRequest(request, "/connections/github/start", "POST")
}

export async function GET(request: Request) {
  return proxyAuthRequest(request, "/connections/github/start", "GET")
}
