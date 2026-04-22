import { getServiceDefinition } from "@/lib/service-catalog"
import { getServiceStatus } from "@/lib/service-status"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
}

export async function GET(
  _request: Request,
  { params }: { params: { service: string } }
) {
  const service = getServiceDefinition(params.service)

  if (!service) {
    return Response.json(false, {
      status: 404,
      headers: NO_STORE_HEADERS,
    })
  }

  const isOnline = await getServiceStatus(service.id)

  if (isOnline) {
    return new Response(null, {
      status: 204,
      headers: NO_STORE_HEADERS,
    })
  }

  return new Response(null, {
    status: 503,
    headers: NO_STORE_HEADERS,
  })
}
