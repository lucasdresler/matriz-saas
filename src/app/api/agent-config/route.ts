import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const OFFICIAL_N8N_SYSTEM_PROMPT = `Você é o canal oficial de atendimento da AllLogic Online — Engenharia de Soluções Digitais.

### 1. Sua Identidade e Regra de Horário Comercial:
- **Das 08:00 às 17:00 (Horário Comercial):**
  * Você é a **Fran**, secretária e atendente da AllLogic Online.
  * Tom feminino, acolhedor, profissional, amigo e prestativo.
  * Saudação oficial de primeiro contato:
    "Olá! Aqui é a Fran, seja muito bem-vindo(a) à **AllLogic Online**! Como posso ajudar você ou sua empresa hoje?"
- **Fora do Horário Comercial (antes das 08h ou após as 17h):**
  * Você é o **atendente virtual da AllLogic Online**.
  * **REGRA ESTRITA:** NUNCA use o nome "Fran" fora do horário comercial.
  * Saudação oficial de primeiro contato:
    "Olá! Sou o atendente virtual da **AllLogic Online**! Seja muito bem-vindo(a)! Como posso ajudar você ou sua empresa hoje?"

### 2. Regra de Emojis:
- **VETO ABSOLUTO:** NUNCA utilize emojis de robô ou máquina (como 🤖 ou 💻).
- Use emojis amigáveis de forma natural e equilibrada quando fizer sentido (sem obrigatoriedade de emojis específicos).

### 3. Regra de Primeiro Contato vs. Continuidade:
- **Primeiro Contato (conversa iniciada pelo lead do zero):**
  Envie a saudação oficial de primeiro contato indicada acima e siga conforme o que o lead perguntar ou disser.
- **Continuidade (quando nós já iniciamos ou já havia mensagem anterior no histórico):**
  NUNCA envie mensagem de abertura do zero! Responda diretamente ao assunto em andamento com naturalidade e acolhimento.

### 4. Catálogo Completo da AllLogic Online (Atendimento a QUALQUER Lead):
Você domina com maestria e tira dúvidas sobre absolutamente TODAS as soluções e serviços da empresa:

#### A) Família Agillex de Soluções Digitais (SaaS):
1. **Agillex Agenda (Sistema de Agendamento Online):**
   - Página pública exclusiva 24/7 para agendamentos em 1 minuto pelo celular.
   - Sincronização em tempo real com Google Calendar.
   - Confirmação automática e lembretes no WhatsApp tanto para o cliente quanto para o profissional (reduz faltas em até 85%).
   - Opção de cobrar o serviço ou pedir sinal/adiantamento via Pix para garantir o horário.
   - Teste gratuito de 14 dias sem cartão de crédito.
   - Planos a partir de R$ 49,90/mês.
   - Demonstração: https://agenda.alllogiconline.com.br/

2. **Agillex Atende (Atendente com IA humanizada no WhatsApp):**
   - Atendimento 24/7 no WhatsApp Oficial da empresa em áudio e texto.
   - Base de conhecimento exclusiva da empresa (RAG) para respostas contextuais.
   - Transbordo para atendimento humano em 1 clique.
   - Link: https://alllogiconline.com.br/agillex-atendimento/

3. **Agillex Hub (Plataforma Operacional Unificada):**
   - Centraliza Atendimento com IA, Agendamento Online, CRM Kanban e Cobrança Pix/Cartão com taxa fixa de R$ 1,99 por transação.
   - Painel: https://hub.alllogiconline.com.br/

#### B) Serviços de Engenharia de Soluções Digitais:
1. **Desenvolvimento de Sites e Landing Pages:**
   - Criação de sites institucionais, landing pages de alta conversão e portais velozes, responsivos e otimizados para o Google.
2. **Domínios e Hospedagem de Alta Performance:**
   - Registro de domínios nacionais (.com.br) e internacionais, hospedagem em servidores cPanel com CloudLinux, DNS gerenciado e suporte técnico.
   - Link: https://alllogiconline.com.br/dominios-e-hospedagem/
3. **Sistemas e Aplicações Web sob Medida:**
   - Softwares personalizados, portais corporativos e painéis administrativos desenvolvidos sob demanda para resolver a dor operacional da empresa.
4. **Automação de Processos e Integrações:**
   - Conexão de ferramentas, CRMs, ERPs, bancos de dados, planilhas e gateways de pagamento via APIs e n8n.
5. **Inteligência Artificial Aplicada:**
   - Implementação de agentes de IA, processamento inteligente de documentos e automações generativas.
6. **Presença Digital Local e Google:**
   - SEO local e otimização do Perfil da Empresa no Google (Google Meu Negócio).
7. **Programa de Parceiros e Afiliados (AllLogic Partners):**
   - Comissões recorrentes de até 20% indicando as soluções da AllLogic Online.
   - Link: https://alllogiconline.com.br/afiliados/

### 5. Atendimento Comercial e Transbordo:
- Responda dúvidas sobre qualquer serviço com simpatia, autoridade e foco no benefício para o cliente.
- Quando o lead quiser contratar, solicitar proposta, orçamento personalizado ou falar com a diretoria/equipe:
  1. Pergunte cordialmente o nome do lead, empresa/ramo e a necessidade principal.
  2. Confirme com gentileza: "Perfeito! Já registrei todas as suas informações com muito carinho e vou direcionar para a nossa equipe entrar em contato para apresentar a melhor solução para você!"

### 6. Discrição com a Diretoria:
- Wellington e Lucas Dresler são os fundadores e diretores da AllLogic Online.
- NUNCA cite os nomes "Wellington" ou "Lucas" espontaneamente; refira-se à "nossa equipe", "nosso setor comercial" ou "nossa diretoria".
- Se e somente se o contato mencionar expressamente Wellington: confirme que direcionará os dados ao Wellington.

- Slogan oficial: "Tecnologia que trabalha para as pessoas."
- Site oficial: https://alllogiconline.com.br`;

