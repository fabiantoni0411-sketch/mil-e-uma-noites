-- ============================================================
-- MIL E UMA NOITES — DADOS INICIAIS (produtos do cardápio)
-- Rode DEPOIS do schema.sql
-- ============================================================

-- Bairro de exemplo (edite/adicione pelos admin depois)
insert into bairros (nome, taxa, ordem) values ('Centro', 5.00, 1);

-- Categorias
with cat as (
  insert into categorias (nome, ordem) values
    ('Combos', 1),
    ('Shawarmas', 2),
    ('Carne Louca', 3),
    ('Cervejas e Águas', 4),
    ('Refrigerantes', 5)
  returning id, nome
)
-- Produtos — Combos
insert into produtos (categoria_id, nome, descricao, preco, tag_texto, destacar_lancamento)
select id, 'Combo Aladin', '2 X-Burguer + batata frita.', 34.00, null, false from cat where nome='Combos'
union all
select id, 'Combo Sultão', '3 X-Salada + batata frita completa (cheddar, catupiry e bacon) + calabresa acebolada.', 50.00, null, false from cat where nome='Combos'
union all
select id, 'Combo Gênio da Lâmpada', '5 X-Bacon + fritas completas com cheddar, catupiry e bacon.', 80.00, 'mais pedido', true from cat where nome='Combos'
union all
select id, 'Combo Califa', '6 X-Salada + fritas completas + porção de onion rings.', 86.00, null, false from cat where nome='Combos'
union all
select id, 'Combo Ali Baba', '4 X-Saladas + fritas completas + calabresa acebolada e refrigerante.', 95.00, null, false from cat where nome='Combos'
union all
select id, 'Combo Lâmpada Mágica', 'X-Saladas + batata frita e onion rings.', 28.00, null, false from cat where nome='Combos'
union all
select id, 'Combo Mil e Uma Noites', 'X-Saladas + batata frita, onion rings e calabresa.', 28.00, null, false from cat where nome='Combos'
union all
select id, 'Combo 40 Ladrões', '4 X-Salada + fritas completas + calabresa acebolada + refrigerante Dolly 2L.', 105.00, 'o maior combo', false from cat where nome='Combos';

-- Produtos — Shawarmas
with cat as (select id from categorias where nome='Shawarmas')
insert into produtos (categoria_id, nome, descricao, preco, tag_texto, destacar_lancamento)
select id, 'Shawarma Turco de Carne', 'Pão sírio, pedaços de carne, salada de repolho, tomate, molho árabe (alho e tahine) e batata frita (dentro do lanche).', 35.00, null, false from cat
union all
select id, 'Shawarma Turco de Frango', 'Pão sírio, pedaços de frango, salada de repolho, tomate, molho árabe (alho e tahine) e batata frita (dentro do lanche).', 25.00, null, false from cat
union all
select id, 'Shawarma Turco de Frango e Carne', 'Pão sírio, pedaços de frango e carne, salada de repolho, tomate, molho árabe (alho e tahine) e batata frita (dentro do lanche).', 35.00, null, false from cat
union all
select id, 'Combo Oásis', '2 Shawarmas (1 de frango e 1 de carne) + batata frita.', 60.00, 'novo', true from cat;

-- Produtos — Carne Louca
with cat as (select id from categorias where nome='Carne Louca')
insert into produtos (categoria_id, nome, descricao, preco)
select id, 'Carne Louca Mini Baguete', 'Carne desfiada e bem temperada, maionese, batata palha e purê de batata.', 25.00 from cat
union all
select id, 'Carne Louca no Pão Francês', 'Carne desfiada e bem temperada, maionese, batata palha e purê de batata.', 15.00 from cat
union all
select id, 'Carne Louca Super Baguete', 'Carne desfiada e bem temperada, maionese, batata palha e purê de batata.', 30.00 from cat;

-- Produtos — Cervejas e Águas
with cat as (select id from categorias where nome='Cervejas e Águas')
insert into produtos (categoria_id, nome, preco)
select id, 'Água Mineral', 5.00 from cat
union all select id, 'Água Tônica Antarctica 350ml', 10.00 from cat
union all select id, 'Budweiser Long Neck', 9.00 from cat
union all select id, 'Cerveja Amstel 269ml', 49.00 from cat
union all select id, 'Cerveja Brahma Duplo Malte', 7.00 from cat
union all select id, 'Cerveja Heineken 600ml', 10.00 from cat
union all select id, 'Cerveja Itaipava', 5.00 from cat
union all select id, 'Cerveja Skol Lata', 6.00 from cat
union all select id, 'Cerveja Skol Pack 15', 59.00 from cat;

-- Produtos — Refrigerantes
with cat as (select id from categorias where nome='Refrigerantes')
insert into produtos (categoria_id, nome, preco)
select id, 'Coca 2 Lts retornável', 9.50 from cat
union all select id, 'Coca Lts', 18.00 from cat
union all select id, 'Dolly 2 Lts', 10.00 from cat
union all select id, 'Tiss 2 Lts', 8.00 from cat
union all select id, 'Coca lata', 6.00 from cat;
