'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  QrCode,
  CreditCard,
  CheckCircle,
  Copy,
  Clock,
  ArrowRight,
  HelpCircle,
  XCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { SAAS_PLANS } from '@/types/pricing';

interface TrialExpiredPaywallProps {
  organizationName: string;
  planId: string;
  userEmail?: string;
  userPhone?: string;
  onPaymentSuccess?: () => void;
}

export function TrialExpiredPaywall({
  organizationName,
  planId,
  userEmail = '',
  userPhone = '',
  onPaymentSuccess,
}: TrialExpiredPaywallProps) {
  const [desireToContinue, setDesireToContinue] = useState<boolean | null>(true);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCodeBase64?: string;
    copyPaste?: string;
    expirationDate?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const plan = SAAS_PLANS[planId] || SAAS_PLANS['combo'] || SAAS_PLANS['pro'];
  const price = cycle === 'yearly' ? plan.priceYearlyMonthly : plan.priceMonthly;
  const annualTotal = plan.annualTotal;

  const handleGeneratePix = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationName,
          email: userEmail || 'contato@' + organizationName.toLowerCase().replace(/\s+/g, '') + '.com.br',
          phone: userPhone || '11999999999',
          cpfCnpj: cpfCnpj || '00000000000',
          planId: plan.id,
          cycle,
          billingMethod: 'PIX',
          isTrial: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar Pix');
      }

      setPixData({
        qrCodeBase64: data.qrCodeBase64,
        copyPaste: data.copyPaste,
        expirationDate: data.expirationDate,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na comunicação com o gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCreditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationName,
          email: userEmail,
          phone: userPhone,
          cpfCnpj,
          planId: plan.id,
          cycle,
          billingMethod: 'CREDIT_CARD',
          creditCard,
          isTrial: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar cartão.');
      }

      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro no processamento do cartão.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Se o cliente escolheu NÃO continuar agora
  if (desireToContinue === false) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Entendemos perfeitamente</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Seus dados, cadastros de clientes e configurações continuarão guardados e seguros em nossos servidores por até 60 dias. Se desejar reativar sua plataforma mais adiante, basta nos avisar.
          </p>

          {!feedbackSent ? (
            <div className="text-left mb-6">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Poderia nos contar o motivo de não continuar? (Opcional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: Não tive tempo de testar, achei o preço alto, faltou algum recurso..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                rows={3}
              />
              <button
                onClick={() => setFeedbackSent(true)}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Enviar Feedback
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs mb-6">
              Obrigado pelo seu feedback! Isso nos ajuda a aprimorar sempre nossas soluções.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDesireToContinue(true)}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all"
            >
              Mudei de ideia, quero continuar
            </button>
            <a
              href="https://wa.me/5511966381915?text=Ol%C3%A1!%20Meu%20per%C3%ADodo%20de%20teste%20encerrou%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm text-center transition-all"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
        {/* Topo com Aviso de Segurança */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Período de Avaliação Encerrado
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Continue acelerando com o {plan.name}
          </h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed max-w-lg mx-auto">
            Fique tranquilo: <strong>todos os seus dados, clientes, mensagens e configurações continuam 100% preservados e seguros</strong>.
          </p>
        </div>

        {/* Seletor de Ciclo (Mensal vs Anual com desconto) */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                cycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plano Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                cycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plano Anual <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">20% OFF</span>
            </button>
          </div>
        </div>

        {/* Resumo do Plano */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-white font-bold text-base">{plan.name}</div>
            <div className="text-xs text-slate-400">{plan.tagline}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">
              R$ {price.toFixed(2).replace('.', ',')}
              <span className="text-xs text-slate-400 font-normal">/mês</span>
            </div>
            {cycle === 'yearly' && (
              <div className="text-[11px] text-emerald-400 font-medium">
                Cobrança anual de R$ {annualTotal.toFixed(2).replace('.', ',')}
              </div>
            )}
          </div>
        </div>

        {/* Escolha da Forma de Pagamento */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Escolha como prefere pagar:
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMethod('PIX');
                setPixData(null);
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                method === 'PIX'
                  ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Pix Instantâneo</div>
                <div className="text-xs text-slate-400">Liberação em 3 segundos</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('CREDIT_CARD')}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                method === 'CREDIT_CARD'
                  ? 'border-blue-500/50 bg-blue-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Cartão de Crédito</div>
                <div className="text-xs text-slate-400">Recorrência automática</div>
              </div>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs mb-6 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Área do Pix */}
        {method === 'PIX' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6 text-center">
            {!pixData ? (
              <div>
                <p className="text-xs text-slate-400 mb-4">
                  Clique abaixo para gerar o código Pix Copia e Cola e o QR Code oficial do Banco Central via Asaas:
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Gerando Pix Seguro...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Gerar QR Code e Pix Copia e Cola
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {pixData.qrCodeBase64 && (
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-44 h-44 rounded-lg bg-white p-2 mb-4 border border-slate-700"
                  />
                )}
                <div className="w-full mb-3">
                  <div className="text-xs text-slate-400 mb-1 text-left font-medium">
                    Código Pix Copia e Cola:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.copyPaste || ''}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 font-mono truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex-shrink-0 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Assim que você pagar no app do seu banco, seu painel será liberado instantaneamente.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Área do Cartão de Crédito */}
        {method === 'CREDIT_CARD' && (
          <form onSubmit={handlePayCreditCard} className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome impresso no cartão</label>
              <input
                type="text"
                required
                value={creditCard.holderName}
                onChange={(e) => setCreditCard({ ...creditCard, holderName: e.target.value })}
                placeholder="Ex: JOAO S SILVA"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Número do Cartão</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={creditCard.number}
                  onChange={(e) => setCreditCard({ ...creditCard, number: e.target.value })}
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CPF ou CNPJ do Titular</label>
                <input
                  type="text"
                  required
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mês (MM)</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={creditCard.expiryMonth}
                  onChange={(e) => setCreditCard({ ...creditCard, expiryMonth: e.target.value })}
                  placeholder="12"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ano (AAAA)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={creditCard.expiryYear}
                  onChange={(e) => setCreditCard({ ...creditCard, expiryYear: e.target.value })}
                  placeholder="2028"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={creditCard.ccv}
                  onChange={(e) => setCreditCard({ ...creditCard, ccv: e.target.value })}
                  placeholder="123"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processando Assinatura...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Confirmar Assinatura Segura
                </>
              )}
            </button>
          </form>
        )}

        {/* Opção para não continuar e suporte */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setDesireToContinue(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors underline"
          >
            Não desejo continuar usando o aplicativo
          </button>

          <a
            href="https://wa.me/5511966381915?text=Ol%C3%A1!%20Gostaria%20de%20ajuda%20para%20renovar%20meu%20plano."
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Falar com suporte humano
          </a>
        </div>
      </div>
    </div>
  );
}
