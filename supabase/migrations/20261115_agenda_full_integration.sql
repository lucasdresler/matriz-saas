-- =========================================================================
-- AGILLEX HUB - INTEGRAÇÃO COMPLETA DOS RECURSOS DO AGILLEX AGENDA
-- Traz para o Hub todos os recursos administrativos:
-- 1. Profissionais & Escalas de Atendimento (disponibilidade semanal e serviços)
-- 2. Pacotes de Serviços & Assinaturas
-- 3. Produtos & Estoque de Balcão
-- 4. Vendas de Balcão
-- 5. Controle de Fiados & Pagamentos
-- 6. Extrato e Lançamento de Comissões
-- 7. Configurações da Página Pública (Cores, Banner, Logo, Regras e Sinal Pix)
-- =========================================================================

-- 1. ATUALIZAÇÕES NA TABELA DE ORGANIZAÇÕES
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS brand_color VARCHAR(20) DEFAULT '#2563EB',
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(10),
    ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS slot_interval_minutes INT DEFAULT 30,
    ADD COLUMN IF NOT EXISTS max_advance_days INT DEFAULT 30,
    ADD COLUMN IF NOT EXISTS min_cancel_hours INT DEFAULT 2,
    ADD COLUMN IF NOT EXISTS require_pix_deposit BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pix_deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS pix_deposit_percent NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS asaas_wallet_id VARCHAR(100);

-- 2. PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) DEFAULT 'Especialista',
    phone VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    service_commission_pct NUMERIC(5, 2) DEFAULT 0.00,
    product_commission_pct NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_professionals_org ON public.professionals(organization_id);

-- 3. GRADE SEMANAL DE HORÁRIOS (DISPONIBILIDADE)
CREATE TABLE IF NOT EXISTS public.professional_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 1=Segunda ... 7=Domingo
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '19:00',
    break_start TIME DEFAULT '12:00',
    break_end TIME DEFAULT '13:00',
    is_active BOOLEAN DEFAULT true,
    UNIQUE(professional_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_prof_avail_prof ON public.professional_availability(professional_id);

-- 4. VÍNCULO DE SERVIÇOS DO PROFISSIONAL
CREATE TABLE IF NOT EXISTS public.professional_services (
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, service_id)
);

-- 5. PACOTES DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    validity_days INT DEFAULT 30,
    sessions_count INT DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_packages_org ON public.service_packages(organization_id);

-- 6. PRODUTOS & BALCÃO (ESTOQUE)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Geral',
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    min_stock_alert INT DEFAULT 5,
    commission_pct NUMERIC(5, 2) DEFAULT 0.00,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);

-- 7. VENDAS DE BALCÃO
CREATE TABLE IF NOT EXISTS public.product_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    commission_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'pix',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_sales_org ON public.product_sales(organization_id);

-- 8. CONTROLE DE FIADOS
CREATE TABLE IF NOT EXISTS public.debt_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    description TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'aberto', -- 'aberto', 'parcial', 'quitado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debt_records_org ON public.debt_records(organization_id);

CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES public.debt_records(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'pix',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. COMISSÕES DA EQUIPE
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'servico', -- 'servico', 'produto'
    description TEXT NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    commission_pct NUMERIC(5, 2) NOT NULL,
    commission_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'pago'
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commissions_org ON public.commissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_commissions_prof ON public.commissions(professional_id);
