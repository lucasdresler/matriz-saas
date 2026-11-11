# ESPECIFICAÇÃO TÉCNICA — Automação End-to-End de Vendas, Trials e Cobrança Pós-Teste

## 1. Objetivo

Definir o fluxo de entrada e encerramento do Trial de 14 dias sem cartão para os produtos da Família Agillex:
- **Família Agillex:** Agillex Hub, Agillex Agenda, Agillex Atende, Agillex Cobrança e Agillex Reputação.

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

## 3. Fluxo 2: Encerramento do período de teste

- O prazo é calculado a partir da criação da organização do cliente e dura 14 dias corridos.
- O Hub verifica a validade ao acessar rotas protegidas. Após os 14 dias, o acesso operacional é pausado e o cliente recebe uma tela com orientação para falar com a equipe Agillex.
- Nenhum dado da organização é apagado e nenhuma cobrança ou fatura é criada automaticamente.
- A reativação deve ser feita após a contratação, com o fluxo de assinatura e confirmação de pagamento correspondente.

---

## 4. Fluxo 3: Hospedagem e Domínios (Contratação Direta)

- **Regra de Negócio:** Hospedagem e Domínio não possuem teste gratuito de 14 dias devido a custos diretos de infraestrutura e taxas de registro do Registro.br / ICANN.
- **Automação Implementada:**
  1. Cliente seleciona o plano no checkout e escolhe forma de pagamento (Pix instantâneo ou Cartão).
  2. Confirmação instantânea do Asaas via Webhook.
  3. Chamada automatizada para o **WHM API** (`whmService.createAccount`), criando a conta cPanel no servidor EVEO em segundos.
  4. Disparo automático dos dados de DNS, Nameservers e login cPanel no WhatsApp e E-mail do cliente.

---

## 5. Estado da implementação

- O encerramento do acesso é verificado pelo Hub sem depender de cron ou workflow externo.
- Não existe rotina agendada ativa de trials na VPS do Hub nem na hospedagem cPanel da AllLogic.
- A régua de notificações D-3/D-1 e a reativação automática após pagamento não estão implementadas.
