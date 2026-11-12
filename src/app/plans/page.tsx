import Link from 'next/link';
import { SAAS_PLANS, type ModuleType } from '@/types/pricing';

const products: Array<{ module: ModuleType; name: string; description: string }> = [
  {
    module: 'combo',
    name: 'Agillex Hub',
    description: 'Atendimento com IA, Agenda, CRM Kanban e Agillex Pay em uma plataforma.',
  },
  {
    module: 'agenda',
    name: 'Agillex Agenda',
    description: 'Agendamentos online sincronizados com Google Calendar e WhatsApp.',
  },
  {
    module: 'atendimento',
    name: 'Agillex Atende',
    description: 'Atendimento inteligente no WhatsApp com IA e transferência para sua equipe.',
  },
  {
    module: 'cobranca',
    name: 'Agillex Cobrança',
    description: 'Notificações e régua de cobrança pelo WhatsApp com integração de pagamentos.',
  },
  {
    module: 'reputacao',
    name: 'Agillex Reputação',
    description: 'Gestão de avaliações, satisfação e reputação da sua empresa.',
  },
  {
    module: 'ged',
    name: 'Agillex GED',
    description: 'Gestão eletrônica de documentos com OCR, IA e alertas de vencimento.',
  },
];

const customPlans = [
  { name: 'Agillex Hub Corporativo / Redes', product: 'Agillex Hub', description: 'Múltiplas filiais, alto volume e integrações corporativas.' },
  { name: 'Atende Enterprise', product: 'Agillex Atende', description: 'Atendimento para operações com necessidades corporativas.' },
];

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function checkoutUrl(module: ModuleType, planId: string, cycle: 'monthly' | 'yearly') {
  const params = new URLSearchParams({
    upgrade: 'true',
    modulo: module,
    plano: planId,
    ciclo: cycle,
  });
  return `/checkout?${params.toString()}`;
}

export default function PlansPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '48px 20px', background: '#0B132B', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <Link href="/trial-expired" style={{ color: '#93C5FD', textDecoration: 'none' }}>
          ← Voltar ao Hub
        </Link>
        <header style={{ maxWidth: '760px', margin: '36px auto 48px', textAlign: 'center' }}>
          <p style={{ color: '#60A5FA', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Família Agillex
          </p>
          <h1 style={{ margin: '12px 0', fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            Escolha como continuar
          </h1>
          <p style={{ color: '#CBD5E1', lineHeight: 1.7 }}>
            Confira os produtos, recursos e preços mensais ou anuais antes de contratar. Seu
            workspace será liberado quando o pagamento for confirmado.
          </p>
        </header>

        <div style={{ display: 'grid', gap: '28px' }}>
          {products.map((product) => {
            const plans = Object.values(SAAS_PLANS).filter((plan) => plan.module === product.module);
            return (
              <section key={product.module} style={{ padding: '26px', borderRadius: '18px', background: '#172038', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.65rem' }}>{product.name}</h2>
                  <p style={{ margin: 0, color: '#CBD5E1' }}>{product.description}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: '16px' }}>
                  {plans.map((plan) => (
                    <article key={plan.id} style={{ display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '14px', background: '#0F172A', border: '1px solid rgba(96, 165, 250, 0.24)' }}>
                      {plan.badge && (
                        <span style={{ alignSelf: 'flex-start', marginBottom: '10px', color: '#67E8F9', fontSize: '0.75rem', fontWeight: 700 }}>
                          {plan.badge}
                        </span>
                      )}
                      <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>{plan.name}</h3>
                      <p style={{ minHeight: '44px', margin: '0 0 16px', color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {plan.tagline}
                      </p>
                      <ul style={{ flex: 1, margin: '0 0 20px', paddingLeft: '20px', color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <Link href={checkoutUrl(product.module, plan.id, 'monthly')} style={{ display: 'block', padding: '12px', borderRadius: '8px', background: '#2563EB', color: '#fff', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                          Mensal — {money(plan.priceMonthly)}/mês
                        </Link>
                        <Link href={checkoutUrl(product.module, plan.id, 'yearly')} style={{ display: 'block', padding: '12px', borderRadius: '8px', background: '#1E293B', color: '#E2E8F0', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                          Anual — {money(plan.priceYearlyMonthly)}/mês ({money(plan.annualTotal)}/ano)
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section style={{ marginTop: '28px', padding: '26px', borderRadius: '18px', background: '#172038', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.5rem' }}>Planos corporativos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: '16px' }}>
            {customPlans.map((plan) => (
              <article key={plan.name} style={{ padding: '20px', borderRadius: '14px', background: '#0F172A', border: '1px solid rgba(96, 165, 250, 0.24)' }}>
                <p style={{ margin: '0 0 8px', color: '#67E8F9', fontSize: '0.8rem', fontWeight: 700 }}>{plan.product}</p>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>{plan.name}</h3>
                <p style={{ minHeight: '48px', color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.5 }}>{plan.description}</p>
                <p style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>Sob consulta</p>
                <a href="https://wa.me/5511966381915?text=Olá,%20quero%20conhecer%20os%20planos%20corporativos%20Agillex" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: '8px', background: '#1E293B', color: '#E2E8F0', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                  Falar com consultor
                </a>
              </article>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: '36px', color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'center' }}>
          Pagamento protegido pelo Asaas. A cobrança recorrente será processada no ciclo escolhido.
          O acesso ao workspace será reativado após a confirmação do pagamento.
        </footer>
      </div>
    </main>
  );
}
