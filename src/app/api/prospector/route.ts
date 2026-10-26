import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { query } from '@/lib/db';

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
 * Formata o nome da cidade com iniciais maiúsculas (Title Case),
 * preservando preposições em minúsculas e siglas de UF em maiúsculas.
 */
function formatCityName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/,\s*brasil$/i, '');
  const lowerPrepositions = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'e']);
  const stateAbbreviations = new Set([
    'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma',
    'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn',
    'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to'
  ]);

  return cleaned
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (stateAbbreviations.has(lower)) {
        return lower.toUpperCase();
      }
      if (idx > 0 && lowerPrepositions.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Normaliza o nome da empresa para detecção de duplicidade (minúsculo, sem acentos e sem pontuação).
 */
function normalizeCompanyName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza telefone para os últimos 8 dígitos numéricos (cobre fixos e celulares com/sem DDD ou nono dígito).
 */
function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-8) : digits;
}

/**
 * Gera variações de termos de busca no Maps para obter mais resultados
 * quando empresas já mineradas precisarem ser ignoradas.
 */
function generateSearchQueries(nicho: string, cidade: string): string[] {
  const cleanCity = cidade.trim();
  const cleanNiche = nicho.trim();
  const queries: string[] = [
    `${cleanNiche} em ${cleanCity}`,
    `${cleanNiche} ${cleanCity}`,
  ];

  const nLower = cleanNiche.toLowerCase();
  if (nLower.includes('dentist') || nLower.includes('odont')) {
    queries.push(
      `clínica odontológica em ${cleanCity}`,
      `consultório odontológico em ${cleanCity}`,
      `odontologia em ${cleanCity}`,
      `dentistas em ${cleanCity}`
    );
  } else if (nLower.includes('médic') || nLower.includes('medic') || nLower.includes('clínic') || nLower.includes('clinic')) {
    queries.push(
      `consultório médico em ${cleanCity}`,
      `clínica médica em ${cleanCity}`,
      `médicos em ${cleanCity}`
    );
  } else if (nLower.includes('salão') || nLower.includes('salao') || nLower.includes('cabel') || nLower.includes('estét') || nLower.includes('estet')) {
    queries.push(
      `salão de beleza em ${cleanCity}`,
      `estética em ${cleanCity}`,
      `cabeleireiro em ${cleanCity}`
    );
  } else if (nLower.includes('advoga') || nLower.includes('juríd')) {
    queries.push(
      `escritório de advocacia em ${cleanCity}`,
      `advogado em ${cleanCity}`
    );
  } else if (nLower.includes('contab')) {
    queries.push(
      `escritório de contabilidade em ${cleanCity}`,
      `contador em ${cleanCity}`
    );
  }

  return Array.from(new Set(queries));
}

/**
 * Realiza uma consulta HTTP ao Google Maps e extrai a lista de locais
 */
