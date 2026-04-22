import { getAllServiceStatuses } from "@/lib/service-status"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const statuses = await getAllServiceStatuses()

  return Response.json(statuses, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
