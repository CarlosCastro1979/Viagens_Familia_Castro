# Familia Castro Trips

Caderno de despesas da família, o mesmo do `familia_castro_trips.html`. Corre no **GitHub Pages**. Não usa Vercel.

Os dados continuam no **Supabase** (`fct_trips` / `carlos_castro_trips`) quando a chave está válida.

## Link no telemóvel

Depois do repositório no GitHub e do Pages ligado, o endereço é:

`https://<a-tua-conta>.github.io/<nome-do-repo>/`

No iPhone: Safari → Partilhar → **Adicionar ao ecrã de início**.  
No Android: Chrome → menu → **Instalar aplicação**.

## Publicar no GitHub (junto das outras)

1. Clica em **Create repo** neste agente.
2. No repositório: **Settings → Pages → Source → GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions** cria:

   - `NEXT_PUBLIC_SUPABASE_URL` — `https://qnscwppgljobelplgbkp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — a chave `anon` nova (Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ROW_ID` — `carlos_castro_trips`

4. Faz push para `main`. O workflow **GitHub Pages** publica o site.

A chave que vinha no HTML já não é aceite. Sem secrets, a app abre na mesma; a nuvem liga-se depois em **Câmbios → Supabase**.

## Local

```bash
npm install
npm run dev -- --port 43147
```

O `npm run build` gera a pasta `out/` (site estático, o mesmo que o Pages serve).
