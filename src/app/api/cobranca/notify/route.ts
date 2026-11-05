import { NextResponse } from 'next/server';
import { agillexCobrancaService } from '@/lib/cobranca';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, value, dueDate, description, stage, pixCopiaECola } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: 'Telefone do WhatsApp é obrigatório' }, { status: 400 });
    }

    const result = await agillexCobrancaService.processNotification({
      customerName: customerName || 'Cliente',
      customerPhone,
      paymentId: `sim_${Date.now()}`,
      value: typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.')) || 0,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      description: description || 'Assinatura AllLogic',
      stage: stage || 'preventivo',
      pixCopiaECola: pixCopiaECola || `00020101021226840014br.gov.bcb.pix2562alllogic-pix-${Date.now()}5204000053039865802BR5920AllLogic Online6009Sao Paulo62070503***6304ABCD`,
    });

    return NextResponse.json({
      success: true,
      delivered: result.success,
      message: result.message,
      feedback: result.success ? 'Mensagem disparada com sucesso via WhatsApp!' : 'Notificação simulada e registrada com sucesso no sistema.',
    });
  } catch (error: any) {
    console.error('[API Cobranca Notify] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
