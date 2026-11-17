'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria, Produto, Bairro, Configuracoes, Horario, ItemPedido } from '@/lib/types';
import { brl, formatPhone, getStatusAgora, getPrepAtual } from '@/lib/utils';

interface CartItem { id: string; qtd: number; obs?: string; }

function SkylineBackground() {
  const [stars, setStars] = useState<{ top: string; left: string; delay: string; size: string }[]>([]);
  useEffect(() => {
    setStars(Array.from({ length: 60 }).map(() => ({
      top: Math.random() * 70 + '%',
      left: Math.random() * 100 + '%',
      delay: (Math.random() * 4) + 's',
      size: Math.random() < 0.15 ? '3px' : '2px',
    })));
  }, []);
  return (
    <div className="page-bg">
      {stars.map((s, i) => (
        <span key={i} className="star" style={{ top: s.top, left: s.left, animationDelay: s.delay, width: s.size, height: s.size }} />
      ))}
      <svg className="skyline-svg" viewBox="0 0 1400 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="#050915" opacity="0.9">
          <rect x="0" y="140" width="60" height="80" />
          <circle cx="30" cy="130" r="26" />
          <rect x="90" y="170" width="30" height="50" />
          <polygon points="105,140 95,170 115,170" />
          <rect x="150" y="100" width="70" height="120" />
          <circle cx="185" cy="95" r="38" />
          <rect x="170" y="40" width="10" height="55" />
          <rect x="240" y="160" width="26" height="60" />
          <polygon points="253,130 242,160 264,160" />
          <rect x="290" y="120" width="90" height="100" />
          <circle cx="335" cy="112" r="44" />
          <rect x="318" y="45" width="10" height="67" />
          <circle cx="323" cy="40" r="4" />
          <rect x="410" y="175" width="24" height="45" />
          <rect x="460" y="150" width="60" height="70" />
          <circle cx="490" cy="140" r="30" />
          <rect x="550" y="90" width="110" height="130" />
          <circle cx="605" cy="82" r="52" />
          <rect x="583" y="15" width="12" height="67" />
          <circle cx="589" cy="10" r="5" />
          <rect x="690" y="165" width="28" height="55" />
          <polygon points="704,135 692,165 716,165" />
          <rect x="740" y="130" width="80" height="90" />
          <circle cx="780" cy="122" r="40" />
          <rect x="850" y="170" width="24" height="50" />
          <rect x="900" y="105" width="95" height="115" />
          <circle cx="947" cy="98" r="46" />
          <rect x="928" y="35" width="10" height="63" />
          <rect x="1020" y="160" width="28" height="60" />
          <polygon points="1034,130 1022,160 1046,160" />
          <rect x="1080" y="115" width="85" height="105" />
          <circle cx="1122" cy="108" r="42" />
          <rect x="1102" y="45" width="10" height="63" />
          <circle cx="1107" cy="40" r="4" />
          <rect x="1200" y="170" width="26" height="50" />
          <rect x="1250" y="145" width="65" height="75" />
          <circle cx="1282" cy="136" r="32" />
          <rect x="1340" y="170" width="60" height="50" />
          <circle cx="1370" cy="160" r="26" />
        </g>
      </svg>
    </div>
  );
}

