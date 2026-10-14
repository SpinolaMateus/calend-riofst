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

## Agendas por público e acesso administrativo

O cronograma de integração tem agendas separadas para **Geral**, **Temporários**, **Jovem Aprendiz** e **Estagiários**. Selecione uma agenda antes de criar atividades; ao editar, o público também pode ser alterado. Importações e exportações de Excel operam sobre a agenda selecionada, e a sincronização envia os quatro públicos.

Para proteger as alterações compartilhadas:

1. No Supabase, abra **SQL Editor** e execute o script exibido no painel **Vercel & Supabase** do aplicativo. Ele permite leitura pública e restringe gravações aos administradores.
2. Mantenha o cadastro público desativado em **Authentication → Settings**.
3. Em **Authentication → Users**, crie e confirme o usuário `ggfst@tgmjghxytbwafhrxdkyl.supabase.co`, definindo diretamente no painel uma senha com pelo menos 6 caracteres. A senha `GGFST` sozinha é curta demais para o Supabase Auth. Se usar outro e-mail interno, configure `VITE_SUPABASE_ADMIN_EMAIL` no Vercel para esse e-mail. Não grave a senha no código nem no repositório.
4. Copie o UUID do usuário administrador e, no SQL Editor, execute `INSERT INTO public.app_admins (user_id) VALUES ('UUID_DO_USUARIO');`.
5. No aplicativo, use **Acesso admin** e entre com usuário `GGFST` e a senha definida no painel.

Contas autenticadas que não estiverem em `public.app_admins` continuam sem permissão para editar. Nunca use uma chave `service_role` no navegador nem nas variáveis `VITE_*`.

**Aviso:** uma senha compartilhada e simples pode ser descoberta; qualquer pessoa que a conheça poderá editar. Para uso real da equipe, escolha uma senha forte e única para a conta do Supabase; o código não armazena a senha.

## Build de produção

`npm run build`
