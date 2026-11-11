# ESPECIFICAÇÃO TÉCNICA — Automação End-to-End de Vendas, Trials e Cobrança Pós-Teste

## 1. Objetivo

Definir a arquitetura completa de automação para os fluxos de entrada (Trial de 14 dias sem cartão), provisionamento multi-produto e régua ativa de conversão financeira para todos os produtos da AllLogic Online:
- **Família Agillex:** Agillex Hub, Agillex Agenda, Agillex Atende, Agillex Cobrança e Agillex Reputação.
- **Serviços de Infraestrutura:** Hospedagem Web (cPanel) e Domínios (.com.br / internacionais).

---

## 2. Fluxo 1: Entrada e Ativação do Teste Gratuito (14 Dias)

### 2.1. Cadastro Unificado de Teste Grátis
- Todos os CTAs de teste grátis do site oficial abrem o mesmo formulário de cadastro; o produto e a variante associados ao CTA ficam pré-selecionados, mas podem ser alterados no próprio formulário.
- **Campos obrigatórios:** Nome, WhatsApp com DDD, E-mail, Razão Social / Nome Fantasia, Produto / Plano Selecionado.
- **Ausência de cobrança:** O formulário envia o cadastro diretamente para `/api/checkout` no Hub, sem abrir o checkout comercial nem solicitar cartão, dados de cobrança ou pagamento.
- Após a ativação, a confirmação oferece acesso à tela de login do Hub; não encaminha para aquisição ou contratação de outro produto.

### 2.2. Ações Automáticas do Backend (`/api/checkout`):
1. **Persistência transacional no PostgreSQL Multi-tenant:**
   - Criação ou recuperação de uma conta pendente em `auth.users`.
   - Criação da organização, vínculo do titular como `owner` em `organization_members` e inclusão do lead.
   - Geração de uma senha provisória aleatória com entropia criptográfica. Somente o hash seguro da senha é persistido em `auth.users.password_hash`.
   - Se a tentativa de envio pelo WhatsApp falhar, a senha provisória é invalidada para que uma nova tentativa possa gerar e enviar outra senha.
   - Se o cadastro anterior criou a organização e o lead, mas não concluiu o acesso, a nova tentativa reaproveita esses registros e mantém o prazo original do trial.
2. **Boas-vindas e credenciais pelo WhatsApp (Evolution API):**
   - Envio ao número informado no cadastro do período do teste, endereço de acesso, e-mail e senha provisória.
   - Recomendar que a pessoa altere a senha após o primeiro acesso. E-mail/SMTP não é necessário para esse fluxo.
3. **Notificação Operacional Interna:**
   - Envio automático para o WhatsApp da equipe AllLogic (`OPERATIONAL_WHATSAPP`):
     > *"🔔 Novo Lead de Teste Gratuito Iniciado!"*  
     > *"Produto: [Nome do Produto / Plano]"*  
     > *"Cliente: [Nome] | Empresa: [Empresa]"*  
     > *"WhatsApp: [Telefone] | E-mail: [Email]"*

---

## 3. Fluxo 2: Régua Ativa de Cobrança e Conversão Pós-Teste

Como o cliente não insere cartão no início do teste, a conversão ocorre por **Régua Ativa no WhatsApp** (utilizando o motor do Agillex Cobrança integrado ao gateway Asaas):

### 3.1. Cronograma da Régua de Degustação:
1. **D-3 (11º dia do teste) — Engajamento & Suporte:**
   - Mensagem: *"Olá, [Nome]! Faltam apenas 3 dias para encerrar seu período gratuito do [Produto]. Como está sendo sua experiência? Tem alguma dúvida em que nosso time possa ajudar?"*
2. **D-1 (13º dia do teste) — Prévia de Continuidade:**
   - Mensagem: *"Seu teste encerra amanhã! Para continuar aproveitando todos os recursos sem nenhuma pausa e com seus dados preservados, escolha seu formato de pagamento preferido: [Link Seguro de Checkout]"*
3. **D0 (14º dia — Encerramento do Teste & Cobrança Pix):**
   - Criação automática da cobrança no gateway Asaas para a primeira mensalidade.
   - Disparo do lembrete com código **Pix Copia e Cola**:
     > *"Hoje encerra seu período de avaliação do [Produto]. Mantenha sua operação rodando sem interrupções! Pague sua mensalidade em 1 clique via Pix Copia e Cola:"*  
     > `[Código Pix Copia e Cola Asaas]`
4. **D+1 (15º dia) — Bloqueio Cortês com Preservação de Dados:**
   - Se o pagamento não for liquidado, o acesso ao painel é pausado e exibe a tela informativa de encerramento (`admin_trial_expirado`), informando que todos os cadastros e dados históricos continuam preservados e disponibilizando o botão de pagamento imediato para desbloqueio em tempo real.

---

## 4. Fluxo 3: Hospedagem e Domínios (Contratação Direta)

- **Regra de Negócio:** Hospedagem e Domínio não possuem teste gratuito de 14 dias devido a custos diretos de infraestrutura e taxas de registro do Registro.br / ICANN.
- **Automação Implementada:**
  1. Cliente seleciona o plano no checkout e escolhe forma de pagamento (Pix instantâneo ou Cartão).
  2. Confirmação instantânea do Asaas via Webhook.
  3. Chamada automatizada para o **WHM API** (`whmService.createAccount`), criando a conta cPanel no servidor EVEO em segundos.
  4. Disparo automático dos dados de DNS, Nameservers e login cPanel no WhatsApp e E-mail do cliente.

---

## 5. Próximos Passos de Implementação

1. Aplicar `supabase/migrations/20261111_trial_auth_fields.sql` no PostgreSQL de produção antes de publicar o novo fluxo.
2. Implementar a rotina agendada (Cron job / n8n workflow diário) para monitoramento de `trial_ends_at` e disparo dos avisos de D-3, D-1, D0 e D+1.
