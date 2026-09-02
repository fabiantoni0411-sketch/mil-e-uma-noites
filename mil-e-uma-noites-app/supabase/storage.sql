-- ============================================================
-- MIL E UMA NOITES — BUCKET DE IMAGENS (produtos e categorias)
-- Rode DEPOIS do schema.sql e do seed.sql
-- ============================================================

insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do nothing;

-- qualquer pessoa pode VER as imagens (elas aparecem no cardápio público)
create policy "leitura publica imagens" on storage.objects
  for select using (bucket_id = 'imagens');

-- só o admin logado pode enviar/alterar/excluir imagens
create policy "admin envia imagens" on storage.objects
  for insert with check (bucket_id = 'imagens' and auth.role() = 'authenticated');

create policy "admin atualiza imagens" on storage.objects
  for update using (bucket_id = 'imagens' and auth.role() = 'authenticated');

create policy "admin exclui imagens" on storage.objects
  for delete using (bucket_id = 'imagens' and auth.role() = 'authenticated');