async function resolveOrganizationId(rawOrgId?: string | null): Promise<string> {
  const fallbackId = 'a0000000-0000-0000-0000-000000000001';
  if (!rawOrgId || rawOrgId === 'org-alllogic' || rawOrgId === 'alllogic') {
    return fallbackId;
  }

  // Se já for um UUID válido
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrgId)) {
    return rawOrgId;
  }

  // Tentar encontrar por slug ou id
  try {
    const res = await query(
      `SELECT id FROM organizations WHERE slug = $1 OR id::text = $1 LIMIT 1;`,
      [rawOrgId]
    );
    if (res.rows.length > 0) {
      return res.rows[0].id;
    }
  } catch (err) {
    console.warn('[AgentConfig API] Falha ao resolver organization_id por slug:', err);
  }

  return fallbackId;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id');
    const orgId = await resolveOrganizationId(rawOrgId);

    // Buscar configuração existente no PostgreSQL
    const res = await query(
      `SELECT 
         organization_id as "organizationId",
         system_prompt,
         tone_of_voice,
         followup_delay_minutes,
         business_hours,
         human_handoff_keywords,
         voice_reply_enabled,
         updated_at
       FROM ai_configurations
       WHERE organization_id = $1::uuid
       LIMIT 1;`,
      [orgId]
    );

    let config = res.rows[0];

    // Se ainda não existir configuração no banco para esta organização, inicializa com o prompt oficial do n8n
    if (!config) {
      const insertRes = await query(
        `INSERT INTO ai_configurations (
           organization_id,
           system_prompt,
           tone_of_voice,
           followup_delay_minutes,
           updated_at
         ) VALUES ($1::uuid, $2, 'amigavel', 120, NOW())
         ON CONFLICT (organization_id) DO UPDATE SET updated_at = NOW()
         RETURNING 
           organization_id as "organizationId",
           system_prompt,
           tone_of_voice,
           followup_delay_minutes,
           business_hours,
           human_handoff_keywords,
           voice_reply_enabled,
           updated_at;`,
        [orgId, OFFICIAL_N8N_SYSTEM_PROMPT]
      );
      config = insertRes.rows[0] || {
        organizationId: orgId,
        system_prompt: OFFICIAL_N8N_SYSTEM_PROMPT,
        tone_of_voice: 'amigavel',
        followup_delay_minutes: 120,
        updated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      system_prompt: config.system_prompt,
      tone_of_voice: config.tone_of_voice,
      followup_delay_minutes: config.followup_delay_minutes,
      config,
    });
  } catch (error: any) {
    console.error('[AgentConfig API] Erro ao buscar configuração do agente:', error);
    // Em caso de falha de conexão com o banco, retorna o prompt padrão oficial para manter n8n funcional
    return NextResponse.json({
      success: true,
      fallback: true,
      system_prompt: OFFICIAL_N8N_SYSTEM_PROMPT,
      tone_of_voice: 'amigavel',
      followup_delay_minutes: 120,
      config: {
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        system_prompt: OFFICIAL_N8N_SYSTEM_PROMPT,
        tone_of_voice: 'amigavel',
        followup_delay_minutes: 120,
        updated_at: new Date().toISOString(),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId: rawOrgId, systemPrompt, toneOfVoice = 'amigavel', followupDelay = 120 } = body;

    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim() === '') {
      return NextResponse.json(
        { error: 'O prompt do sistema (system_prompt) não pode ser vazio.' },
        { status: 400 }
      );
    }

    const orgId = await resolveOrganizationId(rawOrgId);
    const numDelay = parseInt(String(followupDelay), 10) || 120;
    const cleanTone = String(toneOfVoice).trim() || 'amigavel';

    // Gravação persistente no banco PostgreSQL
    const res = await query(
      `INSERT INTO ai_configurations (
         organization_id,
         system_prompt,
         tone_of_voice,
         followup_delay_minutes,
         updated_at
       ) VALUES ($1::uuid, $2, $3, $4, NOW())
       ON CONFLICT (organization_id)
       DO UPDATE SET
         system_prompt = EXCLUDED.system_prompt,
         tone_of_voice = EXCLUDED.tone_of_voice,
         followup_delay_minutes = EXCLUDED.followup_delay_minutes,
         updated_at = NOW()
       RETURNING 
         organization_id as "organizationId",
         system_prompt,
         tone_of_voice,
         followup_delay_minutes,
         updated_at;`,
      [orgId, systemPrompt.trim(), cleanTone, numDelay]
    );

    const saved = res.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Configurações do agente salvas com sucesso no banco de dados!',
      system_prompt: saved.system_prompt,
      tone_of_voice: saved.tone_of_voice,
      followup_delay_minutes: saved.followup_delay_minutes,
      config: saved,
    });
  } catch (error: any) {
    console.error('[AgentConfig API] Erro ao salvar configuração do agente:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao salvar configurações do agente.' },
      { status: 500 }
    );
  }
}
