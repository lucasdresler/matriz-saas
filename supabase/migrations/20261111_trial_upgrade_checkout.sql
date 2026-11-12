CREATE TABLE IF NOT EXISTS public.agillex_checkout_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(100) NOT NULL,
    asaas_subscription_id VARCHAR(100) UNIQUE,
    plan_id VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'creating'
        CHECK (status IN ('creating', 'pending', 'active', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agillex_checkout_intents_one_pending_per_org
    ON public.agillex_checkout_intents (organization_id)
    WHERE status IN ('creating', 'pending');
