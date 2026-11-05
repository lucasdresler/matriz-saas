/**
 * Agillex Reputação — Acelerador de Avaliações 5 Estrelas no Google Meu Negócio
 * Filtro Protetor de Reputação (NPS Inteligente) + Gerador de Respostas com IA para SEO Local.
 */

import { notificationService } from './notifications';
import { ReputacaoFeedback, ReputacaoConfig } from '@/types';

export const defaultReputacaoConfig: ReputacaoConfig = {
  businessName: 'AllLogic Online',
  city: 'São Paulo e Região',
  googleReviewUrl: 'https://g.page/r/alllogiconline/review',
  delayHours: 2,
  autoAiReply: true,
};

export class AgillexReputacaoService {
  private config: ReputacaoConfig;

  constructor(config?: Partial<ReputacaoConfig>) {
    this.config = { ...defaultReputacaoConfig, ...config };
  }

  public updateConfig(newConfig: Partial<ReputacaoConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ReputacaoConfig {
    return this.config;
  }

  /**
   * Gera a mensagem inicial de pesquisa pós-atendimento
   */
  public generateSurveyMessage(data: {
    customerName: string;
    serviceName?: string;
  }): string {
    const serviceInfo = data.serviceName ? ` referente a *${data.serviceName}*` : '';
    return `Olá, *${data.customerName}*! Tudo bem? Aqui é da equipe da *${this.config.businessName}*. 👋

Agradecemos imensamente pela confiança em nosso trabalho${serviceInfo}!

De 1 a 5 estrelas ⭐, como você avalia sua experiência conosco hoje?
⭐⭐⭐⭐⭐

_(Basta responder apenas o número de 1 a 5 aqui neste WhatsApp)_`;
  }

  /**
   * Processa a nota recebida e aplica o Filtro Protetor de Reputação
   */
  public processRating(data: {
    customerName: string;
    rating: number;
    customGoogleUrl?: string;
  }): {
    category: 'promotor' | 'neutro' | 'detrator';
    replyMessage: string;
    isGooglePromoter: boolean;
  } {
    const googleUrl = data.customGoogleUrl || this.config.googleReviewUrl;
    const isPromoter = data.rating >= 4;

    if (isPromoter) {
      // PROMOTOR (4 ou 5 estrelas) -> Convida para o Google Maps
      const stars = '⭐'.repeat(data.rating);
      return {
        category: 'promotor',
        isGooglePromoter: true,
        replyMessage: `Uau, que alegria! Ficamos honrados com a sua avaliação de *${data.rating} estrelas* (${stars}), *${data.customerName}*! 🌟🥰

Você poderia nos fazer um grande favor? Dedique apenas 30 segundos para deixar essas ${data.rating} estrelas no nosso *Google Meu Negócio*! Isso ajuda pessoas como você a encontrarem nossos serviços:

👉 *Toque aqui para avaliar no Google:*
${googleUrl}

Muito obrigado pela parceria e conte sempre conosco! 🚀`,
      };
    } else {
      // DETRATOR / ATENÇÃO (1, 2 ou 3 estrelas) -> Retém internamente e protege a marca
      return {
        category: data.rating === 3 ? 'neutro' : 'detrator',
        isGooglePromoter: false,
        replyMessage: `Olá, *${data.customerName}*. Sentimos muito por não termos superado suas expectativas hoje. 😔

Para nós da *${this.config.businessName}*, a sua satisfação é prioridade absoluta.

Poderia nos contar brevemente o que aconteceu ou o que podemos melhorar? Nossa gerência já foi notificada e vai acompanhar seu caso pessoalmente para solucionar qualquer detalhe.

Estamos 100% à sua disposição aqui pelo WhatsApp.`,
      };
    }
  }

  /**
   * Dispara a pesquisa de satisfação para o WhatsApp do cliente
   */
  public async sendSurvey(params: {
    customerName: string;
    customerPhone: string;
    serviceName?: string;
  }): Promise<{ success: boolean; message: string }> {
    const text = this.generateSurveyMessage({
      customerName: params.customerName,
      serviceName: params.serviceName,
    });

    const sent = await notificationService.sendWhatsAppText(params.customerPhone, text);

    return {
      success: sent,
      message: text,
    };
  }

  /**
   * Gera uma resposta humanizada e otimizada para SEO Local para avaliações do Google Meu Negócio
   */
  public generateAiReviewReply(review: {
    authorName: string;
    rating: number;
    comment?: string;
    serviceName?: string;
  }): string {
    const business = this.config.businessName;
    const city = this.config.city;
    const service = review.serviceName || 'soluções digitais e tecnologia';

    if (review.rating >= 4) {
      return `Olá, ${review.authorName}! Muito obrigado pela avaliação de ${review.rating} estrelas e pela confiança na ${business}. É uma grande honra oferecer excelência em ${service} para clientes aqui de ${city} e de todo o Brasil. Estamos sempre à disposição quando precisar! Forte abraço de toda a equipe.`;
    } else {
      return `Olá, ${review.authorName}. Agradecemos por compartilhar sua experiência. Na ${business}, buscamos sempre o mais alto padrão em ${service} em ${city}. Gostaríamos de entender melhor o que ocorreu para aprimorarmos nosso atendimento. Por favor, entre em contato direto pelo nosso WhatsApp oficial para que nossa gerência possa lhe dar total suporte.`;
    }
  }
}

export const agillexReputacaoService = new AgillexReputacaoService();
