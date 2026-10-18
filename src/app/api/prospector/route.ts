import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

interface RawProspectorLead {
  Nome: string;
  Nicho_Buscado: string;
  Categoria_Google: string;
  Cidade_Pesquisada: string;
  Telefone: string;
  WhatsApp_Link: string;
  Tipo_Linha: string;
  Tem_Site_Proprio: 'SIM' | 'NÃO';
  Website: string;
  Avaliacao: string;
  Endereco: string;
  Oferta_Recomendada: string;
  Diagnostico_Comercial: string;
  Mensagem_Abordagem_WhatsApp: string;
  Link_Google_Maps: string;
  Data_Extracao: string;
}

const APPOINTMENT_KEYWORDS = [
  'clínica', 'clinica', 'dentista', 'odontolog', 'médic', 'medico', 'consultório',
  'consultorio', 'salão', 'salao', 'estética', 'estetica', 'barbearia', 'barber',
  'fisioterapia', 'psicolog', 'terapia', 'veterinár', 'veterinar', 'pet shop',
  'advocacia', 'advogado', 'estúdio', 'studio', 'beleza', 'podologia'
];

/**
 * Motor Nativo Google Maps (HTTP leve, sem dependência de Chrome/Selenium)
 * Extrai empresas reais com telefone, categoria, site, endereço e avaliações.
 */
