import { NextResponse } from 'next/server';
import { agillexReputacaoService } from '@/lib/reputacao';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authorName, rating, comment, serviceName } = body;

    if (!authorName) {
      return NextResponse.json({ error: 'Nome do autor é obrigatório' }, { status: 400 });
    }

    const aiReply = agillexReputacaoService.generateAiReviewReply({
      authorName,
      rating: typeof rating === 'number' ? rating : 5,
      comment,
      serviceName,
    });

    return NextResponse.json({
      success: true,
      reply: aiReply,
    });
  } catch (error: any) {
    console.error('[API Reputacao Reply] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
