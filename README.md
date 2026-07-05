# e-ink dashboard

Dashboard pessoal com estética e-ink (inspirado no [TRMNL](https://usetrmnl.com) e no [InkyPi](https://github.com/fatihak/InkyPi)), feito em Next.js e pensado para o Vercel. Responsivo para desktop, iPad e telemóvel, e com uma rota `/eink` de 800×480 já preparada para um futuro ecrã e-ink físico.

**Fontes de dados**

| Painel | Fonte |
|---|---|
| ▲ Tarefas ad-hoc | Notion — database "Tasks Tracker" |
| ■ Trabalho | Notion — database "Quick Capture" (P2P) |
| ● / ○ Calendário | Google Calendar + Outlook (feeds ICS privados) |
| ◆ Reminders | Apple Reminders via iCloud CalDAV (compras + diárias) |
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

### 3. Apple Reminders (iCloud CalDAV)

1. Em [account.apple.com](https://account.apple.com) → *Sign-In and Security* → *App-Specific Passwords* → cria uma password nova.
2. `ICLOUD_EMAIL` = o teu Apple ID; `ICLOUD_APP_PASSWORD` = a password criada.
3. Escolhe **uma** das duas formas de dizer à app o que mostrar em cada painel:
   - **Por tag** (`REMINDERS_GROCERIES_TAG`, `REMINDERS_DAILY_TAG`) — usa isto se organizas os Reminders com **Smart Lists** (filtros por tag, como os blocos coloridos no topo da app Reminders). O CalDAV do iCloud não expõe Smart Lists como listas, só a tag em si — preenche com o nome da tag sem o `#` (ex.: `Comida`).
   - **Por lista** (`REMINDERS_GROCERIES_LIST`, `REMINDERS_DAILY_LIST`) — o nome **exato** de uma lista real do iCloud (ex.: "Família", "Lembretes"). Só é usada se a variável de tag correspondente estiver vazia.
   - Se o nome/tag não bater certo, a página `/reminders` mostra os nomes de listas que encontrou no iCloud, para ajudar a corrigir.

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
