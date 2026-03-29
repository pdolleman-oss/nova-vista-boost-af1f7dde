/**
 * Content Engine API service
 */
import { supabase } from "@/integrations/supabase/client";

export interface ContentRequest {
  id: string;
  project_id: string | null;
  user_id: string;
  channel: string;
  content_type: string;
  goal: string;
  campaign_title: string;
  audience_primary: string;
  audience_age_group: string;
  price_segment: string;
  audience_description: string;
  tone_of_voice: string[];
  brand_intensity: number;
  cta_style: string;
  forbidden_words: string;
  core_message: string;
  usp_points: string[];
  required_elements: string;
  destination_url: string;
  hashtags_enabled: boolean;
  emoji_allowed: boolean;
  has_media: boolean;
  visual_brief: string;
  post_action: string;
  publish_timing_mode: string;
  scheduled_at: string | null;
  allow_nvb_timing_advice: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRecommendation {
  id: string;
  content_request_id: string;
  suggested_tone_of_voice: string;
  suggested_audience: string;
  suggested_length: string;
  suggested_cta_style: string;
  suggested_publish_time: string;
  risk_flags: string[];
  reasoning_summary: string;
  created_at: string;
}

export interface ContentOutput {
  id: string;
  content_request_id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  body: string;
  short_version: string;
  cta_text: string;
  hashtags: string[];
  status: string;
  approval_status: string;
  publish_channel: string;
  scheduled_at: string | null;
  published_at: string | null;
  external_post_id: string;
  created_at: string;
  updated_at: string;
}

export type ContentRequestInput = Omit<ContentRequest, "id" | "user_id" | "status" | "created_at" | "updated_at">;

export const contentApi = {
  // ─── Requests ───
  async createRequest(input: Partial<ContentRequestInput>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return supabase
      .from("content_requests")
      .insert({ ...input, user_id: user.id } as any)
      .select()
      .single();
  },

  async listRequests() {
    return supabase.from("content_requests").select("*").order("created_at", { ascending: false });
  },

  async getRequest(id: string) {
    return supabase.from("content_requests").select("*").eq("id", id).single();
  },

  async updateRequest(id: string, updates: Partial<ContentRequestInput>) {
    return supabase.from("content_requests").update(updates as any).eq("id", id).select().single();
  },

  // ─── AI Actions ───
  async analyze(contentRequestId: string) {
    return supabase.functions.invoke("content-engine/analyze", {
      body: { content_request_id: contentRequestId },
    });
  },

  async generate(contentRequestId: string) {
    return supabase.functions.invoke("content-engine/generate", {
      body: { content_request_id: contentRequestId },
    });
  },

  // ─── Output Actions ───
  async approve(outputId: string) {
    return supabase.functions.invoke("content-engine/approve", {
      body: { output_id: outputId },
    });
  },

  async schedule(outputId: string, scheduledAt: string) {
    return supabase.functions.invoke("content-engine/schedule", {
      body: { output_id: outputId, scheduled_at: scheduledAt },
    });
  },

  async publish(outputId: string) {
    return supabase.functions.invoke("content-engine/publish", {
      body: { output_id: outputId },
    });
  },

  // ─── Reads ───
  async getRecommendation(contentRequestId: string) {
    return supabase
      .from("content_recommendations")
      .select("*")
      .eq("content_request_id", contentRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async getOutput(contentRequestId: string) {
    return supabase
      .from("content_outputs")
      .select("*")
      .eq("content_request_id", contentRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async updateOutput(id: string, updates: Record<string, any>) {
    return supabase.from("content_outputs").update(updates).eq("id", id).select().single();
  },

  async listOutputs() {
    return supabase.from("content_outputs").select("*").order("created_at", { ascending: false });
  },
};
