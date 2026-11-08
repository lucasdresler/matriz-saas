export interface HostingOrderNotificationInput {
  customerName: string;
  companyName?: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  domain: string;
  planName: string;
  cycle: string;
  amount: number;
  billingMethod: string;
  provisioning?: {
    username: string;
    cpanelUrl: string;
    nameservers: string[];
    password?: string;
  };
}

export class NotificationService {
  private evolutionUrl: string;
  private evolutionApiKey: string;
  private adminPhone: string;

  constructor() {
    this.evolutionUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://wa.alllogiconline.com.br';
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY || 'MatrizSuperSecretApiKey2026';
    this.adminPhone = process.env.OPERATIONAL_WHATSAPP || '5511966381915';
  }

  /**
   * Envia o alerta operacional de novo pedido para a equipe AllLogic e as boas-vindas ao cliente
   */
  async notifyNewHostingOrder(data: HostingOrderNotificationInput): Promise<void> {
    const cycleLabel = data.cycle === 'yearly' ? 'Anual (-20% OFF)' : 'Mensal';
    const amountFormatted = `R$ ${data.amount.toFixed(2).replace('.', ',')}`;

    const adminMessage = `🔔 *NOVO PEDIDO DE HOSPEDAGEM & DOMÍNIO CONFIRMADO*

📦 *Plano:* ${data.planName} (${cycleLabel})
💰 *Valor Pago:* ${amountFormatted} (${data.billingMethod})
🌐 *Domínio Solicitado:* ${data.domain}

👤 *Dossiê do Titular (para Registro Oficial):*
• *Empresa / Razão Social:* ${data.companyName || data.customerName}
• *Responsável:* ${data.customerName}
• *CPF / CNPJ:* ${data.cpfCnpj}
• *WhatsApp:* ${data.phone}
• *E-mail:* ${data.email}

⚙️ *Ambiente cPanel:*
• *Usuário cPanel:* ${data.provisioning?.username || 'Pendente'}
• *Painel:* ${data.provisioning?.cpanelUrl || 'https://177.104.163.165:2083'}
• *Nameservers DNS:* ns1.alllogiconline.com.br / ns2.alllogiconline.com.br

👉 *Ação Recomendada:*
Verificar a titularidade ou delegar o domínio *${data.domain}* no Registro.br sob o CPF/CNPJ *${data.cpfCnpj}*.`;

    console.log('[NotificationService] Notificação operacional gerada:', {
      domain: data.domain,
      customer: data.customerName,
      cpfCnpj: data.cpfCnpj,
      plan: data.planName,
    });

    // Tentar disparo via Evolution API para a equipe AllLogic
    try {
      await this.sendWhatsAppText(this.adminPhone, adminMessage);
    } catch (e: any) {
      console.warn('[NotificationService] Alerta WhatsApp para equipe não pôde ser entregue no momento:', e.message);
    }

    // Mensagem de boas-vindas e credenciais para o cliente
    if (data.phone && data.provisioning) {
      const clientMessage = `Olá, *${data.customerName}*! Seja muito bem-vindo à *AllLogic Online*. 🚀

Seu pedido de hospedagem para o domínio *${data.domain}* foi confirmado e seu ambiente já está ativado!

🔑 *Seus Dados de Acesso:*
• *Painel cPanel:* ${data.provisioning.cpanelUrl}
• *Usuário:* ${data.provisioning.username}
• *Senha Temporária:* ${data.provisioning.password}

🌐 *Servidores DNS para Apontamento:*
• ns1.alllogiconline.com.br
• ns2.alllogiconline.com.br

Se contratou o plano anual, nossa equipe técnica já iniciou o processo de registro assistido do seu domínio no Registro.br sob o seu CPF/CNPJ.

Qualquer dúvida, estamos 100% à sua disposição!`;

      try {
        const cleanClientPhone = data.phone.replace(/\D/g, '');
        if (cleanClientPhone.length >= 10) {
          await this.sendWhatsAppText(cleanClientPhone, clientMessage);
        }
      } catch (err: any) {
        console.warn('[NotificationService] Mensagem de boas-vindas ao cliente não pôde ser entregue via WhatsApp:', err.message);
      }
    }
  }

