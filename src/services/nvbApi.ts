/**
 * NVB Backend Service Layer
 * Centralizes all API calls to Supabase for projects, AI, outputs, tasks, logs, settings.
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export type TaskType =
  | "analysis" | "product_copy" | "email_draft" | "homepage_review"
  | "strategy" | "seo" | "ad_copy" | "action_plan"
  | "blog" | "social" | "email" | "ad";

export type OutputStatus = "draft" | "approved" | "published" | "archived";
export type RiskLevel = "low" | "medium" | "high";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "waiting_review" | "done";
export type AiMode = "safe" | "auto";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  business_type: string;
  ai_mode: AiMode;
  preferred_model: string;
  prompt_profile: string;
  created_at: string;
  updated_at: string;
}

export interface AiRunRequest {
  project_id?: string;
  task_type: TaskType;
  module_name?: string;
  input_text: string;
  context?: string;
}

export interface AiRunResponse {
  success: boolean;
  data?: {
    request_id: string;
    output_id: string;
    output_text: string;
    status: OutputStatus;
    risk_level: RiskLevel;
    task_type: string;
    model: string;
  };
  error?: string;
}

export interface AiOutput {
  id: string;
  request_id: string | null;
  user_id: string;
  project_id: string | null;
  module_name: string;
  title: string;
  output_text: string;
  output_json: any;
  status: OutputStatus;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  assigned_user_id: string;
  linked_output_id: string | null;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

// ─── Auth Helpers ─────────────────────────────────────────────

export const nvbAuth = {
  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  async register(email: string, password: string, fullName?: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || "" } },
    });
  },
  async logout() {
    return supabase.auth.signOut();
  },
  async me() {
    return supabase.auth.getUser();
  },
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    return supabase.from("profiles").select("*").eq("id", user.id).single();
  },
  async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    return supabase.from("profiles").update(updates).eq("id", user.id).select().single();
  },
};

// ─── Projects ─────────────────────────────────────────────────

export const nvbProjects = {
  async list() {
    return supabase.from("projects").select("*").order("created_at", { ascending: false });
  },
  async get(id: string) {
    return supabase.from("projects").select("*").eq("id", id).single();
  },
  async create(project: { name: string; description?: string; business_type?: string; ai_mode?: AiMode; preferred_model?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    return supabase.from("projects").insert({ ...project, owner_id: user.id }).select().single();
  },
  async update(id: string, updates: Partial<Pick<Project, "name" | "description" | "business_type" | "ai_mode" | "preferred_model" | "prompt_profile">>) {
    return supabase.from("projects").update(updates).eq("id", id).select().single();
  },
  async remove(id: string) {
    return supabase.from("projects").delete().eq("id", id);
  },
};

// ─── AI Engine ────────────────────────────────────────────────

export const nvbAi = {
  async run(request: AiRunRequest): Promise<AiRunResponse> {
    const { data, error } = await supabase.functions.invoke("nvb-ai-run", {
      body: request,
    });
    if (error) return { success: false, error: error.message };
    return data as AiRunResponse;
  },
  async history(limit = 50) {
    return supabase
      .from("ai_requests")
      .select("*, ai_outputs(*)")
      .order("created_at", { ascending: false })
      .limit(limit);
  },
  async getRequest(id: string) {
    return supabase.from("ai_requests").select("*, ai_outputs(*)").eq("id", id).single();
  },
};

// ─── Outputs ──────────────────────────────────────────────────

export const nvbOutputs = {
  async list(filters?: { project_id?: string; status?: OutputStatus }) {
    let query = supabase.from("ai_outputs").select("*").order("created_at", { ascending: false });
    if (filters?.project_id) query = query.eq("project_id", filters.project_id);
    if (filters?.status) query = query.eq("status", filters.status);
    return query;
  },
  async get(id: string) {
    return supabase.from("ai_outputs").select("*").eq("id", id).single();
  },
  async update(id: string, updates: { title?: string; output_text?: string; status?: OutputStatus }) {
    return supabase.from("ai_outputs").update(updates).eq("id", id).select().single();
  },
  async approve(id: string) {
    return this.update(id, { status: "approved" });
  },
  async publish(id: string) {
    return this.update(id, { status: "published" });
  },
  async archive(id: string) {
    return this.update(id, { status: "archived" });
  },
};

// ─── Tasks ────────────────────────────────────────────────────

export const nvbTasks = {
  async list(filters?: { project_id?: string; status?: TaskStatus }) {
    let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (filters?.project_id) query = query.eq("project_id", filters.project_id);
    if (filters?.status) query = query.eq("status", filters.status);
    return query;
  },
  async create(task: { project_id?: string; title: string; description?: string; priority?: TaskPriority; linked_output_id?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    return supabase.from("tasks").insert({ ...task, assigned_user_id: user.id }).select().single();
  },
  async update(id: string, updates: Partial<Pick<Task, "title" | "description" | "priority" | "status">>) {
    return supabase.from("tasks").update(updates).eq("id", id).select().single();
  },
  async remove(id: string) {
    return supabase.from("tasks").delete().eq("id", id);
  },
};

// ─── Logs ─────────────────────────────────────────────────────

export const nvbLogs = {
  async list(filters?: { project_id?: string; log_type?: string; limit?: number }) {
    let query = supabase.from("logs").select("*").order("created_at", { ascending: false });
    if (filters?.project_id) query = query.eq("project_id", filters.project_id);
    if (filters?.log_type) query = query.eq("log_type", filters.log_type);
    return query.limit(filters?.limit || 100);
  },
};

// ─── Settings ─────────────────────────────────────────────────

export const nvbSettings = {
  async get(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    return supabase.from("settings").select("*").eq("user_id", user.id).eq("project_id", projectId);
  },
  async set(projectId: string, key: string, value: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };
    // Upsert by checking existing
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("setting_key", key)
      .maybeSingle();
    if (existing) {
      return supabase.from("settings").update({ setting_value: value }).eq("id", existing.id).select().single();
    }
    return supabase.from("settings").insert({ user_id: user.id, project_id: projectId, setting_key: key, setting_value: value }).select().single();
  },
};
