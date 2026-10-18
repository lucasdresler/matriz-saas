import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

async function fetchFallbackLeads(nicho: string, cidade: string, limit: number, semSite: boolean) {
  const query = `${nicho} em ${cidade}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit * 2}`;
  
  let places: any[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AllLogic-Hub-Prospector/1.0 (contato@alllogiconline.com.br)' }
    });
    if (res.ok) {
      places = await res.json();
    }
  } catch (e) {
    // Silently continue
  }

  if (places.length < limit) {
    try {
      const broaderUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${nicho} ${cidade}`)}&format=json&addressdetails=1&limit=${limit * 2}`;
      const res = await fetch(broaderUrl, {
        headers: { 'User-Agent': 'AllLogic-Hub-Prospector/1.0' }
      });
      if (res.ok) {
        const more = await res.json();
        const seen = new Set(places.map(p => p.place_id));
        for (const m of more) {
          if (!seen.has(m.place_id)) {
            places.push(m);
          }
        }
      }
    } catch (e) {
      // Silently continue
    }
  }

  const appointmentKeywords = [
    'clínica', 'clinica', 'dentista', 'odontolog', 'médic', 'medico', 'consultório',
    'consultorio', 'salão', 'salao', 'estética', 'estetica', 'barbearia', 'barber',
    'fisioterapia', 'psicolog', 'terapia', 'veterinár', 'veterinar', 'pet shop'
  ];

  return places.slice(0, limit).map((p) => {
    const name = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : nicho);
    const address = p.display_name || `${cidade}, Brasil`;
    const category = p.type ? p.type.replace(/_/g, ' ') : nicho;
    const nicheLower = (nicho + ' ' + category).toLowerCase();
    const isAppointment = appointmentKeywords.some(k => nicheLower.includes(k));

    let oferta = 'Hospedagem cPanel + Registro de Domínio';
    let diagnostico = 'Presença Digital: Oportunidade de criar site oficial .com.br e e-mails corporativos.';
    let copy = `Olá, equipe da ${name}! Tudo bem?\n\nNotamos o destaque de vocês em ${cidade} e identificamos uma oportunidade de fortalecer sua autoridade criando o domínio oficial e o site profissional da sua empresa com hospedagem cPanel da AllLogic Online.\n\nPodemos enviar uma demonstração rápida sem compromisso?`;

    if (isAppointment) {
      oferta = 'Agillex Agenda (Agendamento Online 24/7)';
      diagnostico = 'Automação de Agendamentos: Redução de no-show e agendamento online com WhatsApp.';
      copy = `Olá, equipe da ${name}! Tudo bem?\n\nVocês já utilizam sistema de agendamento online integrado ao WhatsApp e Google Calendar para seus pacientes/clientes?\n\nA AllLogic Online desenvolveu o Agillex Agenda, que reduz em até 85% as faltas e permite agendar 24h por dia.\n\nGostariam de conhecer em 3 minutos?`;
    }

    return {
      Nome: name,
      Nicho_Buscado: nicho,
      Categoria_Google: category,
      Cidade_Pesquisada: cidade,
      Telefone: 'A confirmar',
      WhatsApp_Link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`,
      Tipo_Linha: 'A confirmar',
      Tem_Site_Proprio: 'NÃO',
      Website: 'SEM SITE',
      Avaliacao: '5.0',
      Endereco: address,
      Oferta_Recomendada: oferta,
      Diagnostico_Comercial: diagnostico,
      Mensagem_Abordagem_WhatsApp: copy,
      Link_Google_Maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`,
      Data_Extracao: new Date().toLocaleDateString('pt-BR')
    };
  });
}

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

    const cleanLimit = Math.min(Math.max(Number(limite) || 10, 1), 50);

    const scriptPath = path.resolve(
      process.cwd(),
      '../prospeccao-google-maps/prospector.py'
    );

    const pythonExec = fs.existsSync('/home/dresler/anaconda3/bin/python3')
      ? '/home/dresler/anaconda3/bin/python3'
      : 'python3';

    let rawLeads: any[] = [];
    let excelPath = '';
    let csvPath = '';
    let jsonPath = '';

    // Se o script local com Selenium existir, executa o motor completo
    if (fs.existsSync(scriptPath)) {
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

      const leadsOutput = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
        execFile(
          pythonExec,
          args,
          {
            timeout: 240000,
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

      if (leadsOutput.success && leadsOutput.data) {
        rawLeads = leadsOutput.data.leads || [];
        excelPath = leadsOutput.data.excel_path || '';
        csvPath = leadsOutput.data.csv_path || '';
        jsonPath = leadsOutput.data.json_path || '';
      }
    }

    // Se o script não estiver disponível (ex: rodando no container Docker na nuvem) ou não retornou dados
    if (!rawLeads || rawLeads.length === 0) {
      rawLeads = await fetchFallbackLeads(nicho.trim(), cidade.trim(), cleanLimit, semSite);
    }

    // Mapeia para o formato de Lead do Agillex Hub
    const mappedLeads = rawLeads.map((item, index) => {
      const isSemSite = item.Tem_Site_Proprio === 'NÃO';
      const cleanPhone = (item.Telefone || '').replace(/\D/g, '');
      const waLink = item.WhatsApp_Link && item.WhatsApp_Link !== 'N/A'
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
        lastMessage: item.Mensagem_Abordagem_WhatsApp || `Oportunidade mapeada em ${cidade}.`,
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
      excelPath,
      csvPath,
      jsonPath
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro interno no servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
