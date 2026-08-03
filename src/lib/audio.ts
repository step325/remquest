/**
 * Suoni chiptune generati sul momento.
 *
 * Nessun file audio: onde quadre e triangolari con un inviluppo, come le
 * facevano i chip sonori a 8 bit. Poche righe, niente da scaricare, e il
 * timbro e' automaticamente in tinta con il resto.
 *
 * Il contesto audio parte sospeso finche' l'utente non tocca *questa* pagina:
 * cliccare i pulsanti di RemNote non basta, perche' il widget vive in un
 * iframe suo. Da qui la regola: si accende con il pulsante nell'HUD, e quel
 * clic e' anche il gesto che sblocca il contesto.
 */

type Wave = 'square' | 'triangle';

interface Note {
  /** Frequenza in hertz */
  hz: number;
  /** Da quando parte, in secondi dall'inizio del suono */
  at: number;
  /** Quanto dura, in secondi */
  len: number;
  wave?: Wave;
}

/** Volume di picco: i suoni accompagnano lo studio, non lo interrompono */
const GAIN = 0.06;

/** Le melodie, una per tipo di evento */
const SOUNDS: Record<string, Note[]> = {
  // Colpo secco e breve
  hit: [{ hz: 620, at: 0, len: 0.05 }],
  // Critico: due note che salgono, la seconda piu' lunga
  crit: [
    { hz: 700, at: 0, len: 0.05 },
    { hz: 1050, at: 0.05, len: 0.12 },
  ],
  // Errore: scende, e si sente che e' andata male
  miss: [
    { hz: 300, at: 0, len: 0.07, wave: 'triangle' },
    { hz: 190, at: 0.07, len: 0.13, wave: 'triangle' },
  ],
  // Arpeggio di vittoria
  levelup: [
    { hz: 523, at: 0, len: 0.09 },
    { hz: 659, at: 0.09, len: 0.09 },
    { hz: 784, at: 0.18, len: 0.09 },
    { hz: 1047, at: 0.27, len: 0.22 },
  ],
  mission: [
    { hz: 784, at: 0, len: 0.07 },
    { hz: 1047, at: 0.07, len: 0.14 },
  ],
  bossdown: [
    { hz: 392, at: 0, len: 0.1 },
    { hz: 523, at: 0.1, len: 0.1 },
    { hz: 659, at: 0.2, len: 0.1 },
    { hz: 880, at: 0.3, len: 0.3 },
  ],
  streak: [
    { hz: 880, at: 0, len: 0.06 },
    { hz: 1175, at: 0.06, len: 0.12 },
  ],
};

let context: AudioContext | null = null;

/** Il contesto audio, creato alla prima richiesta */
function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/**
 * Sblocca l'audio. Va chiamata da un gestore di clic: e' il gesto dell'utente
 * che il browser aspetta prima di lasciar suonare qualcosa.
 */
export function unlockAudio(): void {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** Suona la melodia di un evento; senza melodia non fa niente */
export function playSound(kind: string): void {
  const notes = SOUNDS[kind];
  const ctx = audioContext();
  if (!notes || !ctx || ctx.state !== 'running') return;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.wave ?? 'square';
    osc.frequency.value = note.hz;

    // Inviluppo a spigoli: attacco immediato e coda che scende, il taglio
    // netto del suono a 8 bit. Senza, ogni nota finirebbe con uno scatto.
    const start = ctx.currentTime + note.at;
    gain.gain.setValueAtTime(GAIN, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.len);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.len);
  }
}
