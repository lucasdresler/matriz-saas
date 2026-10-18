import https from 'https';
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
    // Silencioso
  }

  if (process.env[name] && process.env[name] !== '') {
    return process.env[name] as string;
  }

  return '';
}

export interface WhmCreateAccountInput {
  domain: string;
  contactemail: string;
  planId: string;
  username?: string;
  password?: string;
  customerName?: string;
}

export interface WhmAccountResult {
  success: boolean;
  domain: string;
  username: string;
  password: string;
  cpanelUrl: string;
  serverIp: string;
  nameservers: string[];
  package: string;
  message: string;
  rawResponse?: any;
}

export class WhmService {
  private host: string;
  private port: string;
  private user: string;
  private apiToken: string;
  private isConfigured: boolean;

  constructor() {
    this.host = getEnvVariable('WHM_HOST') || '177.104.163.165';
    this.port = getEnvVariable('WHM_PORT') || '2087';
    this.user = getEnvVariable('WHM_USER') || 'root';
    this.apiToken = getEnvVariable('WHM_API_TOKEN');
    this.isConfigured = Boolean(this.apiToken && this.apiToken.trim() !== '');
  }

  /**
   * Mapeia o ID do plano comercial para o identificador técnico do pacote WHM
   */
  private resolvePackage(planId: string): string {
    const cleanId = planId.toLowerCase().replace('hospedagem_', '');
    switch (cleanId) {
      case 'essencial':
        return 'top_essencial';
      case 'profissional':
        return 'top_profissional';
      case 'avancado':
      case 'avançado':
        return 'top_avançado';
      case 'empresarial':
        return 'top_empresarial';
      default:
        return 'top_profissional';
    }
  }

  /**
   * Executa chamadas autenticadas na WHM API v1 via módulo nativo https
   */
  private async executeWhmGet(functionName: string, params: Record<string, string>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const path = `/json-api/${functionName}?${query}`;

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: this.host,
        port: parseInt(this.port, 10),
        path,
        method: 'GET',
        headers: {
          Authorization: `whm ${this.user}:${this.apiToken}`,
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Resposta inválida do WHM (status ${res.statusCode}): ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Falha de rede ao conectar no WHM: ${err.message}`));
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Timeout ao aguardar resposta do servidor WHM'));
      });

      req.end();
    });
  }

  /**
   * Gera um nome de usuário cPanel válido (máximo 14 caracteres alfanuméricos, iniciando por letra)
   */
  public generateUsername(domain: string, fallbackName?: string): string {
    let clean = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/[^a-z0-9]/g, '');

    if (!clean && fallbackName) {
      clean = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    if (!clean || !/^[a-z]/.test(clean)) {
      clean = `al${clean || 'user'}`;
    }

    // Adiciona sufixo numérico randômico de 2 dígitos para evitar colisões
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const base = clean.slice(0, 11);
    return `${base}${randomSuffix}`.slice(0, 14);
  }

  /**
   * Gera uma senha temporária segura de alta entropia
   */
  public generateSecurePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%^&*()_+';
    const all = upper + lower + numbers + special;

    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    return pwd
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  /**
   * Provisiona automaticamente a conta cPanel via WHM API v1
   */
  async createAccount(input: WhmCreateAccountInput): Promise<WhmAccountResult> {
    const domain = input.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const username = input.username || this.generateUsername(domain, input.customerName);
    const password = input.password || this.generateSecurePassword();
    const pkg = this.resolvePackage(input.planId);
    const nameservers = ['ns1.alllogiconline.com.br', 'ns2.alllogiconline.com.br'];
    const serverIp = this.host;
    const cpanelUrl = `https://${this.host}:2083`;

    if (!this.isConfigured) {
      console.warn(`[WhmService] WHM_API_TOKEN não configurado. Executando provisionamento simulado para ${domain}`);
      return {
        success: true,
        domain,
        username,
        password,
        cpanelUrl,
        serverIp,
        nameservers,
        package: pkg,
        message: 'Hospedagem provisionada com sucesso (modo simulado).',
      };
    }

    try {
      const data = await this.executeWhmGet('createacct', {
        'api.version': '1',
        username,
        domain,
        plan: pkg,
        contactemail: input.contactemail,
        password,
      });

      if (data.metadata?.result !== 1) {
        throw new Error(data.metadata?.reason || 'Erro desconhecido ao criar conta no WHM');
      }

      console.log(`[WhmService] Conta cPanel criada com sucesso no WHM: ${username} (${domain})`);

      return {
        success: true,
        domain,
        username,
        password,
        cpanelUrl,
        serverIp,
        nameservers,
        package: pkg,
        message: 'Conta cPanel provisionada com sucesso no servidor!',
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[WhmService] Erro ao provisionar conta no WHM:', error);
      throw new Error(`Falha no provisionamento da hospedagem: ${error.message}`);
    }
  }
}

export const whmService = new WhmService();
