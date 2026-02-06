import { proxyAuthRequest } from "../../auth/proxy"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyAuthRequest(request, `/areas/${id}`, "PUT")
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyAuthRequest(request, `/areas/${id}`, "DELETE")
}
