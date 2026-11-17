# Sala aberta

Uma sala de conversa temporária para publicar no GitHub Pages. As mensagens são
transmitidas em tempo real pelo Supabase Realtime Broadcast: não são gravadas em
banco, não há histórico e não é necessário entrar com uma conta.

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No painel do projeto, copie a **Project URL** e a chave pública (**anon** ou
   **publishable key**).
3. Preencha `supabaseUrl` e `supabaseAnonKey` em [config.js](./config.js). Essa
   chave pública é destinada ao navegador; não coloque chaves `service_role` ou
   outros segredos no site.
4. Confira se o Realtime está habilitado no projeto.
5. Ative o GitHub Pages nas configurações do repositório, usando a branch `main`
   e a pasta raiz (`/`). O site será publicado em
   `https://vmhedel.github.io/talk-sahur/`.

As mensagens só chegam a quem está conectado à sala naquele momento. Quem entra
depois não vê as anteriores; ao sair ou atualizar a página, as mensagens
desaparecem. Os nomes são livres e não são verificados.