export default function LojaPage() {
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // checkout state
  const [entrega, setEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [bairroId, setBairroId] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [linkWhatsFinal, setLinkWhatsFinal] = useState('');

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const [{ data: cats }, { data: prods }, { data: bs }, { data: cfg }, { data: hrs }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('produtos').select('*').eq('ativo', true),
      supabase.from('bairros').select('*').order('ordem'),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
      supabase.from('horarios').select('*'),
    ]);
    setCategorias(cats || []);
    setProdutos(prods || []);
    setBairros(bs || []);
    setConfig(cfg as Configuracoes);
    setHorarios((hrs as Horario[]) || []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }

  const categoriasComProdutos = useMemo(
    () => categorias.filter(c => produtos.some(p => p.categoria_id === c.id)),
    [categorias, produtos]
  );

  const temLancamentos = useMemo(() => produtos.some(p => p.destacar_lancamento), [produtos]);

  const abasVisiveis = useMemo(() => {
    const lista = [...categoriasComProdutos];
    if (temLancamentos) lista.unshift({ id: '__lancamentos__', nome: 'Lançamentos', imagem_url: null, ordem: -1 });
    return lista;
  }, [categoriasComProdutos, temLancamentos]);

  const produtosDaAba = useMemo(() => {
    if (activeCat === '__lancamentos__') return produtos.filter(p => p.destacar_lancamento);
    return produtos.filter(p => p.categoria_id === activeCat);
  }, [activeCat, produtos]);

  useEffect(() => {
    if (!activeCat && abasVisiveis.length) setActiveCat(abasVisiveis[0].id);
  }, [abasVisiveis, activeCat]);

  function qtyOf(id: string) { return cart.find(i => i.id === id)?.qtd || 0; }
  function changeQty(id: string, delta: number) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return delta > 0 ? [...prev, { id, qtd: 1 }] : prev;
      const novaQtd = existing.qtd + delta;
      if (novaQtd <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qtd: novaQtd } : i);
    });
  }

  function atualizarObs(id: string, obs: string) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, obs } : i));
  }

  const cartCount = cart.reduce((s, i) => s + i.qtd, 0);
  const cartTotal = cart.reduce((s, i) => {
    const p = produtos.find(x => x.id === i.id);
    return s + (p ? p.preco * i.qtd : 0);
  }, 0);

  const bairroSelecionado = bairros.find(b => b.id === bairroId);
  const taxaEntrega = entrega === 'entrega' && bairroSelecionado ? bairroSelecionado.taxa : 0;
  const subtotalComTaxa = cartTotal + taxaEntrega;
  const descontoPix = pagamento === 'Pix' ? subtotalComTaxa * 0.05 : 0;
  const totalFinal = subtotalComTaxa - descontoPix;

  async function finalizarPedido() {
    const statusAtual = getStatusAgora(config!, horarios);
    if (!statusAtual.aberto) { showToast('A loja está fechada no momento. Não é possível fazer pedidos fora do horário de funcionamento.'); return; }
    if (!nome || !telefone) { showToast('Preencha nome e telefone.'); return; }
    if (!pagamento) { showToast('Escolha a forma de pagamento.'); return; }
    if (entrega === 'entrega' && !bairroId) { showToast('Selecione o bairro.'); return; }
    if (cart.length === 0) { showToast('Seu carrinho está vazio.'); return; }

    // abre a aba do WhatsApp JÁ (antes de qualquer "await"), senão o navegador bloqueia o popup depois de uma espera
    const janelaWhats = window.open('', '_blank');

    setEnviando(true);
    const itens: ItemPedido[] = cart.map(i => {
      const p = produtos.find(x => x.id === i.id)!;
      return { nome: p.nome, qtd: i.qtd, preco: p.preco, obs: i.obs || undefined };
    });

    const { error } = await supabase.from('pedidos').insert({
      cliente_nome: nome,
      cliente_telefone: telefone,
      itens,
      tipo_entrega: entrega,
      bairro_nome: entrega === 'entrega' ? (bairroSelecionado?.nome || null) : null,
      taxa_entrega: taxaEntrega,
      endereco: entrega === 'entrega' ? endereco : null,
      referencia: entrega === 'entrega' ? referencia : null,
      forma_pagamento: pagamento,
      total: totalFinal,
      pago: false,
      status: 'Aguardando aprovação',
    });

    if (error) {
      showToast('Erro ao enviar pedido. Tente novamente.');
      setEnviando(false);
      if (janelaWhats) janelaWhats.close();
      return;
    }

    const agora = new Date();
    const dataFmt = agora.toLocaleDateString('pt-BR');
    const horaFmt = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let msg = `🌙 *Olá! Seja bem-vindo(a) ao Mil e Uma Noites!* 🌙\n`;
    msg += `Que alegria receber seu pedido, ${nome.split(' ')[0]}! Aqui está o resumo:\n\n`;
    msg += `✅ *Pedido recebido!*\n`;
    msg += `📅 ${dataFmt} às ${horaFmt}\n\n`;
    msg += `*Itens:*\n`;
    itens.forEach(i => {
      msg += `➡️ ${i.qtd}x ${i.nome} — ${brl(i.preco * i.qtd)}\n`;
      if (i.obs) msg += `   📝 Obs: ${i.obs}\n`;
    });
    msg += `\n👤 *Cliente:* ${nome}\n`;
    msg += `📱 *Celular:* ${telefone}\n`;
    msg += `💳 *Pagamento:* ${pagamento}\n\n`;
