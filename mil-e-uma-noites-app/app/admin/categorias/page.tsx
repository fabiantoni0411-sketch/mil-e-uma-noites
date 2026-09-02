'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria } from '@/lib/types';
import { uid } from '@/lib/utils';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtosCount, setProdutosCount] = useState<Record<string, number>>({});
  const [novoNome, setNovoNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const { data: cats } = await supabase.from('categorias').select('*').order('ordem');
    const { data: prods } = await supabase.from('produtos').select('categoria_id');
    const contagem: Record<string, number> = {};
    (prods || []).forEach((p: any) => { contagem[p.categoria_id] = (contagem[p.categoria_id] || 0) + 1; });
    setCategorias(cats || []);
    setProdutosCount(contagem);
    setLoading(false);
  }

  async function adicionar() {
    if (!novoNome.trim()) { alert('Digite um nome.'); return; }
    const ordem = categorias.length ? Math.max(...categorias.map(c => c.ordem)) + 1 : 0;
    await supabase.from('categorias').insert({ nome: novoNome.trim(), ordem });
    setNovoNome('');
    carregar();
  }

  async function mover(idx: number, direcao: -1 | 1) {
    const alvo = idx + direcao;
    if (alvo < 0 || alvo >= categorias.length) return;
    const a = categorias[idx], b = categorias[alvo];
    await Promise.all([
      supabase.from('categorias').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('categorias').update({ ordem: a.ordem }).eq('id', b.id),
    ]);
    carregar();
  }

  async function renomear(c: Categoria) {
    const novo = prompt('Renomear categoria:', c.nome);
    if (novo && novo.trim()) {
      await supabase.from('categorias').update({ nome: novo.trim() }).eq('id', c.id);
      carregar();
    }
  }

  async function excluir(c: Categoria) {
    if ((produtosCount[c.id] || 0) > 0) { alert('Só é possível excluir categorias sem produtos.'); return; }
    if (!confirm(`Excluir categoria "${c.nome}"?`)) return;
    await supabase.from('categorias').delete().eq('id', c.id);
    carregar();
  }

  async function escolherImagem(c: Categoria) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const path = `categorias/${uid()}-${file.name}`;
      const { error } = await supabase.storage.from('imagens').upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('imagens').getPublicUrl(path);
        await supabase.from('categorias').update({ imagem_url: data.publicUrl }).eq('id', c.id);
        carregar();
      } else {
        alert('Erro ao enviar imagem. Verifique se o bucket "imagens" existe e é público.');
      }
    };
    input.click();
  }

  if (loading) return <p className="empty-note">Carregando...</p>;

  return (
    <div>
      <p className="helper-text">Use as setas pra mudar a ordem em que as categorias aparecem como abas no cardápio. Toque no lápis pra renomear, na lixeira pra excluir (só é possível excluir categorias sem produtos), ou na foto pra escolher uma imagem que representa a categoria (aparece no cardápio impresso).</p>
      <div className="field" style={{ marginBottom: 16 }}>
        <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome da nova categoria" />
      </div>
      <button className="btn-row" style={{ marginBottom: 16 }} onClick={adicionar}>+ Adicionar categoria</button>

      {categorias.map((c, idx) => (
        <div className="cat-row" key={c.id}>
          {c.imagem_url ? <img src={c.imagem_url} alt={c.nome} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1e9d6', flex: 'none' }} />}
          <div className="nm">{c.nome}</div>
          <div className="ctrl">
            <button className="icon-btn" disabled={idx === 0} style={idx === 0 ? { opacity: .35 } : {}} onClick={() => mover(idx, -1)}>▲</button>
            <button className="icon-btn" disabled={idx === categorias.length - 1} style={idx === categorias.length - 1 ? { opacity: .35 } : {}} onClick={() => mover(idx, 1)}>▼</button>
            <button className="icon-btn" onClick={() => escolherImagem(c)}>📷</button>
            <button className="icon-btn" onClick={() => renomear(c)}>✎</button>
            <button className="icon-btn danger" onClick={() => excluir(c)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );
}
