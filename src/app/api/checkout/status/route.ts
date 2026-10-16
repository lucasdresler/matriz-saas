import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 });
    }

    const payment = await asaasService.getPayment(paymentId);

    // No Asaas: RECEIVED ou CONFIRMED indicam liquidação confirmada
    const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED';

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      isPaid,
      value: payment.value,
      clientPaymentDate: payment.clientPaymentDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
