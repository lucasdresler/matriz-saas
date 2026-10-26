-- =========================================================================
-- MATRIZ OS - SCHEMA SQL MULTI-TENANT (SUPABASE / POSTGRESQL)
-- Suporte completo a:
-- 1. Uso Próprio (Workspace Matriz)
-- 2. Agência / Clientes de Consultoria (Múltiplas Organizações com isolamento)
-- 3. SaaS (Assinaturas, limites de plano e multi-instâncias de WhatsApp)
-- =========================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- COMPATIBILIDADE POSTGRESQL & EVOLUTION API
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS evolution;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT '00000000-0000-0000-0000-000000000000'::UUID;
$$ LANGUAGE SQL STABLE;

-- 2. TABELA DE ORGANIZAÇÕES / WORKSPACES (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    plan VARCHAR(50) DEFAULT 'Starter', -- 'Starter', 'Pro', 'Agência VIP'
    whatsapp_phone VARCHAR(50),
    whatsapp_status VARCHAR(50) DEFAULT 'disconnected', -- 'connected', 'qr_ready', 'disconnected'
    ai_active BOOLEAN DEFAULT true,
    max_whatsapp_instances INT DEFAULT 1,
    max_monthly_leads INT DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE USUÁRIOS / MEMBROS POR ORGANIZAÇÃO
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'attendant'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- 4. TABELA DE LEADS (CRM KANBAN)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'novo', -- 'novo', 'em_atendimento', 'aguardando_followup', 'agendado', 'concluido', 'perdido'
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    service_interest TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ai_paused BOOLEAN DEFAULT false,
    unread_count INT DEFAULT 0,
    estimated_value NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE MENSAGENS DO WHATSAPP (HISTÓRICO COMPLETO)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'lead', 'ai', 'human'
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'audio', 'image', 'document', 'appointment'
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 45,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'pending', 'canceled', 'completed'
    google_event_id VARCHAR(255),
    google_synced BOOLEAN DEFAULT false,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE CATÁLOGO DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE BASE DE CONHECIMENTO (RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size VARCHAR(50),
    chunks_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'indexed', -- 'indexed', 'processing', 'error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA DE CONFIGURAÇÕES DE IA POR WORKSPACE
CREATE TABLE IF NOT EXISTS public.ai_configurations (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    system_prompt TEXT DEFAULT 'Você é um assistente virtual humanizado e prestativo.',
    tone_of_voice VARCHAR(50) DEFAULT 'amigável_profissional',
    business_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00", "days": [1,2,3,4,5]}'::JSONB,
    followup_delay_minutes INT DEFAULT 120,
    human_handoff_keywords TEXT[] DEFAULT ARRAY['humano', 'falar com atendente', 'reclamação', 'falar com pessoa']::TEXT[],
    voice_reply_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lead ON public.chat_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- 11. POLÍTICAS DE ROW LEVEL SECURITY (RLS) - ISOLAMENTO TOTAL ENTRE EMPRESAS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

-- Exemplo de política RLS para Leads: O usuário só acessa leads da sua organização
DROP POLICY IF EXISTS "Membros acessam leads da sua organização" ON public.leads;
CREATE POLICY "Membros acessam leads da sua organização"
ON public.leads
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
