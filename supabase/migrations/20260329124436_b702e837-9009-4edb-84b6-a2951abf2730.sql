
CREATE TYPE public.content_request_status AS ENUM ('draft', 'analyzing', 'analyzed', 'generating', 'generated', 'review', 'approved', 'scheduled', 'published', 'failed');
CREATE TYPE public.content_approval_status AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');

CREATE TABLE public.content_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'facebook',
  content_type text NOT NULL DEFAULT 'post',
  goal text DEFAULT '',
  campaign_title text DEFAULT '',
  audience_primary text DEFAULT '',
  audience_age_group text DEFAULT '',
  price_segment text DEFAULT '',
  audience_description text DEFAULT '',
  tone_of_voice text[] DEFAULT '{}',
  brand_intensity integer DEFAULT 3,
  cta_style text DEFAULT '',
  forbidden_words text DEFAULT '',
  core_message text DEFAULT '',
  usp_points text[] DEFAULT '{}',
  required_elements text DEFAULT '',
  destination_url text DEFAULT '',
  hashtags_enabled boolean DEFAULT true,
  emoji_allowed boolean DEFAULT true,
  has_media boolean DEFAULT false,
  visual_brief text DEFAULT '',
  post_action text DEFAULT 'draft',
  publish_timing_mode text DEFAULT 'manual',
  scheduled_at timestamptz,
  allow_nvb_timing_advice boolean DEFAULT true,
  status content_request_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.content_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_request_id uuid NOT NULL REFERENCES public.content_requests(id) ON DELETE CASCADE,
  suggested_tone_of_voice text DEFAULT '',
  suggested_audience text DEFAULT '',
  suggested_length text DEFAULT '',
  suggested_cta_style text DEFAULT '',
  suggested_publish_time text DEFAULT '',
  risk_flags text[] DEFAULT '{}',
  reasoning_summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.content_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_request_id uuid NOT NULL REFERENCES public.content_requests(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  title text DEFAULT '',
  body text DEFAULT '',
  short_version text DEFAULT '',
  cta_text text DEFAULT '',
  hashtags text[] DEFAULT '{}',
  status content_request_status DEFAULT 'draft',
  approval_status content_approval_status DEFAULT 'pending',
  publish_channel text DEFAULT '',
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_content_requests_user ON public.content_requests(user_id);
CREATE INDEX idx_content_requests_project ON public.content_requests(project_id);
CREATE INDEX idx_content_requests_status ON public.content_requests(status);
CREATE INDEX idx_content_recommendations_request ON public.content_recommendations(content_request_id);
CREATE INDEX idx_content_outputs_request ON public.content_outputs(content_request_id);
CREATE INDEX idx_content_outputs_user ON public.content_outputs(user_id);

CREATE TRIGGER update_content_requests_updated_at BEFORE UPDATE ON public.content_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_recommendations_updated_at BEFORE UPDATE ON public.content_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_outputs_updated_at BEFORE UPDATE ON public.content_outputs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content requests" ON public.content_requests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all content requests" ON public.content_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own recommendations" ON public.content_recommendations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.content_requests cr WHERE cr.id = content_request_id AND cr.user_id = auth.uid()));
CREATE POLICY "Users can insert own recommendations" ON public.content_recommendations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.content_requests cr WHERE cr.id = content_request_id AND cr.user_id = auth.uid()));
CREATE POLICY "Admins can manage all recommendations" ON public.content_recommendations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own content outputs" ON public.content_outputs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all content outputs" ON public.content_outputs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
