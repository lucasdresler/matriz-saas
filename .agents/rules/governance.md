# 🛡️ Regras de Governança e Autonomia do Assistente (MATRIZ OS)

Estas regras definem o limite de autonomia entre o assistente e o usuário (dresler).

---

## 🟢 O que o assistente pode executar AUTONOMAMENTE (sem perguntar):

1. **Diagnósticos e Leituras**:
   - Inspecionar logs de containers locais e na VPS (`docker logs`).
   - Verificar portas, processos e status (`docker ps`, `netstat`, `curl`, `ss`).
   - Ler e inspecionar arquivos de código do projeto.

2. **Desenvolvimento e Manutenção de Código**:
   - Criar e editar componentes, páginas e estilos em `src/`.
   - Corrigir bugs de TypeScript, Next.js, CSS e Dockerfiles.
   - Executar builds de teste locais (`npm run build`, `npm test`).

3. **Deploy Contínuo de Novas Funcionalidades**:
   - Atualizar e recompilar o container `matriz-saas` na VPS quando o usuário solicitar novas telas, recursos ou melhorias na plataforma.

---

## 🔴 O que SEMPRE EXIGE AUTORIZAÇÃO PRÉVIA (nunca fazer sem perguntar):

1. **Exclusões Destrutivas**:
   - Deletar volumes de banco de dados (`docker volume rm`, `docker compose down -v`).
   - Comandos de exclusão em massa (`rm -rf`) fora de pastas temporárias.
   - Dropar tabelas ou limpar dados reais de clientes no PostgreSQL.

2. **Alterações no Sistema Operacional / Raiz da Máquina e VPS**:
   - Instalar pacotes no sistema via `apt`, `yum` ou scripts de terceiros.
   - Modificar regras de firewall globais do sistema (`iptables`, `ufw`, security lists).
   - Comandos de reinicialização da máquina (`reboot`, `shutdown`).

3. **Serviços Externos**:
   - Criação de recursos que envolvam cobrança ou contratação de terceiros.
