
CREATE TABLE public.billing_customers (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  livemode boolean NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.billing_subscriptions (
  stripe_subscription_id text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  price_id text,
  tier text,
  status text NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  livemode boolean NOT NULL,
  last_event_created bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_subscriptions_org_idx ON public.billing_subscriptions(organization_id);
CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  livemode boolean NOT NULL,
  processed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.billing_customers, public.billing_subscriptions TO authenticated;
GRANT ALL ON public.billing_customers, public.billing_subscriptions, public.stripe_webhook_events TO service_role;

CREATE POLICY "Org owners and admins view billing customer" ON public.billing_customers FOR SELECT TO authenticated
  USING (public.is_current_user_org_owner(organization_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Org members and admins view subscriptions" ON public.billing_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = billing_subscriptions.organization_id AND m.user_id = auth.uid() AND m.status='active'));

-- Paid access: admins (platform owner) always; otherwise an active/trialing, unexpired Stripe subscription on an active org membership.
CREATE OR REPLACE FUNCTION public.user_has_paid_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR EXISTS (
    SELECT 1 FROM public.billing_subscriptions s
    JOIN public.organization_members m ON m.organization_id = s.organization_id
    WHERE m.user_id = _user_id AND m.status='active'
      AND s.status IN ('active','trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
$$;
REVOKE EXECUTE ON FUNCTION public.user_has_paid_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_paid_access(uuid) TO authenticated, service_role;

-- Owners may edit their org, but not grant themselves a paid tier.
CREATE OR REPLACE FUNCTION public.protect_subscription_tier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR coalesce((current_setting('request.jwt.claims', true)::json->>'role'),'') = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(),'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.subscription_tier := 'hobby';
  ELSIF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    NEW.subscription_tier := OLD.subscription_tier;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER organizations_protect_tier BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_tier();
