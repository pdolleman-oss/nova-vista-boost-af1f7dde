
-- Social post status enum
CREATE TYPE public.social_post_status AS ENUM ('draft', 'approved', 'published', 'failed');

-- Social channel enum (extensible for Instagram, LinkedIn, X later)
CREATE TYPE public.social_channel AS ENUM ('facebook');

-- Social connections: stores page tokens per user
CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel social_channel NOT NULL DEFAULT 'facebook',
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL DEFAULT '',
  page_access_token TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, channel, page_id)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social connections" ON public.social_connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all social connections" ON public.social_connections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Social posts table
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  channel social_channel NOT NULL DEFAULT 'facebook',
  title TEXT DEFAULT '',
  post_text TEXT NOT NULL,
  media_url TEXT,
  status social_post_status NOT NULL DEFAULT 'draft',
  external_post_id TEXT,
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_social_posts_user ON public.social_posts(user_id);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_project ON public.social_posts(project_id);
CREATE INDEX idx_social_connections_user ON public.social_connections(user_id);

-- Updated_at trigger for social_posts
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
