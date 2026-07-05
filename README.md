# e-ink dashboard

Dashboard pessoal com estética e-ink (inspirado no [TRMNL](https://usetrmnl.com) e no [InkyPi](https://github.com/fatihak/InkyPi)), feito em Next.js e pensado para o Vercel. Responsivo para desktop, iPad e telemóvel, e com uma rota `/eink` de 800×480 já preparada para um futuro ecrã e-ink físico.

**Fontes de dados**

| Painel | Fonte |
|---|---|
| ▲ Tarefas ad-hoc | Notion — database "Tasks Tracker" |
| ■ Trabalho | Notion — database "Quick Capture" (P2P) |
| ● / ○ Calendário | Google Calendar + Outlook (feeds ICS privados) |
| ◆ Reminders | Apple Reminders via um Atalho (Shortcut) no iPhone (compras + diárias) |
| ☀ Meteo | Open-Meteo (sem chave) |

**Páginas**: `/` (overview de tudo), `/tasks`, `/work`, `/calendar` (7 dias), `/reminders`, `/eink` (800×480). Tudo protegido por password; `/eink` também aceita `?token=` para o dispositivo.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # preencher (ver abaixo)
npm run dev
```

## Configuração das integrações

Todas as variáveis estão em [`.env.example`](.env.example). Cada integração é opcional — sem credenciais, o painel correspondente mostra "não configurado" em vez de partir.

### 1. Acesso

- `DASHBOARD_PASSWORD` — a password de login.
- `AUTH_SECRET` — segredo para assinar o cookie de sessão: `openssl rand -hex 32`.
- `EINK_TOKEN` — token para o futuro dispositivo e-ink aceder a `/eink?token=...`.

### 2. Notion

1. Cria uma integração interna em [notion.so/profile/integrations](https://www.notion.so/profile/integrations) e copia o token para `NOTION_TOKEN`.
2. No Notion, abre a database **Tasks Tracker** → menu `…` → *Connections* → adiciona a tua integração. Repete para a **Quick Capture** (dentro de "P2P - DB").
3. Os data source IDs já estão preenchidos no `.env.example` (verificados no workspace).

### 3. Apple Reminders (Atalho/Shortcut no iPhone)

O CalDAV do iCloud não tem acesso às listas modernas da app Reminders (Tags, Smart Lists, Secções — tudo isto usa CloudKit, nunca foi ligado ao CalDAV). Por isso, em vez de o servidor ir buscar os dados ao iCloud, é o teu **iPhone** que os envia para cá através de um Atalho.

**3.1. Ligar o armazenamento (uma vez, no Vercel)**

1. No projeto no Vercel → separador **Storage** → **Create Database** → **Blob** → segue os passos (nome à tua escolha, ex. `reminders`)
2. Depois de criado, o Vercel define automaticamente a variável `BLOB_READ_WRITE_TOKEN` no projeto — não precisas de a copiar à mão
3. Faz um **Redeploy** para essa variável entrar em vigor

**3.2. Gerar o token secreto do Atalho**

Adiciona `REMINDERS_INGEST_TOKEN` nas Environment Variables do Vercel — qualquer valor aleatório serve, ex.: `openssl rand -hex 16`.

**3.3. Criar o Atalho no iPhone** (repete para "Compras" e para "Diárias")

Na app **Atalhos** (Shortcuts), cria um atalho novo com estas ações:

1. **Localizar Lembretes** ("Find Reminders") — filtra pela tua lista e/ou tag (ex.: Lista é "Reminders" **e** Tag é "Comida"). Ajusta o filtro ao que já usas nas tuas Smart Lists.
2. **Obter Conteúdo de URL** ("Get Contents of URL"):
   - URL: `https://o-teu-projeto.vercel.app/api/reminders/ingest/groceries` (usa `daily` no atalho das tarefas diárias)
   - Método: **POST**
   - Cabeçalhos (Headers): `Authorization` = `Bearer <REMINDERS_INGEST_TOKEN>`
   - Corpo do Pedido (Request Body): **JSON**
   - Adiciona um campo novo: chave `items`, valor = a variável resultante do "Localizar Lembretes" (o Atalho serializa a lista de lembretes automaticamente)

Corre o Atalho manualmente para testar. Para correr sozinho, cria uma **Automação Pessoal** (ex.: "todos os dias às 7h" ou "sempre que abro a app Reminders") a executar este Atalho, com a opção **"Executar Imediatamente"** ativada (para não pedir confirmação).

**3.4. Confirmar que está a funcionar**

Abre `https://o-teu-projeto.vercel.app/reminders/debug` — mostra exatamente os dados que o Atalho enviou da última vez, útil para confirmar que os campos batem certo antes de organizares a automação.

### 4. Calendários (ICS)

- **Google**: Definições do calendário → *Integrar calendário* → **Endereço secreto em formato iCal** → `GOOGLE_ICS_URL`.
- **Outlook**: Definições → *Calendário* → *Calendários partilhados* → *Publicar um calendário* → link **ICS** → `OUTLOOK_ICS_URL`.

> Nota: estes feeds são privados mas atualizam com algum atraso (minutos a horas, sobretudo no Google). Se um dia precisares de tempo real, o código está preparado para receber um adaptador OAuth em `src/lib/calendar.ts` sem mexer na UI.

### 5. Meteo

`WEATHER_LAT` / `WEATHER_LON` (por defeito, Lisboa). Usa a Open-Meteo, sem chave.

## Deploy no Vercel

1. Importa este repositório em [vercel.com/new](https://vercel.com/new).
2. Em *Settings → Environment Variables*, adiciona todas as variáveis do `.env.local`.
3. Deploy. Os dados são cacheados ~5 minutos; o botão ↻ força a atualização.

## Futuro ecrã e-ink

A rota `/eink?token=EINK_TOKEN` devolve um render estático de 800×480 em alto contraste, pronto para um TRMNL/InkyPi tirar screenshot. Quando tiveres o hardware, basta apontá-lo a esse URL.
