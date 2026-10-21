type D1Row = Record<string, unknown>
type D1Result = { success: boolean; results?: D1Row[]; errors?: unknown }

export async function d1Query(
  sql: string,
  params: unknown[]
): Promise<D1Row[]> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const database = process.env.CLOUDFLARE_D1_DATABASE_ID
  const token = process.env.CLOUDFLARE_D1_API_TOKEN
  if (!account || !database || !token) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and " +
        "CLOUDFLARE_D1_API_TOKEN are not set, see .env.example"
    )
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  )
  if (!res.ok) {
    throw new Error(`D1 query failed: HTTP ${res.status}`)
  }
  const body = (await res.json()) as {
    result?: D1Result[]
    success?: boolean
    errors?: unknown
  }
  const result = body.result?.[0]
  if (body.success === false || !result?.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(body.errors ?? result)}`)
  }
  if (!Array.isArray(result.results)) {
    throw new Error("D1 returned an invalid query result")
  }
  return result.results
}
