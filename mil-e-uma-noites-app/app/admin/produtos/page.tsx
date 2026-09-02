'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria, Produto } from '@/lib/types';
import { brl, uid } from '@/lib/utils';

export default function ProdutosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [bulkAberto, setBulkAberto] = useState(false);
  const [bulkFind, setBulkFind] = useState('');
  const [bulkReplace, setBulkReplace] = useState('');

  // campos do modal
  const [mCategoria, setMCategoria] = useState('');
  const [mNome, setMNome] = useState('');
  const [mPreco, setMPreco] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mTag, setMTag] = useState('');
  const [mImagemUrl, setMImagemUrl] = useState('');
  const [mDestacar, setMDestacar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('produtos').select('*'),
    ]);
    setCategorias(cats || []);
    setProdutos(prods || []);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null);
    setMCategoria(categorias[0]?.id || '');
    setMNome(''); setMPreco(''); setMDesc(''); setMTag(''); setMImagemUrl(''); setMDestacar(false);
    setModalAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setEditando(p);
    setMCategoria(p.categoria_id);
    setMNome(p.nome);
    setMPreco(String(p.preco));
    setMDesc(p.descricao || '');
    setMTag(p.tag_texto || '');
    setMImagemUrl(p.imagem_url || '');
    setMDestacar(p.destacar_lancamento);
    setModalAberto(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const path = `produtos/${uid()}-${file.name}`;
    const { error } = await supabase.storage.from('imagens').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('imagens').getPublicUrl(path);
      setMImagemUrl(data.publicUrl);
    } else {
      alert('Erro ao enviar imagem. Verifique se o bucket "imagens" existe e é público.');
    }
    setUploading(false);
  }

  async function salvar() {
    if (!mNome.trim()) { alert('Digite o nome do produto.'); return; }
    setSalvando(true);
    const payload = {
      categoria_id: mCategoria,
      nome: mNome.trim(),
      preco: parseFloat(mPreco) || 0,
      descricao: mDesc.trim() || null,
      tag_texto: mTag.trim() || null,
      imagem_url: mImagemUrl || null,
      destacar_lancamento: mDestacar,
    };
    if (editando) {
      await supabase.from('produtos').update(payload).eq('id', editando.id);
    } else {
      await supabase.from('produtos').insert({ ...payload, ativo: true });
    }
    setSalvando(false);
    setModalAberto(false);
    carregar();
  }

  async function toggleAtivo(p: Produto) {
    await supabase.from('produtos').update({ ativo: !p.ativo }).eq('id', p.id);
    setProdutos(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x));
  }

  async function toggleDestacar(p: Produto) {
    await supabase.from('produtos').update({ destacar_lancamento: !p.destacar_lancamento }).eq('id', p.id);
    setProdutos(prev => prev.map(x => x.id === p.id ? { ...x, destacar_lancamento: !x.destacar_lancamento } : x));
  }

  async function duplicar(p: Produto) {
    const { id, ...resto } = p;
    await supabase.from('produtos').insert({ ...resto, nome: resto.nome + ' (cópia)' });
    carregar();
  }

  async function excluir(p: Produto) {
    if (!confirm('Excluir este produto?')) return;
    await supabase.from('produtos').delete().eq('id', p.id);
    setProdutos(prev => prev.filter(x => x.id !== p.id));
  }

  async function aplicarBulk() {
    if (!bulkFind) { alert('Digite o texto a buscar.'); return; }
    let count = 0;
    for (const p of produtos) {
      let novoNome = p.nome;
      let novaDesc = p.descricao;
      let mudou = false;
      if (p.nome.includes(bulkFind)) { novoNome = p.nome.split(bulkFind).join(bulkReplace); mudou = true; }
      if (p.descricao && p.descricao.includes(bulkFind)) { novaDesc = p.descricao.split(bulkFind).join(bulkReplace); mudou = true; }
      if (mudou) {
        await supabase.from('produtos').update({ nome: novoNome, descricao: novaDesc }).eq('id', p.id);
        count++;
      }
    }
    await carregar();
    alert(`${count} produto(s) atualizado(s).`);
  }

  if (loading) return <p className="empty-note">Carregando...</p>;

  return (
    <div>
      <button className="btn-row" style={{ marginBottom: 14 }} onClick={abrirNovo}>+ Novo produto</button>
      <div className="card" style={{ cursor: 'pointer' }} onClick={() => setBulkAberto(!bulkAberto)}>▸ Buscar e substituir em massa</div>
      {bulkAberto && (
        <div className="card">
          <div className="field"><label>Buscar</label><input type="text" value={bulkFind} onChange={e => setBulkFind(e.target.value)} placeholder="Texto a encontrar" /></div>
          <div className="field" style={{ marginTop: 8 }}><label>Substituir por</label><input type="text" value={bulkReplace} onChange={e => setBulkReplace(e.target.value)} placeholder="Novo texto" /></div>
          <button className="btn-row" style={{ marginTop: 12 }} onClick={aplicarBulk}>Aplicar em nomes e descrições</button>
        </div>
      )}

      {categorias.map(cat => {
        const prods = produtos.filter(p => p.categoria_id === cat.id);
        if (!prods.length) return null;
        return (
          <div key={cat.id}>
            <div className="cat-section-title">{cat.nome}</div>
            {prods.map(p => (
              <div className="prod-row" key={p.id}>
                {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1e9d6', flex: 'none' }} />}
                <div className="info">
                  <div className="nm">{p.nome} <span className="cat">({cat.nome})</span></div>
                  <div className="pr">{brl(p.preco)}</div>
                  <label className="chk" style={{ marginTop: 6 }}>
                    <input type="checkbox" checked={p.destacar_lancamento} onChange={() => toggleDestacar(p)} /> Destacar em Lançamentos
                  </label>
                </div>
                <button className={`toggle ${p.ativo ? 'on' : 'off'}`} onClick={() => toggleAtivo(p)}>{p.ativo ? '● Ativo' : '○ Inativo'}</button>
                <button className="icon-btn" onClick={() => abrirEdicao(p)}>✎</button>
                <button className="icon-btn" onClick={() => duplicar(p)}>⧉</button>
                <button className="icon-btn danger" onClick={() => excluir(p)}>🗑</button>
              </div>
            ))}
          </div>
        );
      })}

      {modalAberto && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModalAberto(false); }}>
          <div className="modal">
            <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
            <div className="field">
              <label>Categoria</label>
              <select value={mCategoria} onChange={e => setMCategoria(e.target.value)}>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="field"><label>Nome</label><input type="text" value={mNome} onChange={e => setMNome(e.target.value)} /></div>
            <div className="field"><label>Preço (R$)</label><input type="number" step="0.01" value={mPreco} onChange={e => setMPreco(e.target.value)} /></div>
            <div className="field"><label>Descrição</label><textarea value={mDesc} onChange={e => setMDesc(e.target.value)} /></div>
            <div className="field"><label>Etiqueta (ex: mais pedido, novo)</label><input type="text" value={mTag} onChange={e => setMTag(e.target.value)} /></div>
            <div className="field">
              <label>Imagem</label>
              {mImagemUrl && <img className="img-preview" src={mImagemUrl} alt="" />}
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              {uploading && <p className="small-note">Enviando imagem...</p>}
              <input type="text" placeholder="ou cole a URL da imagem" value={mImagemUrl} onChange={e => setMImagemUrl(e.target.value)} style={{ marginTop: 6 }} />
            </div>
            <label className="chk"><input type="checkbox" checked={mDestacar} onChange={e => setMDestacar(e.target.checked)} /> Destacar em Lançamentos</label>
            <div className="modal-actions">
              <button className="cancel" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button className="save" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
