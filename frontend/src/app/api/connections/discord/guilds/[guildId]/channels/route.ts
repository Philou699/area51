import { NextRequest } from "next/server"
import { proxyAuthRequest } from "../../../../../auth/proxy"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await context.params

  return proxyAuthRequest(
    request,
    `/connections/discord/guilds/${guildId}/channels`,
    "GET"
  )
}
