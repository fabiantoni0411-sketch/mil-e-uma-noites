-- ============================================================
-- MIL E UMA NOITES — SCHEMA DO BANCO DE DADOS (Supabase/Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- CONFIGURAÇÕES GERAIS DA LOJA ----------
create table configuracoes (
  id int primary key default 1,
  pix_key text default '',
  whatsapp text default '5511978837446',
  instagram text default 'Mileumanoites_520',
  modo_horario text default 'auto', -- auto | aberto | fechado
  prep_semana text default '25 a 40 minutos',
  prep_fim_semana text default '30 a 50 minutos',
  constraint singleton check (id = 1)
);
insert into configuracoes (id) values (1);

-- ---------- HORÁRIOS DE FUNCIONAMENTO ----------
create table horarios (
  dia_semana int primary key, -- 0=domingo .. 6=sábado
  ativo boolean default true,
  abre time default '18:00',
  fecha time default '23:59'
);
insert into horarios (dia_semana) select generate_series(0,6);

-- ---------- BAIRROS E TAXAS DE ENTREGA ----------
create table bairros (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  taxa numeric(10,2) not null default 0,
  ordem int default 0
);

-- ---------- CATEGORIAS ----------
create table categorias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  imagem_url text,
  ordem int not null default 0
);

-- ---------- PRODUTOS ----------
create table produtos (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid references categorias(id) on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10,2) not null default 0,
  imagem_url text,
  tag_texto text,               -- ex: "mais pedido", "novo"
  destacar_lancamento boolean default false,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- ---------- PEDIDOS ----------
create table pedidos (
  id uuid primary key default uuid_generate_v4(),
  cliente_nome text not null,
  cliente_telefone text not null,
  itens jsonb not null,              -- [{nome, qtd, preco}]
  tipo_entrega text not null,        -- 'entrega' | 'retirada'
  bairro_nome text,
  taxa_entrega numeric(10,2) default 0,
  endereco text,
  referencia text,
  forma_pagamento text not null,
  total numeric(10,2) not null,
  pago boolean default false,
  status text not null default 'Pendente', -- Pendente | Preparando | Saiu para entrega | Entregue
  criado_em timestamptz not null default now()
);
create index idx_pedidos_criado_em on pedidos (criado_em desc);

-- ============================================================
-- RELATÓRIOS: views prontas para consultar por dia / semana / mês
-- ============================================================

-- Vendas agrupadas por dia
create view relatorio_por_dia as
select
  date_trunc('day', criado_em) as periodo,
  count(*) as qtd_pedidos,
  sum(total) as faturamento
from pedidos
group by 1
order by 1 desc;

-- Vendas agrupadas por semana (segunda a domingo)
create view relatorio_por_semana as
select
  date_trunc('week', criado_em) as periodo,
  count(*) as qtd_pedidos,
  sum(total) as faturamento
from pedidos
group by 1
order by 1 desc;

-- Vendas agrupadas por mês
create view relatorio_por_mes as
select
  date_trunc('month', criado_em) as periodo,
  count(*) as qtd_pedidos,
  sum(total) as faturamento
from pedidos
group by 1
order by 1 desc;

-- Produtos mais vendidos (a partir do jsonb de itens), com filtro por período feito na aplicação
create view relatorio_itens_vendidos as
select
  p.id as pedido_id,
  p.criado_em,
  (item->>'nome') as produto_nome,
  (item->>'qtd')::int as quantidade,
  (item->>'preco')::numeric as preco_unit,
  (item->>'qtd')::int * (item->>'preco')::numeric as subtotal
from pedidos p, jsonb_array_elements(p.itens) as item;

-- ============================================================
-- REGRA DOS 30 DIAS: pedidos com mais de 30 dias somem da lista
-- detalhada, mas continuam contando nos relatórios acima (nada é apagado).
-- Esta view é o que a tela "Pedidos" deve consultar:
-- ============================================================
create view pedidos_detalhados_30_dias as
select * from pedidos
where criado_em >= now() - interval '30 days'
order by criado_em desc;

-- ============================================================
-- SEGURANÇA (RLS) — leitura pública do cardápio, escrita só autenticada
-- ============================================================
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table bairros enable row level security;
alter table configuracoes enable row level security;
alter table horarios enable row level security;
alter table pedidos enable row level security;

create policy "leitura publica categorias" on categorias for select using (true);
create policy "leitura publica produtos" on produtos for select using (true);
create policy "leitura publica bairros" on bairros for select using (true);
create policy "leitura publica configuracoes" on configuracoes for select using (true);
create policy "leitura publica horarios" on horarios for select using (true);

-- clientes podem CRIAR pedidos (checkout), mas não ler/editar os de outros
create policy "criar pedido" on pedidos for insert with check (true);

-- edição (produtos, categorias, pedidos, config) exige login (admin autenticado)
create policy "admin edita categorias" on categorias for all using (auth.role() = 'authenticated');
create policy "admin edita produtos" on produtos for all using (auth.role() = 'authenticated');
create policy "admin edita bairros" on bairros for all using (auth.role() = 'authenticated');
create policy "admin edita configuracoes" on configuracoes for all using (auth.role() = 'authenticated');
create policy "admin edita horarios" on horarios for all using (auth.role() = 'authenticated');
create policy "admin le e edita pedidos" on pedidos for select using (auth.role() = 'authenticated');
create policy "admin atualiza pedidos" on pedidos for update using (auth.role() = 'authenticated');
create policy "admin exclui pedidos" on pedidos for delete using (auth.role() = 'authenticated');
