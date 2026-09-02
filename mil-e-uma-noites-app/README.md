# Mil e Uma Noites — Cardápio Online + Painel Administrativo

Projeto completo: loja com carrinho e pedido por WhatsApp, e painel
administrativo (Painel, Pedidos, Produtos, Categorias, Bairros/Taxas,
Horários, Relatórios, Imprimir cardápio). Funciona igual em celular e
notebook. Feito em Next.js + Supabase.

## O que já está pronto

- ✅ Banco de dados criado no Supabase (schema.sql + seed.sql já rodados)
- ✅ Código completo do site neste projeto

## O que falta fazer (nesta ordem)

### 1. Criar o bucket de imagens

No SQL Editor do Supabase, rode o arquivo `supabase/storage.sql`
(igual você fez com schema.sql e seed.sql — se aparecer aviso de RLS,
pode continuar, é o esperado).

### 2. Criar seu usuário de administrador

O login do painel agora usa e-mail e senha de verdade (mais seguro).

1. No painel do Supabase, vá em **Authentication → Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: um e-mail seu (ex: `seuemail@gmail.com`)
   - **Password**: a senha que você quiser usar no admin
   - Marque **"Auto Confirm User"** (importante, senão ele não deixa logar)
4. Clique em criar

É esse e-mail e senha que você vai usar para entrar em `/admin`.

### 3. Instalar as dependências e testar localmente (opcional, mas recomendado)

Se você tiver o Node.js instalado no notebook:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` para ver a loja, e
`http://localhost:3000/admin` para o painel.

### 4. Subir o código para o GitHub

1. Crie uma conta em **github.com** (se ainda não tiver)
2. Crie um novo repositório (pode ser privado), ex: `mil-e-uma-noites`
3. Suba os arquivos deste projeto para esse repositório (pelo site do
   GitHub mesmo, com "uploading an existing file", ou usando git)

### 5. Publicar na Vercel

1. Crie uma conta em **vercel.com** (pode entrar direto com GitHub)
2. Clique em **"Add New" → "Project"**
3. Selecione o repositório `mil-e-uma-noites` que você criou
4. Antes de clicar em Deploy, abra **"Environment Variables"** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hwygynpnmilkundswmzq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_FX-LWvA-A9Q-KfbDHPonGA_PTWwfhcb`
5. Clique em **Deploy**
6. Em cerca de 1-2 minutos, a Vercel te dá um link tipo
   `mil-e-uma-noites.vercel.app` — esse é o site definitivo, funciona
   em qualquer celular ou notebook.

## Estrutura do projeto

```
app/
  page.tsx              → loja (cardápio do cliente)
  admin/
    layout.tsx           → login + navegação por abas
    page.tsx             → Painel (dashboard)
    pedidos/page.tsx      → Pedidos (últimos 30 dias detalhados)
    produtos/page.tsx     → Produtos (CRUD + imagens)
    categorias/page.tsx   → Categorias (ordem + imagens)
    bairros/page.tsx      → Bairros/Taxas + Pix/WhatsApp/Instagram
    horarios/page.tsx     → Horários de funcionamento
    relatorios/page.tsx   → Relatórios por dia/semana/mês
    imprimir/page.tsx     → Gerar PDF do cardápio
lib/
  supabaseClient.ts       → conexão com o banco
  types.ts                → tipos TypeScript
  utils.ts                → funções auxiliares (preço, horário, etc.)
supabase/
  schema.sql              → estrutura do banco (já rodado)
  seed.sql                → produtos iniciais (já rodado)
  storage.sql             → bucket de imagens (rodar agora)
```

## Sobre a regra dos 30 dias

Nenhum pedido é apagado do banco. A tela **Pedidos** só *exibe* os
últimos 30 dias com todos os detalhes. Pedidos mais antigos continuam
contando normalmente na aba **Relatórios** (por dia, semana ou mês).

## Dúvidas / erros

Se aparecer algum erro ao testar ou publicar, me manda o print da
mensagem de erro que eu ajudo a resolver.
