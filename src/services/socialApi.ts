/**
 * Social Publisher Service Layer
 * Handles Facebook connect, post CRUD, and publishing.
 */
import { supabase } from "@/integrations/supabase/client";

export type SocialPostStatus = "draft" | "approved" | "published" | "failed";
export type SocialChannel = "facebook";

export interface SocialPost {
  id: string;
  user_id: string;
  project_id: string | null;
  channel: SocialChannel;
  title: string;
  post_text: string;
  media_url: string | null;
  status: SocialPostStatus;
  external_post_id: string | null;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialConnection {
  id: string;
  channel: SocialChannel;
  page_id: string;
  page_name: string;
  connected_at: string;
  is_active: boolean;
}

async function invokeEdge(path: string, method: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/social-publish/${path}`,
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

export const socialApi = {
  // ── Facebook Connect ──
  async connectFacebook(userAccessToken: string, pageId?: string) {
    return invokeEdge("connect", "POST", {
      user_access_token: userAccessToken,
      page_id: pageId,
    });
  },

  // ── Connection Status ──
  async getConnectionStatus(): Promise<{ success: boolean; data: SocialConnection[] }> {
    return invokeEdge("status", "GET");
  },

  // ── Posts ──
  async createPost(post: { project_id?: string; channel?: SocialChannel; title?: string; post_text: string; media_url?: string }) {
    return invokeEdge("posts", "POST", post);
  },

  async listPosts(status?: SocialPostStatus): Promise<{ success: boolean; data: SocialPost[] }> {
    const query = status ? `posts?status=${status}` : "posts";
    return invokeEdge(query, "GET");
  },

  async getPost(id: string): Promise<{ success: boolean; data: SocialPost }> {
    return invokeEdge(`posts/${id}`, "GET");
  },

  async updatePost(id: string, updates: Partial<Pick<SocialPost, "title" | "post_text" | "media_url" | "status">>) {
    return invokeEdge(`posts/${id}`, "PATCH", updates);
  },

  async publishPost(id: string) {
    return invokeEdge(`posts/${id}/publish`, "POST");
  },
};
