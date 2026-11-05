/**
 * Agillex Cobrança — Motor de Régua Inteligente via WhatsApp & Asaas Pix
 * Gerencia a comunicação ativa, preventiva e de recuperação com Pix Copia e Cola automático.
 */

import { asaasService } from './asaas';
import { notificationService } from './notifications';
import { CobrancaStage, CobrancaRule } from '@/types';
import { initialCobrancaRules } from './mockData';

export interface CobrancaNotificationPayload {
  customerName: string;
  customerPhone: string;
  paymentId: string;
  value: number;
  dueDate?: string;
  description: string;
  stage: CobrancaStage;
  pixCopiaECola?: string;
}

export class AgillexCobrancaService {
  private rules: CobrancaRule[];

  constructor() {
    this.rules = initialCobrancaRules;
  }

  /**
   * Obtém a regra ativa para uma etapa específica
   */
  public getRule(stage: CobrancaStage): CobrancaRule | undefined {
    return this.rules.find((r) => r.stage === stage && r.active);
  }

  /**
   * Formata a mensagem com as variáveis da fatura
   */
  public formatMessage(template: string, data: {
    nome: string;
    valor: number;
    vencimento?: string;
    descricao: string;
    pixCopiaECola?: string;
  }): string {
    const valorFormatado = data.valor.toFixed(2).replace('.', ',');
    const vencimentoFormatado = data.vencimento
      ? data.vencimento.split('-').reverse().join('/')
      : 'Hoje';

    return template
      .replace(/{nome}/g, data.nome || 'Cliente')
      .replace(/{valor}/g, valorFormatado)
      .replace(/{vencimento}/g, vencimentoFormatado)
      .replace(/{descricao}/g, data.descricao || 'Serviço AllLogic')
      .replace(/{pixCopiaECola}/g, data.pixCopiaECola || 'PIX_PENDENTE');
  }

  /**
   * Dispara notificação da régua pelo WhatsApp para o cliente
   */
  public async processNotification(payload: CobrancaNotificationPayload): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const rule = this.getRule(payload.stage);
      if (!rule) {
        console.log(`[AgillexCobranca] Etapa '${payload.stage}' está desativada ou não configurada.`);
        return { success: false, error: 'Etapa desativada na régua' };
      }

      // Se for etapa que precisa de Pix e não temos o código, busca na API do Asaas
      let pixPayload = payload.pixCopiaECola;
      if (payload.stage !== 'confirmado' && !pixPayload && payload.paymentId) {
        try {
          const qrData = await asaasService.getPixQrCode(payload.paymentId);
          pixPayload = qrData.payload;
        } catch (qrErr: any) {
          console.warn(`[AgillexCobranca] Não foi possível obter PIX QR Code para ${payload.paymentId}:`, qrErr.message);
        }
      }

      const formattedText = this.formatMessage(rule.template, {
        nome: payload.customerName,
        valor: payload.value,
        vencimento: payload.dueDate,
        descricao: payload.description,
        pixCopiaECola: pixPayload || 'Consulte seu link de fatura.',
      });

      console.log(`[AgillexCobranca] Disparando régua (${payload.stage}) para ${payload.customerPhone}...`);

      const sent = await notificationService.sendWhatsAppText(payload.customerPhone, formattedText);

      return {
        success: sent,
        message: formattedText,
      };
    } catch (err: any) {
      console.error('[AgillexCobranca] Erro ao processar notificação de cobrança:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const agillexCobrancaService = new AgillexCobrancaService();
