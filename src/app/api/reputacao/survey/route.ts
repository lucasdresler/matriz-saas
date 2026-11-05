import { NextResponse } from 'next/server';
import { agillexReputacaoService } from '@/lib/reputacao';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, serviceName } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: 'WhatsApp do cliente é obrigatório' }, { status: 400 });
    }

    const result = await agillexReputacaoService.sendSurvey({
      customerName: customerName || 'Cliente',
      customerPhone,
      serviceName: serviceName || 'Atendimento',
    });

    return NextResponse.json({
      success: true,
      delivered: result.success,
      message: result.message,
      feedback: result.success
        ? 'Pesquisa de satisfação disparada no WhatsApp com sucesso!'
        : 'Pesquisa registrada e simulada com sucesso no sistema.',
    });
  } catch (error: any) {
    console.error('[API Reputacao Survey] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