async function fetchGoogleMapsSingleQuery(queryStr: string): Promise<any[]> {
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryStr)}?hl=pt-BR`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  };

  try {
    const res1 = await fetch(searchUrl, { headers });
    if (!res1.ok) return [];

    const html = await res1.text();
    const linkMatch = html.match(/<link\s+href="(\/search\?tbm=map[^"]+)"/);
    if (!linkMatch) return [];

    const endpoint = 'https://www.google.com' + linkMatch[1].replace(/&amp;/g, '&');
    const res2 = await fetch(endpoint, {
      headers: { ...headers, Referer: searchUrl }
    });
    if (!res2.ok) return [];

    let text = await res2.text();
    if (text.startsWith(")]}'\n")) {
      text = text.slice(5);
    } else if (text.startsWith(")]}'")) {
      text = text.slice(4);
    }

    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      for (const item of data) {
        if (Array.isArray(item)) {
          const valid = item.filter(
            (entry) => Array.isArray(entry) && Array.isArray(entry[1]) && entry[1][11]
          );
          if (valid.length > 0) return valid;
        }
      }
    }
  } catch {
    // Falha silenciosa para tentar a próxima query complementar
  }
  return [];
}

/**
 * Motor Nativo Google Maps com suporte a Anti-Duplicidade
 * Pula empresas já mineradas e continua coletando até atingir o limite solicitado.
 */
async function fetchGoogleMapsLeads(
  nicho: string,
  cidade: string,
  limit: number,
  semSite: boolean,
  excludeSets: { phones: Set<string>; names: Set<string> }
): Promise<{ leads: RawProspectorLead[]; ignoredCount: number }> {
  const queries = generateSearchQueries(nicho, cidade);
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const allParsed: RawProspectorLead[] = [];
  const seenInCurrentRun = new Set<string>();
  let ignoredCount = 0;

  for (const q of queries) {
    if (allParsed.length >= limit) break;

    try {
      const rawPlacesList = await fetchGoogleMapsSingleQuery(q);
      for (const entry of rawPlacesList) {
        if (allParsed.length >= limit) break;
        if (!Array.isArray(entry) || !Array.isArray(entry[1])) continue;

        const p = entry[1];
        const name = String(p[11] || '').trim();
        if (!name) continue;

        const rawPhone = String(p[178]?.[0]?.[0] || '').trim();
        const cleanDigits = rawPhone.replace(/\D/g, '');
        let cleanPhone = cleanDigits;
        if (cleanPhone.startsWith('0') && (cleanPhone.length === 11 || cleanPhone.length === 12)) {
          cleanPhone = cleanPhone.slice(1);
        }

        const normName = normalizeCompanyName(name);
        const p8 = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : '';

        // VERIFICAÇÃO ANTI-DUPLICIDADE CONTRA LEADS JÁ MINERADOS
        let isAlreadyMined = false;
        if (p8 && excludeSets.phones.has(p8)) isAlreadyMined = true;
        if (normName && excludeSets.names.has(normName)) isAlreadyMined = true;

        if (!isAlreadyMined && normName.length >= 6) {
          for (const existingName of excludeSets.names) {
            if (existingName.length >= 6 && (normName.includes(existingName) || existingName.includes(normName))) {
              isAlreadyMined = true;
              break;
            }
          }
        }

        if (isAlreadyMined) {
          ignoredCount++;
          continue;
        }

        // Evita duplicatas na mesma execução
        if (seenInCurrentRun.has(normName) || (p8 && seenInCurrentRun.has(p8))) {
          continue;
        }

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
        if (semSite && hasOwnSite) {
          continue;
        }

        const temSiteProprio: 'SIM' | 'NÃO' = hasOwnSite ? 'SIM' : 'NÃO';
        const cleanWebsite = rawWebsite || 'SEM SITE';

        const isMobile = cleanPhone.length === 11 && cleanPhone[2] === '9';
        const isLandline = cleanPhone.length === 10;
        const lineType = isMobile ? 'Móvel (WhatsApp Provável)' : isLandline ? 'Fixo' : 'A confirmar';

        const waLink = cleanPhone.length >= 10
          ? `https://web.whatsapp.com/send?phone=55${cleanPhone}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`;

        const rating = p[4]?.[7] != null ? String(p[4][7]) : '5.0';
        const placeId = p[78] || '';
        const mapsUrl = placeId
          ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${cidade}`)}`;

        // Inteligência Comercial AllLogic Online
        const nicheLower = `${nicho} ${category}`.toLowerCase();
        const isAppointment = APPOINTMENT_KEYWORDS.some((k) => nicheLower.includes(k));

        let oferta = 'Presença Digital & Site Profissional';
        let diagnostico = 'Presença Digital: Criação de página moderna no celular com botão direto para WhatsApp para atrair mais atendimentos particulares.';
        let copy = `Olá, equipe da ${name}! Tudo bem?!\n\nHoje a maioria das pessoas pesquisa no Google antes de agendar, e ter uma página própria transmite confiança, levando o paciente direto para o seu WhatsApp em 1 clique. Criamos páginas modernas para aumentarem a procura por atendimentos particulares.\n\nPosso lhes enviar uma demonstração rápida de como ficaria a presença de vocês no celular sem compromisso?`;

        if (hasOwnSite) {
          oferta = 'Agillex Agenda (Agendamento Online 24/7)';
          diagnostico = 'Automação de Agendamentos: Redução de no-show e agendamento online com WhatsApp e Google Calendar.';
          copy = `Olá equipe da ${name}, Tudo bem!?\n\nVocês utilizam sistema de agendamento online integrado ao WhatsApp para seus pacientes/clientes?\n\nA AllLogic Online desenvolveu o Agillex Agenda, que reduz em até 85% as faltas e permite que seus pacientes/clientes agendem consultas e serviços em qualquer horário e dia da semana.\n\nPosso lhes enviar o link de agendamento para conhecerem o Agillex Agenda?`;
        }

        seenInCurrentRun.add(normName);
        if (p8) seenInCurrentRun.add(p8);
        excludeSets.names.add(normName);
        if (p8) excludeSets.phones.add(p8);

        allParsed.push({
          Nome: name,
          Nicho_Buscado: nicho,
          Categoria_Google: category,
          Cidade_Pesquisada: formatCityName(cidade),
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
    } catch (err: any) {
      console.warn(`[Prospector] Falha na consulta "${q}":`, err.message);
    }
  }

  return { leads: allParsed.slice(0, limit), ignoredCount };
}

