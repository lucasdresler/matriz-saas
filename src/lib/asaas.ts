/**
 * Módulo de Integração com Asaas (v3 API)
 * Suporte a Sandbox e Produção
 */

export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  companyName?: string;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode?: string;
  addressNumber?: string;
  phone: string;
}

export interface AsaasSubscriptionInput {
  customer: string; // ID do cliente no Asaas
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
}

export interface AsaasPaymentInput {
  customer: string;
  billingType: 'PIX' | 'BOLETO';
  value: number;
  dueDate: string;
  description: string;
}

import fs from 'fs';
import path from 'path';

function getEnvVariable(name: string): string {
  try {
    const candidatePaths = [
      '/app/.env.production',
      path.resolve(process.cwd(), '.env.production'),
      path.resolve(process.cwd(), '.env'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith(`${name}=`)) {
            const val = trimmed.substring(`${name}=`.length).trim();
            const clean = val.replace(/^['"]|['"]$/g, '');
            if (clean) return clean;
          }
        }
      }
    }
  } catch {
    // Silencioso em caso de permissao
  }

  if (process.env[name] && process.env[name] !== '') {
    return process.env[name] as string;
  }

  return '';
}

export class AsaasService {
  private apiKey: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = getEnvVariable('ASAAS_API_KEY');
    const env = getEnvVariable('ASAAS_ENVIRONMENT') || 'sandbox';
    this.baseUrl =
      env === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';
    this.isConfigured = Boolean(this.apiKey && this.apiKey !== 'sua_chave_asaas_aqui');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured) {
      console.warn(`[AsaasService] Chave de API não configurada. Executando em modo de simulação para ${endpoint}`);
      return this.mockResponse<T>(endpoint, options);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.errors?.[0]?.description || response.statusText;
      throw new Error(`Erro na API do Asaas: ${message} (Status ${response.status})`);
    }

    return response.json();
  }

  /**
   * Cria ou localiza um cliente existente pelo CPF/CNPJ ou e-mail
   */
  async createOrUpdateCustomer(input: AsaasCustomerInput): Promise<{ id: string }> {
    const cleanCpfCnpj = input.cpfCnpj.replace(/\D/g, '');

    if (this.isConfigured) {
      // 1. Tentar buscar por CPF/CNPJ
      const searchRes: any = await this.request(`/customers?cpfCnpj=${cleanCpfCnpj}`);
      if (searchRes.data && searchRes.data.length > 0) {
        return { id: searchRes.data[0].id };
      }

      // 2. Se não encontrar, tentar por e-mail
      const emailRes: any = await this.request(`/customers?email=${encodeURIComponent(input.email)}`);
      if (emailRes.data && emailRes.data.length > 0) {
        return { id: emailRes.data[0].id };
      }
    }

    // 3. Criar novo cliente
    const createRes: any = await this.request('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        cpfCnpj: cleanCpfCnpj,
        mobilePhone: input.phone || input.mobilePhone,
        company: input.companyName,
        notificationDisabled: false,
      }),
    });

    return { id: createRes.id };
  }

  /**
   * Cria uma assinatura recorrente (Cartão de Crédito ou PIX Recorrente)
   */
  async createSubscription(input: AsaasSubscriptionInput): Promise<any> {
    const payload: any = {
      customer: input.customer,
      billingType: input.billingType,
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: input.cycle,
      description: input.description,
    };

    if (input.billingType === 'CREDIT_CARD' && input.creditCard) {
      payload.creditCard = {
        holderName: input.creditCard.holderName,
        number: input.creditCard.number.replace(/\D/g, ''),
        expiryMonth: input.creditCard.expiryMonth,
        expiryYear: input.creditCard.expiryYear,
        ccv: input.creditCard.ccv,
      };
      if (input.creditCardHolderInfo) {
        payload.creditCardHolderInfo = {
          name: input.creditCardHolderInfo.name,
          email: input.creditCardHolderInfo.email,
          cpfCnpj: input.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
          phone: input.creditCardHolderInfo.phone.replace(/\D/g, ''),
        };
      }
    }

    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Cria uma cobrança avulsa (usado para PIX dinâmico ou Boleto inicial)
   */
  async createPayment(input: AsaasPaymentInput): Promise<any> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: input.customer,
        billingType: input.billingType,
        value: input.value,
        dueDate: input.dueDate,
        description: input.description,
      }),
    });
  }

  /**
   * Obtém QR Code e código Copia e Cola do PIX para uma cobrança
   */
  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    return this.request(`/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Consulta o status de um pagamento
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.request(`/payments/${paymentId}`);
  }

  /**
   * Simulação local robusta para testes e ambiente de homologação
   */
  private mockResponse<T>(endpoint: string, options: RequestInit): T {
    const timestamp = Date.now();
    const id = `mock_${timestamp}`;

    if (endpoint.startsWith('/customers')) {
      return { id: `cus_${timestamp}`, name: 'Cliente Simulado', email: 'cliente@exemplo.com' } as unknown as T;
    }

    if (endpoint.startsWith('/subscriptions')) {
      return {
        id: `sub_${timestamp}`,
        status: 'ACTIVE',
        value: 99.9,
        cycle: 'MONTHLY',
        nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      } as unknown as T;
    }

    if (endpoint.includes('/pixQrCode')) {
      return {
        encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        payload: `00020101021226840014br.gov.bcb.pix2562alllogic-pix-mock-${timestamp}5204000053039865802BR5920AllLogic Online6009Sao Paulo62070503***6304ABCD`,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
      } as unknown as T;
    }

    if (endpoint.startsWith('/payments')) {
      return {
        id: `pay_${timestamp}`,
        status: 'PENDING',
        value: 99.9,
        netValue: 98.91,
        billingType: 'PIX',
        bankSlipUrl: `https://sandbox.asaas.com/b/pdf/${timestamp}`,
        invoiceUrl: `https://sandbox.asaas.com/i/${timestamp}`,
      } as unknown as T;
    }

    return { id, status: 'SUCCESS' } as unknown as T;
  }
}

export const asaasService = new AsaasService();