async function fetchGoogleMapsLeads(
  nicho: string,
  cidade: string,
  limit: number,
  semSite: boolean
): Promise<RawProspectorLead[]> {
  const query = `${nicho} ${cidade}`;
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  };

  const res1 = await fetch(searchUrl, { headers });
  if (!res1.ok) {
    throw new Error(`Google Maps retornou status ${res1.status}`);
  }

  const html = await res1.text();
  const linkMatch = html.match(/<link\s+href="(\/search\?tbm=map[^"]+)"/);
  if (!linkMatch) {
    throw new Error('Endpoint de dados do Google Maps não localizado.');
  }

  const endpoint = 'https://www.google.com' + linkMatch[1].replace(/&amp;/g, '&');
  const res2 = await fetch(endpoint, {
    headers: {
      ...headers,
      Referer: searchUrl
    }
  });

  if (!res2.ok) {
    throw new Error(`Endpoint de busca do Maps retornou status ${res2.status}`);
  }

  let text = await res2.text();
  if (text.startsWith(")]}'\n")) {
    text = text.slice(5);
  } else if (text.startsWith(")]}'")) {
    text = text.slice(4);
  }

  const data = JSON.parse(text);

  let rawPlacesList: any[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (Array.isArray(item)) {
        const valid = item.filter(
          (entry) => Array.isArray(entry) && Array.isArray(entry[1]) && entry[1][11]
        );
        if (valid.length > 0) {
          rawPlacesList = valid;
          break;
        }
      }
    }
  }

  const dateStr = new Date().toLocaleDateString('pt-BR');
  const allParsed: RawProspectorLead[] = [];

  for (const entry of rawPlacesList) {
    if (!Array.isArray(entry) || !Array.isArray(entry[1])) continue;
    const p = entry[1];
    const name = String(p[11] || '').trim();
    if (!name) continue;

    const category = (p[13]?.[0] || nicho).trim();
    const address = String(p[39] || (p[14] ? `${p[14]}, ${cidade}` : `${cidade}, Brasil`)).trim();
    const rawWebsite = String(p[7]?.[0] || '').trim();
    
    // Identifica se tem site próprio ou se é rede social / diretório
    const isSocialOrDirectory =
      !rawWebsite ||
      rawWebsite.includes('google.com') ||
      rawWebsite.includes('instagram.com') ||
      rawWebsite.includes('facebook.com') ||
      rawWebsite.includes('wa.me') ||
      rawWebsite.includes('linktr.ee');

    const hasOwnSite = Boolean(rawWebsite && !isSocialOrDirectory);
    const temSiteProprio: 'SIM' | 'NÃO' = hasOwnSite ? 'SIM' : 'NÃO';
    const cleanWebsite = rawWebsite || 'SEM SITE';

    const rawPhone = String(p[178]?.[0]?.[0] || '').trim();
    const cleanDigits = rawPhone.replace(/\D/g, '');
    let cleanPhone = cleanDigits;
    if (cleanPhone.startsWith('0') && (cleanPhone.length === 11 || cleanPhone.length === 12)) {
      cleanPhone = cleanPhone.slice(1);
    }

    const isMobile = cleanPhone.length === 11 && cleanPhone[2] === '9';
    const isLandline = cleanPhone.length === 10;
    const lineType = isMobile ? 'Móvel (WhatsApp Provável)' : isLandline ? 'Fixo' : 'A confirmar';

    const waLink = cleanPhone.length >= 10
      ? `https://wa.me/55${cleanPhone}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`;

    const rating = p[4]?.[7] != null ? String(p[4][7]) : '5.0';
    const placeId = p[78] || '';
    const mapsUrl = placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`;

    // Inteligência Comercial AllLogic Online
    const nicheLower = `${nicho} ${category}`.toLowerCase();
    const isAppointment = APPOINTMENT_KEYWORDS.some((k) => nicheLower.includes(k));

    let oferta = 'Hospedagem cPanel + Registro de Domínio';
    let diagnostico = 'Presença Digital: Oportunidade de criar domínio oficial .com.br, site de alta velocidade e e-mails profissionais.';
    let copy = `Olá, equipe da ${name}! Tudo bem?\n\nNotamos o destaque de vocês em ${cidade} e identificamos uma oportunidade de fortalecer sua autoridade criando o domínio oficial e o site profissional da sua empresa com hospedagem cPanel da AllLogic Online.\n\nPodemos enviar uma demonstração rápida sem compromisso?`;

    if (hasOwnSite) {
      if (isAppointment) {
        oferta = 'Agillex Agenda (Agendamento Online 24/7)';
        diagnostico = 'Automação de Agendamentos: Redução de no-show e agendamento online com WhatsApp e Google Calendar.';
        copy = `Olá, equipe da ${name}! Tudo bem?\n\nVocês já utilizam sistema de agendamento online integrado ao WhatsApp e Google Calendar para seus pacientes/clientes?\n\nA AllLogic Online desenvolveu o Agillex Agenda, que reduz em até 85% as faltas e permite que seus clientes agendem consultas e serviços 24 horas por dia.\n\nGostariam de ver uma demonstração em 3 minutos?`;
      } else {
        oferta = 'Agillex Atendimento (IA no WhatsApp)';
        diagnostico = 'Atendimento Inteligente 24/7: IA humanizada para qualificar leads e responder clientes instantaneamente.';
        copy = `Olá, equipe da ${name}! Tudo bem?\n\nAcompanhamos o trabalho de vocês em ${cidade}. Vocês já contam com atendente virtual com Inteligência Artificial no WhatsApp para responder dúvidas, orçamentos e qualificar novos clientes em tempo real?\n\nO Agillex Atendimento da AllLogic Online atende 24h por dia com linguagem humanizada.\n\nPosso apresentar como funciona em 2 minutos?`;
      }
    }

    allParsed.push({
      Nome: name,
      Nicho_Buscado: nicho,
      Categoria_Google: category,
      Cidade_Pesquisada: cidade,
      Telefone: rawPhone || 'A confirmar',
      WhatsApp_Link: waLink,
      Tipo_Linha: lineType,
      Tem_Site_Proprio: temSiteProprio,
      Website: cleanWebsite,
      Avaliacao: rating,
      Endereco: address,
      Oferta_Recomendada: oferta,
      Diagnostico_Comercial: diagnostico,
      Mensagem_Abordagem_WhatsApp: copy,
      Link_Google_Maps: mapsUrl,
      Data_Extracao: dateStr
    });
  }

  // Se o usuário filtrou por empresas SEM site próprio
  if (semSite) {
    const semSiteOnly = allParsed.filter((p) => p.Tem_Site_Proprio === 'NÃO');
    if (semSiteOnly.length > 0) {
      return semSiteOnly.slice(0, limit);
    }
  }

  return allParsed.slice(0, limit);
}

/**
 * Fallback de emergência (OpenStreetMap Nominatim)
 */
async function fetchFallbackLeads(nicho: string, cidade: string, limit: number): Promise<RawProspectorLead[]> {
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
        const seen = new Set(places.map((p) => p.place_id));
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

  return places.slice(0, limit).map((p) => {
    const name = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : nicho);
    const address = p.display_name || `${cidade}, Brasil`;
    const category = p.type ? p.type.replace(/_/g, ' ') : nicho;
    const nicheLower = `${nicho} ${category}`.toLowerCase();
    const isAppointment = APPOINTMENT_KEYWORDS.some((k) => nicheLower.includes(k));

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

    let rawLeads: RawProspectorLead[] = [];

    // 1. Prioridade: Motor Nativo Google Maps (Instantâneo, completo e sem dependências)
    try {
      rawLeads = await fetchGoogleMapsLeads(nicho.trim(), cidade.trim(), cleanLimit, semSite);
    } catch (gmapsErr: any) {
      console.warn('Aviso: Motor nativo Google Maps encontrou falha temporária:', gmapsErr.message);
    }

    // 2. Se o motor nativo não retornou resultados e o script local em Selenium existir
    if (!rawLeads || rawLeads.length === 0) {
      const scriptPath = path.resolve(process.cwd(), '../prospeccao-google-maps/prospector.py');
      const pythonExec = fs.existsSync('/home/dresler/anaconda3/bin/python3')
        ? '/home/dresler/anaconda3/bin/python3'
        : 'python3';

      if (fs.existsSync(scriptPath)) {
        const args = [
          scriptPath,
          '--nicho', nicho.trim(),
          '--cidade', cidade.trim(),
          '--limite', String(cleanLimit),
          '--json'
        ];
        if (semSite) args.push('--sem-site');

        const leadsOutput = await new Promise<{ success: boolean; data?: any }>((resolve) => {
          execFile(
            pythonExec,
            args,
            { timeout: 120000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, PYTHONUNBUFFERED: '1' } },
            (error, stdout) => {
              if (error && !stdout) return resolve({ success: false });
              const match = stdout.match(/__LEADS_JSON_START__([\s\S]*?)__LEADS_JSON_END__/);
              if (!match) return resolve({ success: false });
              try {
                resolve({ success: true, data: JSON.parse(match[1]) });
              } catch {
                resolve({ success: false });
              }
            }
          );
        });

        if (leadsOutput.success && leadsOutput.data?.leads) {
          rawLeads = leadsOutput.data.leads;
        }
      }
    }

    // 3. Fallback de segurança caso nenhum método tenha trazido registros
    if (!rawLeads || rawLeads.length === 0) {
      rawLeads = await fetchFallbackLeads(nicho.trim(), cidade.trim(), cleanLimit);
    }

    // Mapeia para o formato de Lead do Agillex Hub
    const mappedLeads = rawLeads.map((item, index) => {
      const isSemSite = item.Tem_Site_Proprio === 'NÃO';
      const cleanPhone = (item.Telefone || '').replace(/\D/g, '');
      const waLink = item.WhatsApp_Link && item.WhatsApp_Link !== 'N/A'
        ? item.WhatsApp_Link
        : (cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}` : '');

      return {
        id: `lead-maps-${Date.now()}-${index}`,
        orgId,
        name: item.Nome || 'Empresa Local',
        phone: item.Telefone || 'N/A',
        whatsappLink: waLink,
        lineType: item.Tipo_Linha || 'Desconhecido',
        email: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.Nome || 'Empresa')}&background=0D8ABC&color=fff`,
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
      excelPath: '',
      csvPath: '',
      jsonPath: ''
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro interno no servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
