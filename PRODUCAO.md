# Deploy e Produção — Sentempo

Este documento explica como o projeto é implantado em produção usando imagens Docker, GitHub Container Registry (GHCR) e GitHub Actions para Integração e Entrega Contínuas (CI/CD).

## Arquitetura de Deploy

A arquitetura de produção do Sentempo consiste em:
- **GitHub**: armazena o código fonte.
- **GitHub Actions**: roda testes (CI) e cria as imagens Docker (CD).
- **GitHub Container Registry (GHCR)**: hospeda as imagens prontas do frontend e backend.
- **Servidor de Produção (Host Linux)**: um servidor remoto acessado por SSH onde a aplicação roda. Apenas as imagens prontas e a configuração de infraestrutura (`compose.prod.yml`, `.env`) residem nele. O código-fonte não é enviado para o servidor.

```
[GitHub] --(push main)--> [GitHub Actions] --(build)--> [GHCR]
                                 |
                          (deploy ssh)
                                 v
                        [Servidor de Produção] <--(pull imagens)-- [GHCR]
```

## Configuração Inicial do Servidor

Antes do primeiro deploy, prepare o servidor via SSH:

### 1. Criar estrutura de diretórios e ajustar permissões
Execute no servidor:
```bash
sudo mkdir -p /opt/sentempo/backups
sudo mkdir -p /opt/sentempo/scripts
sudo chown -R $USER:$USER /opt/sentempo
```
*Nota: O usuário (`$USER`) que for associado ao GitHub Actions deve conseguir executar os comandos do `docker compose` sem usar `sudo`.*

### 2. Criar Chave SSH para o GitHub Actions
Gere uma chave exclusiva para o pipeline do GitHub Actions acessar seu servidor:
```bash
ssh-keygen -t ed25519 -C "sentempo-github-actions" -f ~/.ssh/sentempo_github_actions
```
- Copie o conteúdo da chave pública (`~/.ssh/sentempo_github_actions.pub`) e adicione ao final do arquivo `~/.ssh/authorized_keys` no servidor.
- Copie o conteúdo da chave privada (`~/.ssh/sentempo_github_actions`) para ser usado no GitHub (nunca versione essa chave no repositório!).

### 3. Configurar o `.env` de Produção
Crie o arquivo `/opt/sentempo/.env` com as configurações reais, baseadas no `.env.exemplo`. **Importante**: inclua `VERSAO=latest`. O GitHub Actions nunca substitui esse arquivo, ele apenas o atualiza com a versão recém implantada.

### 4. Próximos Passos de Infraestrutura
> **Nota:** Não configuramos Nginx ou Certbot (HTTPS) neste repositório. O proxy do Docker apenas expõe a porta interna `127.0.0.1:8080`. O próximo passo (após informar domínio e DNS) será configurar o Nginx do próprio servidor Host para fazer proxy reverso para essa porta local com HTTPS.

## Configurando o Repositório no GitHub (Secrets)

Para que o GitHub Actions consiga acessar seu servidor, cadastre as variáveis na aba **Settings > Secrets and variables > Actions**:

- `SERVIDOR_HOST`: IP ou domínio do servidor de produção (ex: `198.51.100.22`).
- `SERVIDOR_USUARIO`: Nome de usuário para conexão SSH (ex: `ubuntu`).
- `SERVIDOR_PORTA`: Porta do SSH (normalmente `22`).
- `SERVIDOR_CHAVE_SSH`: A chave privada SSH (`sentempo_github_actions`) que geramos no passo anterior.

Você também precisará configurar o `Environment` no GitHub chamado **`production`**. 

## Imagens Finais e GHCR

As imagens do projeto seguem o padrão (tudo em minúsculo):
- **Backend**: `ghcr.io/seu_owner/sentempo-backend`
- **Frontend**: `ghcr.io/seu_owner/sentempo-frontend`
Elas ganham duas tags a cada deploy: `latest` e o SHA do commit (ex: `a31bf92`).

### Público vs Privado
- **Imagens Públicas**: Se as imagens estiverem públicas (menu de Packages do GitHub), o servidor faz pull automático sem problemas.
- **Imagens Privadas**: Se você preferir mantê-las privadas, é necessário autenticar o servidor manualmente **antes do primeiro deploy**. Gere um PAT (Personal Access Token) no GitHub e execute no servidor:
```bash
echo "SEU_CR_PAT" | docker login ghcr.io -u SEU_USUARIO_GITHUB --password-stdin
```

## Deploy Automático

O workflow `pipeline.yml` unificou as rotinas de Integração (CI) e Entrega (CD):
1. **Testes e Build**: Garante que os testes backend e frontend passem, executa o lint e valida que as imagens buildam com sucesso.
2. **Push no GHCR**: Apenas após sucesso no CI (na branch `main`), envia as imagens com a tag SHA para o GHCR.
3. **Deploy SSH**: Conecta ao servidor, atualiza `VERSAO=<sha-curto>` no `.env` e roda o `docker compose up -d`.
4. **Healthcheck (Polling)**: Testa a API `http://127.0.0.1:8080/api/saude` a cada 5 segundos (por até 60s) para garantir que a aplicação subiu.

## Rollback

**O rollback automático NÃO está implementado.** 
Se o healthcheck do workflow falhar, o job finaliza com erro. No entanto, a versão nova que falhou pode já estar rodando no servidor.

Para fazer rollback, o processo é **manual** e seguro graças às tags SHA geradas:
1. Acesse o servidor via SSH.
2. Identifique o SHA do commit anterior ou uma tag funcional.
3. Altere o `.env` ou rode os comandos:
```bash
cd /opt/sentempo
export VERSAO=<sha-anterior>

docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
```

## Logs e Diagnóstico
- **Logs da API**: `docker compose -f compose.prod.yml logs backend`
- **Logs do Banco**: `docker compose -f compose.prod.yml logs banco`
- **Reinício**: `docker compose -f compose.prod.yml restart`
