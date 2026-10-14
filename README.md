<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Cronograma de Integração da Unidade

Aplicativo para gerir cronograma de integração e calendário corporativo.

## Executar localmente

**Pré-requisitos:** Node.js 20.19+

1. Instale as dependências:
   `npm install`
2. Crie um arquivo `.env.local` com as variáveis do projeto:
   ```bash
   VITE_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
   VITE_SUPABASE_ANON_KEY="SEU_ANON_KEY"
   ```
3. Inicie a aplicação:
   `npm run dev`

## Deploy no Vercel

1. Conecte o repositório ao Vercel.
2. Configure o Framework Preset como `Vite`.
3. Defina as variáveis de ambiente no painel do Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. O projeto já está configurado com `vercel.json` e build em `dist`.
5. Faça o deploy.

## Build de produção

`npm run build`
