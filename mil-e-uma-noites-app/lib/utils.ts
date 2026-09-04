import type { Horario, Configuracoes } from './types';

export function brl(v: number): string {
  return 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',');
}

export function formatPhone(w: string): string {
  const d = (w || '').replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return w;
}

export const DIAS_LABEL: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

export function getStatusAgora(config: Configuracoes, horarios: Horario[]) {
  if (config.modo_horario === 'aberto') return { aberto: true, label: 'Aberto (forçado)', hoje: null as string | null };
  if (config.modo_horario === 'fechado') return { aberto: false, label: 'Fechado (forçado)', hoje: null as string | null };

  const now = new Date();
  const diaSemana = now.getDay();
  const cfg = horarios.find(h => h.dia_semana === diaSemana);
  if (!cfg || !cfg.ativo) return { aberto: false, label: 'Fechado', hoje: null as string | null };

  const agoraMin = now.getHours() * 60 + now.getMinutes();

  function dentroDoIntervalo(abre: string, fecha: string): boolean {
    const [ah, am] = abre.split(':').map(Number);
    const [fh, fm] = fecha.split(':').map(Number);
    const abreMin = ah * 60 + am;
    const fechaMin = fh * 60 + fm;
    if (fechaMin <= abreMin) return agoraMin >= abreMin || agoraMin < fechaMin;
    return agoraMin >= abreMin && agoraMin < fechaMin;
  }

  const noPrimeiroTurno = dentroDoIntervalo(cfg.abre, cfg.fecha);
  const noSegundoTurno = cfg.turno2_ativo && dentroDoIntervalo(cfg.abre2, cfg.fecha2);
  const aberto = noPrimeiroTurno || noSegundoTurno;

  let hoje = `${cfg.abre} às ${cfg.fecha}`;
  if (cfg.turno2_ativo) hoje += ` e ${cfg.abre2} às ${cfg.fecha2}`;

  return { aberto, label: aberto ? 'Aberto' : 'Fechado', hoje };
}

export function getPrepAtual(config: Configuracoes): string {
  const dia = new Date().getDay();
  return (dia === 5 || dia === 6) ? config.prep_fim_semana : config.prep_semana;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function tocarSomNotificacao() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const tocarNota = (freq: number, inicio: number, duracao: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + inicio);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao);
      osc.connect(gain);
      gain.connect(ctx.destination);
            osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + duracao);
    };
    tocarNota(880, 0, 0.15);
    tocarNota(1175, 0.15, 0.25);
    tocarNota(880, 0.5, 0.15);
    tocarNota(1175, 0.65, 0.3);
  } catch (e) {
    // navegador pode bloquear áudio sem interação prévia; ignora silenciosamente
  }
}