  /**
   * Envia as boas-vindas e os dados de acesso ao cliente que iniciou o teste de 14 dias
   */
  async notifyTrialWelcome(data: {
    customerName: string;
    phone: string;
    email: string;
    planName: string;
    trialEndDate: string;
    tempPassword?: string;
  }): Promise<void> {
    const cleanPhone = data.phone.replace(/\D/g, '');
    const dateFormatted = new Date(data.trialEndDate).toLocaleDateString('pt-BR');

    const message = `Olá, *${data.customerName}*! Seja muito bem-vindo ao período de 14 dias de teste do *${data.planName}* pela AllLogic Online! 🚀

Sua conta está liberada com todos os recursos até *${dateFormatted}*.

🔑 *Seus Dados de Acesso ao Painel:*
• *Acesso:* https://hub.alllogiconline.com.br
• *E-mail:* ${data.email}
${data.tempPassword ? `• *Senha Inicial:* ${data.tempPassword}\n` : ''}
💡 Durante esses 14 dias, você pode explorar e utilizar o sistema livremente sem nenhum compromisso e sem precisar cadastrar cartão de crédito.

Caso precise de qualquer orientação ou queira tirar dúvidas com nossa equipe técnica, basta responder a esta mensagem. Tenha uma excelente experiência!`;

    try {
      if (cleanPhone.length >= 10) {
        await this.sendWhatsAppText(cleanPhone, message);
      }
    } catch (err: any) {
      console.warn('[NotificationService] Falha ao enviar WhatsApp de trial para o cliente:', err.message);
    }
  }

  /**
   * Notifica a equipe AllLogic sobre novo lead de teste gratuito iniciado
   */
  async notifyNewTrialLead(data: {
    customerName: string;
    companyName?: string;
    phone: string;
    email: string;
    planName: string;
    trialEndDate: string;
  }): Promise<void> {
    const dateFormatted = new Date(data.trialEndDate).toLocaleDateString('pt-BR');

    const adminMessage = `🔔 *NOVO LEAD DE TESTE GRATUITO (14 DIAS)!*

📦 *Produto / Plano:* ${data.planName}
🏢 *Empresa:* ${data.companyName || data.customerName}
👤 *Responsável:* ${data.customerName}
📱 *WhatsApp:* ${data.phone}
✉️ *E-mail:* ${data.email}
⏰ *Válido até:* ${dateFormatted}

👉 Lead cadastrado no CRM e WhatsApp de boas-vindas disparado automaticamente.`;

    try {
      await this.sendWhatsAppText(this.adminPhone, adminMessage);
    } catch (e: any) {
      console.warn('[NotificationService] Falha ao enviar alerta de trial para a equipe:', e.message);
    }
  }

  /**
   * Envia mensagem de texto via Evolution API se houver instância ativa
   */
  public async sendWhatsAppText(phone: string, text: string): Promise<boolean> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // 1. Localizar primeira instância conectada
      const instancesRes = await fetch(`${this.evolutionUrl}/instance/fetchInstances`, {
        headers: { apikey: this.evolutionApiKey },
      });

      if (!instancesRes.ok) return false;

      const instances = await instancesRes.json();
      if (!Array.isArray(instances) || instances.length === 0) {
        return false;
      }

      const instanceName = instances[0].name || instances[0].instanceName;
      if (!instanceName) return false;

      // 2. Disparar mensagem
      const sendRes = await fetch(`${this.evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.evolutionApiKey,
        },
        body: JSON.stringify({
          number,
          text,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false,
          },
        }),
      });

      return sendRes.ok;
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();
