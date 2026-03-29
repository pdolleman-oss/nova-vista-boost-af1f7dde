
-- ============================================
-- NVB Backend: Projects, AI Requests/Outputs, Tasks, Logs, Settings
-- ============================================

-- ENUMS
CREATE TYPE public.ai_mode AS ENUM ('safe', 'auto');
CREATE TYPE public.output_status AS ENUM ('draft', 'approved', 'published', 'archived');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'waiting_review', 'done');

-- A. PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  ai_mode ai_mode NOT NULL DEFAULT 'safe',
  preferred_model TEXT DEFAULT 'google/gemini-3-flash-preview',
  prompt_profile TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- B. AI REQUESTS
CREATE TABLE public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  module_name TEXT DEFAULT '',
  input_text TEXT NOT NULL,
  system_prompt_used TEXT DEFAULT '',
  subprompt_used TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_requests_user ON public.ai_requests(user_id);
CREATE INDEX idx_ai_requests_project ON public.ai_requests(project_id);
CREATE INDEX idx_ai_requests_type ON public.ai_requests(task_type);

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_requests" ON public.ai_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own ai_requests" ON public.ai_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all ai_requests" ON public.ai_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- C. AI OUTPUTS
CREATE TABLE public.ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.ai_requests(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  module_name TEXT DEFAULT '',
  title TEXT DEFAULT '',
  output_text TEXT DEFAULT '',
  output_json JSONB DEFAULT '{}'::jsonb,
  status output_status NOT NULL DEFAULT 'draft',
  risk_level risk_level NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_outputs_user ON public.ai_outputs(user_id);
CREATE INDEX idx_ai_outputs_project ON public.ai_outputs(project_id);
CREATE INDEX idx_ai_outputs_status ON public.ai_outputs(status);

ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outputs" ON public.ai_outputs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own outputs" ON public.ai_outputs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own outputs" ON public.ai_outputs
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all outputs" ON public.ai_outputs
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_outputs_updated_at
  BEFORE UPDATE ON public.ai_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- D. TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_user_id UUID NOT NULL,
  linked_output_id UUID REFERENCES public.ai_outputs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_user ON public.tasks(assigned_user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (assigned_user_id = auth.uid());
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (assigned_user_id = auth.uid());
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (assigned_user_id = auth.uid());
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE TO authenticated USING (assigned_user_id = auth.uid());
CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- E. LOGS
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logs_user ON public.logs(user_id);
CREATE INDEX idx_logs_project ON public.logs(project_id);
CREATE INDEX idx_logs_type ON public.logs(log_type);
CREATE INDEX idx_logs_created ON public.logs(created_at DESC);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own logs" ON public.logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all logs" ON public.logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- F. SETTINGS
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_settings_unique ON public.settings(user_id, project_id, setting_key);
CREATE INDEX idx_settings_user ON public.settings(user_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON public.settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all settings" ON public.settings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- G. SYSTEM PROMPTS TABLE (for NVB core + task-specific prompts)
CREATE TABLE public.system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active prompts" ON public.system_prompts
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage prompts" ON public.system_prompts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
