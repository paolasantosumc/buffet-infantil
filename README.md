# Comida Feliz — Buffet Infantil

Aplicação full-stack para apresentação do buffet, consulta de pacotes, solicitação de orçamento, cadastro/login de clientes e acompanhamento de pedidos. Interface React responsiva; API Node/Express; PostgreSQL em Docker.

## Requisitos

- Node.js 20 ou superior
- Docker Desktop com Docker Compose
- npm

## Rodar localmente

1. Descompacte o projeto e abra a pasta no terminal.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o arquivo de ambiente:

   ```bash
   cp .env.example .env
   ```

   No Windows PowerShell: `Copy-Item .env.example .env`

4. Suba o PostgreSQL:

   ```bash
   docker compose up -d
   ```

   O banco `comida_feliz` é criado e recebe os pacotes iniciais automaticamente.

5. Em um terminal, inicie a API:

   ```bash
   npm run server
   ```

6. Em outro terminal, inicie o React:

   ```bash
   npm run dev
   ```

7. Abra o endereço mostrado pelo Vite (normalmente http://localhost:5173).

A API local roda na porta 3001. O Vite encaminha `/api` para a API local.

## Administrador

O cadastro público sempre cria usuário com perfil `client`. Para promover uma conta a administradora, primeiro cadastre-se normalmente e depois execute:

```bash
docker compose exec db psql -U comidafeliz -d comida_feliz -c "UPDATE users SET role='admin' WHERE email='seu-email@exemplo.com';"
```

Saia e entre novamente para renovar o token. A área do administrador lista todos os pedidos e permite atualizar o status.

## Publicar na Vercel

**Importante:** a Vercel hospeda o frontend e executa a API como Function, mas não hospeda um container Docker persistente. O PostgreSQL do `docker-compose.yml` é para desenvolvimento/local. Para a versão publicada, use um PostgreSQL gerenciado acessível pela internet (por exemplo, Neon, Railway ou outro serviço PostgreSQL), ou hospede o banco em um servidor próprio com rede segura. Não use `localhost` como `DATABASE_URL` na Vercel.

1. Envie o projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente do projeto:
   - `DATABASE_URL`: URL PostgreSQL do banco de produção.
   - `JWT_SECRET`: segredo aleatório forte, exclusivo de produção.
4. Faça o deploy. A Vercel usará `vercel.json`, publicará `dist` e direcionará `/api/*` para `api/index.js`.
5. Execute `database/init.sql` uma única vez no banco de produção para criar as tabelas e pacotes iniciais.

## Endpoints principais

- `GET /api/health`
- `GET /api/packages`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/bookings`
- `GET /api/bookings/mine` (autenticado)
- `GET /api/admin/bookings` (admin)
- `PATCH /api/admin/bookings/:id` (admin)

## Observações importantes antes de produção

- Os preços dos pacotes são valores ilustrativos/editáveis em `database/init.sql`; ajuste-os à operação real.
- Configure política de privacidade, termos e consentimento LGPD antes de coletar dados reais.
- Configure backups, monitoramento, limites de conexão e credenciais fortes no banco.
- Para produção, recomenda-se validar disponibilidade de datas, impedir conflitos de agenda e enviar confirmação por e-mail/WhatsApp.
- O formulário atual registra pedidos de orçamento; não confirma automaticamente uma reserva nem processa pagamentos.
- Imagens de demonstração usam URLs do Unsplash. Substitua por fotos autorizadas do buffet.
- Para aplicar alterações no SQL a um volume já criado, execute os comandos SQL manualmente; o script de inicialização do Docker só roda na primeira criação do volume.

## Estrutura

```text
comida-feliz/
├── api/index.js
├── database/init.sql
├── server/app.js
├── server/db.js
├── src/main.jsx
├── src/styles.css
├── docker-compose.yml
├── package.json
├── vercel.json
└── README.md
```
