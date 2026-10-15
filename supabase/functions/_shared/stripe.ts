import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

export function stripeClient(secretKey: string) {
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}
export const cryptoProvider = Stripe.createSubtleCryptoProvider();
export type { Stripe };

export function adminDb() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// Validates the JWT via getClaims and returns the user id.
export async function requireUser(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await anon.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

// Server-side owner authorization: only organizations.owner_id may manage billing.
export async function requireOrgOwner(db: ReturnType<typeof adminDb>, orgId: unknown, userId: string) {
  if (typeof orgId !== "string" || !/^[0-9a-f-]{36}$/i.test(orgId)) return null;
  const { data } = await db.from("organizations").select("id, name, owner_id").eq("id", orgId).maybeSingle();
  if (!data || data.owner_id !== userId) return null;
  return data;
}
