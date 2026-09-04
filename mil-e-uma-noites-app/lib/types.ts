export interface Categoria {
  id: string;
  nome: string;
  imagem_url: string | null;
  ordem: number;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  tag_texto: string | null;
  destacar_lancamento: boolean;
  ativo: boolean;
}

export interface Bairro {
  id: string;
  nome: string;
  taxa: number;
  ordem: number;
}

export interface Configuracoes {
  id: number;
  pix_key: string;
  whatsapp: string;
  instagram: string;
  modo_horario: 'auto' | 'aberto' | 'fechado';
  prep_semana: string;
  prep_fim_semana: string;
}

export interface Horario {
  dia_semana: number; // 0 domingo .. 6 sábado
  ativo: boolean;
  abre: string; // "18:00"
  fecha: string; // "23:59"
  turno2_ativo: boolean;
  abre2: string;
  fecha2: string;
}

export interface ItemPedido {
  nome: string;
  qtd: number;
  preco: number;
}

export interface Pedido {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  itens: ItemPedido[];
  tipo_entrega: 'entrega' | 'retirada';
  bairro_nome: string | null;
  taxa_entrega: number;
  endereco: string | null;
  referencia: string | null;
  forma_pagamento: string;
  total: number;
  pago: boolean;
  status: string;
  criado_em: string;
}
