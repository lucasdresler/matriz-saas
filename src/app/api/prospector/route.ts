import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nicho, cidade, limite = 15, semSite = false, orgId = 'org-alllogic' } = body;

    if (!nicho || !cidade) {
      return NextResponse.json(
        { error: 'Nicho e Cidade são campos obrigatórios para prospecção.' },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve(
      process.cwd(),
      '../prospeccao-google-maps/prospector.py'
    );

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: `Script do prospector não encontrado em: ${scriptPath}` },
        { status: 500 }
      );
    }

    // Identifica o interpretador python com selenium disponível no sistema
    const pythonExec = fs.existsSync('/home/dresler/anaconda3/bin/python3')
      ? '/home/dresler/anaconda3/bin/python3'
      : 'python3';

    const cleanLimit = Math.min(Math.max(Number(limite) || 10, 1), 50);

    const args = [
      scriptPath,
      '--nicho', nicho.trim(),
      '--cidade', cidade.trim(),
      '--limite', String(cleanLimit),
      '--json'
    ];

    if (semSite) {
      args.push('--sem-site');
    }

    // Executa o prospector de forma assíncrona
    const leadsOutput = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
      execFile(
        pythonExec,
        args,
        {
          timeout: 240000, // 4 minutos de timeout para scraping headless
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, PYTHONUNBUFFERED: '1' }
        },
        (error, stdout, stderr) => {
          if (error && !stdout) {
            return resolve({
              success: false,
              error: `Erro ao executar prospector: ${error.message} (${stderr || ''})`
            });
          }

          const match = stdout.match(/__LEADS_JSON_START__([\s\S]*?)__LEADS_JSON_END__/);
          if (!match) {
            return resolve({
              success: false,
              error: 'Não foi possível extrair a saída estruturada do prospector. ' + (stderr || '')
            });
          }

          try {
            const parsed = JSON.parse(match[1]);
            resolve({ success: true, data: parsed });
          } catch (e: any) {
            resolve({
              success: false,
              error: `Falha ao interpretar resposta JSON: ${e.message}`
            });
          }
        }
      );
    });

    if (!leadsOutput.success || !leadsOutput.data) {
      return NextResponse.json(
        { error: leadsOutput.error || 'Falha na prospecção de leads.' },
        { status: 500 }
      );
    }

    const rawData = leadsOutput.data;
    const rawLeads: any[] = rawData.leads || [];

    // Mapeia para o formato de Lead do Agillex Hub
    const mappedLeads = rawLeads.map((item, index) => {
      const isSemSite = item.Tem_Site_Proprio === 'NÃO';
      const cleanPhone = (item.Telefone || '').replace(/\D/g, '');
      const waLink = item.WhatsApp_Link !== 'N/A'
        ? item.WhatsApp_Link
        : (cleanPhone ? `https://wa.me/55${cleanPhone}` : '');

      return {
        id: `lead-maps-${Date.now()}-${index}`,
        orgId,
        name: item.Nome || 'Empresa Local',
        phone: item.Telefone || 'N/A',
        whatsappLink: waLink,
        lineType: item.Tipo_Linha || 'Desconhecido',
        email: '',
        status: 'novo' as const,
        tags: [
          'Google Maps',
          cidade.trim(),
          isSemSite ? 'Sem Site' : 'Com Site',
          item.Categoria_Google || nicho.trim()
        ].filter(Boolean),
        serviceInterest: item.Oferta_Recomendada || 'Hospedagem cPanel + Domínio',
        diagnostic: item.Diagnostico_Comercial || '',
        lastMessage: item.Mensagem_Abordagem_WhatsApp || `Oportunidade mapeada via Google Maps em ${cidade}.`,
        lastMessageTime: 'Agora',
        aiPaused: false,
        unreadCount: 0,
        estimatedValue: isSemSite ? 97 : 297,
        website: item.Website || '',
        address: item.Endereco || '',
        rating: item.Avaliacao || '',
        mapsUrl: item.Link_Google_Maps || '',
        createdAt: 'Hoje',
      };
    });

    return NextResponse.json({
      success: true,
      total: mappedLeads.length,
      niche: nicho,
      city: cidade,
      leads: mappedLeads,
      excelPath: rawData.excel_path,
      csvPath: rawData.csv_path,
      jsonPath: rawData.json_path
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro interno no servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
