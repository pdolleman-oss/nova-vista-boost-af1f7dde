import { supabase } from "@/integrations/supabase/client";

async function invokeEdge(path: string, method: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/social-health/${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  return res.json();
}

export const socialHealthApi = {
  getHealth() {
    return invokeEdge("health", "GET");
  },

  runHealthCheck(connectionId: string) {
    return invokeEdge("check", "POST", { connection_id: connectionId });
  },

  runTestPublish(params: { connection_id: string; post_text: string; project_id?: string; cleanup?: boolean }) {
    return invokeEdge("test-run", "POST", params);
  },

  getTestRunHistory() {
    return invokeEdge("test-runs", "GET");
  },

  deleteTestPost(externalPostId: string, connectionId: string) {
    return invokeEdge("delete-test-post", "POST", { external_post_id: externalPostId, connection_id: connectionId });
  },

  setTestConnection(connectionId: string, isTest: boolean) {
    return invokeEdge("set-test-connection", "POST", { connection_id: connectionId, is_test: isTest });
  },
};
