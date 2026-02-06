import { proxyAuthRequest } from "../auth/proxy"

export async function GET(request: Request) {
  return proxyAuthRequest(request, "/areas", "GET")
}

export async function POST(request: Request) {
  return proxyAuthRequest(request, "/areas", "POST")
}
