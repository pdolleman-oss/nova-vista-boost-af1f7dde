
-- Extend projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS test_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS safe_mode_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_test_page_id text,
  ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_health_check_at timestamptz;

-- Extend social_connections
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS is_test_connection boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permissions_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_validation_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_error_message text;

-- Extend social_posts
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS content_output_id uuid,
  ADD COLUMN IF NOT EXISTS connection_id uuid,
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS full_payload jsonb,
  ADD COLUMN IF NOT EXISTS retrieved_after_publish boolean,
  ADD COLUMN IF NOT EXISTS content_validated boolean,
  ADD COLUMN IF NOT EXISTS cta_detected boolean,
  ADD COLUMN IF NOT EXISTS hashtags_detected boolean,
  ADD COLUMN IF NOT EXISTS validation_result jsonb,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_details jsonb;

-- Extend content_outputs
ALTER TABLE public.content_outputs
  ADD COLUMN IF NOT EXISTS publish_mode text DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS publish_validation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_publish_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_publish_error text;

-- New table: social_health_checks
CREATE TABLE IF NOT EXISTS public.social_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.social_connections(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'facebook',
  mode text NOT NULL DEFAULT 'live',
  status text NOT NULL DEFAULT 'pending',
  token_valid boolean,
  page_connected boolean,
  publish_test_success boolean,
  retrievable boolean,
  content_valid boolean,
  cta_detected boolean,
  hashtags_detected boolean,
  external_post_id text,
  warnings text[] DEFAULT '{}'::text[],
  errors text[] DEFAULT '{}'::text[],
  raw_response jsonb DEFAULT '{}'::jsonb,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health checks" ON public.social_health_checks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_connections sc
    WHERE sc.id = social_health_checks.connection_id AND sc.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all health checks" ON public.social_health_checks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- New table: social_test_runs
CREATE TABLE IF NOT EXISTS public.social_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.social_connections(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'facebook',
  initiated_by_user_id uuid NOT NULL,
  test_type text NOT NULL DEFAULT 'publish_and_validate',
  request_payload jsonb DEFAULT '{}'::jsonb,
  response_payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_test_post boolean DEFAULT false,
  retrieved_test_post boolean DEFAULT false,
  deleted_test_post boolean DEFAULT false,
  external_post_id text,
  summary text,
  warnings text[] DEFAULT '{}'::text[],
  errors text[] DEFAULT '{}'::text[],
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own test runs" ON public.social_test_runs
  FOR ALL TO authenticated
  USING (initiated_by_user_id = auth.uid())
  WITH CHECK (initiated_by_user_id = auth.uid());

CREATE POLICY "Admins can manage all test runs" ON public.social_test_runs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