/**
 * Fallback de emergência (OpenStreetMap Nominatim)
 */
async function fetchFallbackLeads(
  nicho: string,
  cidade: string,
  limit: number,
  excludeSets: { phones: Set<string>; names: Set<string> }
): Promise<RawProspectorLead[]> {
  const query = `${nicho} em ${cidade}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit * 3}`;
  
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

  const validNew: RawProspectorLead[] = [];
  for (const p of places) {
    if (validNew.length >= limit) break;
    const name = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : nicho);
    const norm = normalizeCompanyName(name);
    if (norm && excludeSets.names.has(norm)) continue;

    const address = p.display_name || `${cidade}, Brasil`;
    const category = p.type ? p.type.replace(/_/g, ' ') : nicho;
    const nicheLower = `${nicho} ${category}`.toLowerCase();
    const isAppointment = APPOINTMENT_KEYWORDS.some((k) => nicheLower.includes(k));

    let oferta = 'Presença Digital & Site Profissional';
    let diagnostico = 'Presença Digital: Criação de página moderna no celular com botão direto para WhatsApp para atrair mais atendimentos particulares.';
    let copy = `Olá, equipe da ${name}! Tudo bem?!\n\nHoje a maioria das pessoas pesquisa no Google antes de agendar, e ter uma página própria transmite confiança, levando o paciente direto para o seu WhatsApp em 1 clique. Criamos páginas modernas para aumentarem a procura por atendimentos particulares.\n\nPosso lhes enviar uma demonstração rápida de como ficaria a presença de vocês no celular sem compromisso?`;

    if (isAppointment) {
      oferta = 'Agillex Agenda (Agendamento Online 24/7)';
      diagnostico = 'Automação de Agendamentos: Redução de no-show e agendamento online com WhatsApp.';
      copy = `Olá equipe da ${name}, Tudo bem!?\n\nVocês utilizam sistema de agendamento online integrado ao WhatsApp para seus pacientes/clientes?\n\nA AllLogic Online desenvolveu o Agillex Agenda, que reduz em até 85% as faltas e permite que seus pacientes/clientes agendem consultas e serviços em qualquer horário e dia da semana.\n\nPosso lhes enviar o link de agendamento para conhecerem o Agillex Agenda?`;
    }

    excludeSets.names.add(norm);
    validNew.push({
      Nome: name,
      Nicho_Buscado: nicho,
      Categoria_Google: category,
      Cidade_Pesquisada: formatCityName(cidade),
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
    });
  }

  return validNew;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nicho,
      cidade,
      limite = 15,
      semSite = false,
      orgId = 'org-alllogic',
      clientExcludedPhones = [],
      clientExcludedNames = []
    } = body;

    if (!nicho || !cidade) {
      return NextResponse.json(
        { error: 'Nicho e Cidade são campos obrigatórios para prospecção.' },
        { status: 400 }
      );
    }

    const cleanLimit = Math.min(Math.max(Number(limite) || 10, 1), 50);

    // 1. CARREGAR LEADS JÁ EXISTENTES PARA FILTRAGEM ANTI-DUPLICIDADE
    const excludePhones = new Set<string>();
    const excludeNames = new Set<string>();

    let targetOrgId = 'a0000000-0000-0000-0000-000000000001';
    try {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      if (orgRes.rows[0]?.id) targetOrgId = orgRes.rows[0].id;

      const existingLeadsRes = await query(
        `SELECT name, phone FROM leads WHERE organization_id = $1;`,
        [targetOrgId]
      );
      for (const row of existingLeadsRes.rows) {
        if (row.phone) {
          const normP = normalizePhone(row.phone);
          if (normP) excludePhones.add(normP);
        }
        if (row.name) {
          const normN = normalizeCompanyName(row.name);
          if (normN) excludeNames.add(normN);
        }
      }
    } catch (dbErr) {
      console.warn('[Prospector API] Aviso ao carregar leads existentes do banco:', dbErr);
    }

    // Mescla com leads enviados pelo estado do cliente no frontend
    if (Array.isArray(clientExcludedPhones)) {
      clientExcludedPhones.forEach((p: string) => {
        const normP = normalizePhone(p);
        if (normP) excludePhones.add(normP);
      });
    }
    if (Array.isArray(clientExcludedNames)) {
      clientExcludedNames.forEach((n: string) => {
        const normN = normalizeCompanyName(n);
        if (normN) excludeNames.add(normN);
      });
    }

    const initialMinedCount = excludeNames.size;
    let rawLeads: RawProspectorLead[] = [];
    let ignoredCount = 0;

    // 2. Prioridade: Motor Nativo Google Maps com desduplicação e busca multi-termo
    try {
      const result = await fetchGoogleMapsLeads(
        nicho.trim(),
        cidade.trim(),
        cleanLimit,
        semSite,
        { phones: excludePhones, names: excludeNames }
      );
      rawLeads = result.leads;
      ignoredCount = result.ignoredCount;
    } catch (gmapsErr: any) {
      console.warn('Aviso: Motor nativo Google Maps encontrou falha temporária:', gmapsErr.message);
    }

    // 3. Fallback de segurança se o motor nativo não tiver resultados suficientes
    if (rawLeads.length < cleanLimit) {
      const scriptPath = path.resolve(process.cwd(), '../prospeccao-google-maps/prospector.py');
      const pythonExec = fs.existsSync('/home/dresler/anaconda3/bin/python3')
        ? '/home/dresler/anaconda3/bin/python3'
        : 'python3';

      if (fs.existsSync(scriptPath)) {
        const args = [
          scriptPath,
          '--nicho', nicho.trim(),
          '--cidade', cidade.trim(),
          '--limite', String(cleanLimit * 2),
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

        if (leadsOutput.success && Array.isArray(leadsOutput.data?.leads)) {
          for (const item of leadsOutput.data.leads) {
            if (rawLeads.length >= cleanLimit) break;
            const normN = normalizeCompanyName(item.Nome);
            const p8 = normalizePhone(item.Telefone);
            if (normN && excludeNames.has(normN)) continue;
            if (p8 && excludePhones.has(p8)) continue;
            excludeNames.add(normN);
            if (p8) excludePhones.add(p8);
            rawLeads.push(item);
          }
        }
      }
    }

    // 4. Fallback final Nominatim caso necessário
    if (rawLeads.length === 0) {
      rawLeads = await fetchFallbackLeads(
        nicho.trim(),
        cidade.trim(),
        cleanLimit,
        { phones: excludePhones, names: excludeNames }
      );
    }

    // Mapeia para o formato de Lead do Agillex Hub
    const mappedLeads = rawLeads.map((item, index) => {
      const isSemSite = item.Tem_Site_Proprio === 'NÃO';
      const cleanPhone = (item.Telefone || '').replace(/\D/g, '');
      const waLink = item.WhatsApp_Link && item.WhatsApp_Link !== 'N/A'
        ? item.WhatsApp_Link
        : (cleanPhone.length >= 10 ? `https://web.whatsapp.com/send?phone=55${cleanPhone}` : '');

      const isMobile = (item.Tipo_Linha || '').includes('WhatsApp') || (item.Tipo_Linha || '').includes('Móvel');
      const detectedWhatsapp = isMobile && item.Telefone && item.Telefone !== 'A confirmar' ? item.Telefone : undefined;

      return {
        id: `lead-maps-${Date.now()}-${index}`,
        orgId,
        name: item.Nome || 'Empresa Local',
        phone: item.Telefone || 'A confirmar',
        whatsapp: detectedWhatsapp,
        whatsappLink: waLink,
        lineType: item.Tipo_Linha || 'Desconhecido',
        email: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.Nome || 'Empresa')}&background=0D8ABC&color=fff`,
        status: 'novo' as const,
        tags: [
          'Google Maps',
          formatCityName(cidade),
          isSemSite ? 'Sem Site' : 'Com Site',
          item.Categoria_Google || nicho.trim()
        ].filter(Boolean),
        serviceInterest: item.Oferta_Recomendada || 'Presença Digital & Site Profissional',
        diagnostic: item.Diagnostico_Comercial || '',
        lastMessage: item.Mensagem_Abordagem_WhatsApp || `Oportunidade mapeada em ${formatCityName(cidade)}.`,
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

    // Gravar novos leads automaticamente no PostgreSQL
    try {
      for (const ml of mappedLeads) {
        const insRes = await query(
          `INSERT INTO leads (
             organization_id, name, phone, whatsapp, email, status, tags, service_interest, last_message, unread_count, estimated_value, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, NOW(), NOW())
           RETURNING id;`,
          [
            targetOrgId,
            ml.name,
            ml.phone || 'A confirmar',
            ml.whatsapp || null,
            ml.email || null,
            'novo',
            ml.tags || [],
            ml.serviceInterest || '',
            ml.lastMessage || '',
            ml.estimatedValue || 0,
          ]
        );
        if (insRes.rows[0]?.id) {
          ml.id = insRes.rows[0].id;
        }
      }
    } catch (dbErr) {
      console.warn('[Prospector API] Erro ao gravar leads no banco:', dbErr);
    }

    return NextResponse.json({
      success: true,
      total: mappedLeads.length,
      niche: nicho,
      city: cidade,
      leads: mappedLeads,
      ignoredCount,
      alreadyMinedCount: initialMinedCount,
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
