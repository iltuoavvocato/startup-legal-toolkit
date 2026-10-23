// Double opt-in: an intro happens only if both sides say yes, and a "no" is never revealed to the other side.
import { formatEuro } from './format';
import { FASE_LABEL, REGIONE_LABEL, SETTORE_LABEL, TIPO_LABEL, type Investor, type StartupProfile } from './matchTaxonomy';

export const PRODUCT_NAME = 'MatchInvStar';

export type OptInState = 'proposta' | 'attesa-startup' | 'chiusa-investitore' | 'chiusa-startup' | 'intro';
export type OptInEvent = 'INVESTOR_YES' | 'INVESTOR_NO' | 'STARTUP_YES' | 'STARTUP_NO' | 'RESET';
export type Side = 'investitore' | 'startup';

const TRANSITIONS: Record<OptInState, Partial<Record<OptInEvent, OptInState>>> = {
  proposta: { INVESTOR_YES: 'attesa-startup', INVESTOR_NO: 'chiusa-investitore' },
  'attesa-startup': { STARTUP_YES: 'intro', STARTUP_NO: 'chiusa-startup' },
  'chiusa-investitore': {},
  'chiusa-startup': {},
  intro: {},
};

/** Pure transition. Events that don't apply to the current state are ignored (same state returned). */
export function transition(state: OptInState, event: OptInEvent): OptInState {
  if (event === 'RESET') return 'proposta';
  return TRANSITIONS[state][event] ?? state;
}

export const STATE_STEPS: { state: OptInState; label: string }[] = [
  { state: 'proposta', label: 'Proposta all’investitore' },
  { state: 'attesa-startup', label: 'Richiesta alla startup' },
  { state: 'intro', label: 'Intro' },
];

export type SideAction = { event: OptInEvent; label: string; variant: 'primary' | 'secondary' };

export interface SideView {
  /** What this side sees: teaser (anonymous startup), investor card, intro email or a status message. */
  kind: 'teaser' | 'richiesta' | 'stato' | 'intro';
  titolo: string;
  testo: string;
  azioni: SideAction[];
  /** Whether this side currently knows who the other party is. */
  conosceNome: boolean;
}

const NEUTRAL_STARTUP: SideView = {
  kind: 'stato',
  titolo: 'Il tuo profilo è attivo',
  testo: 'Ti scriveremo solo se c’è un interesse reciproco. Nel frattempo non devi fare nulla.',
  azioni: [],
  conosceNome: false,
};

const WAITING_INVESTOR: SideView = {
  kind: 'stato',
  titolo: 'Interesse inviato',
  testo: 'Riceverai un’intro solo se anche la startup accetta. Fino ad allora il nome della startup resta riservato.',
  azioni: [],
  conosceNome: false,
};

/**
 * What each side sees in each state. A "no" is indistinguishable from silence:
 * the startup sees the same thing whether the investor said no or hasn't answered yet,
 * and the investor sees the same thing whether the startup said no or hasn't answered yet.
 */
export function viewFor(state: OptInState, side: Side): SideView {
  if (state === 'intro') {
    return {
      kind: 'intro',
      titolo: 'Intro inviata',
      testo: 'Avete detto sì entrambi: ecco l’email che vi presenta. Da qui in poi la conversazione è vostra.',
      azioni: [],
      conosceNome: true,
    };
  }
  if (side === 'investitore') {
    switch (state) {
      case 'proposta':
        return {
          kind: 'teaser',
          titolo: 'Una startup in linea con la tua tesi',
          testo: 'Vedi solo settore, regione, fase, importo e una frase di presentazione. Il nome arriva solo con l’intro.',
          azioni: [
            { event: 'INVESTOR_YES', label: 'Sì, mi interessa', variant: 'primary' },
            { event: 'INVESTOR_NO', label: 'No, grazie', variant: 'secondary' },
          ],
          conosceNome: false,
        };
      case 'chiusa-investitore':
        return {
          kind: 'stato',
          titolo: 'Va bene, non te la riproporremo',
          testo: 'La startup non riceverà alcuna notifica del tuo rifiuto.',
          azioni: [],
          conosceNome: false,
        };
      case 'attesa-startup':
      case 'chiusa-startup':
        return WAITING_INVESTOR;
    }
  }
  switch (state) {
    case 'attesa-startup':
      return {
        kind: 'richiesta',
        titolo: 'Un investitore vorrebbe conoscerti',
        testo: 'Ha già detto sì. Se accetti anche tu, vi mandiamo un’email di presentazione. Se dici di no, non lo saprà.',
        azioni: [
          { event: 'STARTUP_YES', label: 'Accetta l’intro', variant: 'primary' },
          { event: 'STARTUP_NO', label: 'Non ora', variant: 'secondary' },
        ],
        conosceNome: true,
      };
    case 'chiusa-startup':
      return {
        kind: 'stato',
        titolo: 'Hai rifiutato l’intro',
        testo: 'L’investitore non riceverà alcuna notifica del rifiuto.',
        azioni: [],
        conosceNome: true,
      };
    case 'proposta':
    case 'chiusa-investitore':
      return NEUTRAL_STARTUP;
  }
}

export interface Teaser {
  settore: string;
  regione: string;
  fase: string;
  importo: string;
  oneLiner: string;
}

/** Anonymous teaser: no startup name, no founder name, no contact. */
export function teaserOf(s: Pick<StartupProfile, 'settore' | 'regione' | 'fase' | 'round' | 'oneLiner'>): Teaser {
  return {
    settore: SETTORE_LABEL[s.settore],
    regione: REGIONE_LABEL[s.regione],
    fase: FASE_LABEL[s.fase],
    importo: formatEuro(s.round),
    oneLiner: s.oneLiner,
  };
}

export interface IntroEmail {
  da: string;
  a: string[];
  oggetto: string;
  corpo: string[];
}

export function introEmail(s: StartupProfile, i: Investor): IntroEmail {
  return {
    da: `${PRODUCT_NAME} <intro@matchinvstar.example>`,
    a: [`${s.founder} <${s.email}>`, `${i.referente} <${i.email}>`],
    oggetto: `Intro: ${s.nome} ↔ ${i.nome} (via ${PRODUCT_NAME})`,
    corpo: [
      `Ciao ${s.founder}, ciao ${i.referente},`,
      `avete detto sì entrambi, quindi vi presentiamo. ${s.founder} ha fondato ${s.nome} (${SETTORE_LABEL[s.settore]}, ${REGIONE_LABEL[s.regione]}), in fase ${FASE_LABEL[s.fase]}, che cerca ${formatEuro(s.round)}: ${s.oneLiner}`,
      `${i.referente} segue ${i.nome} (${TIPO_LABEL[i.tipo]}). ${i.tesi}`,
      'Vi lasciamo continuare in autonomia: rispondete pure a tutti per fissare una prima chiamata.',
      `Questa email è solo una presentazione: ${PRODUCT_NAME} non dà consulenza sugli investimenti, non valuta la startup e non gestisce denaro.`,
      `Il team ${PRODUCT_NAME} (nome provvisorio)`,
    ],
  };
}

// ---------- Monthly proposal limit ----------

/** Max proposals the agent sends on behalf of one startup per calendar month. Valore provvisorio. */
export const MONTHLY_PROPOSAL_LIMIT = 5;

export interface ProposalCounter {
  /** 'YYYY-MM' */
  month: string;
  used: number;
}

/** Returns the counter for `month`, starting from zero when the month changes. */
export function counterFor(month: string, prev?: ProposalCounter): ProposalCounter {
  return prev && prev.month === month ? prev : { month, used: 0 };
}

export function remaining(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT): number {
  return Math.max(0, limit - c.used);
}

export function canPropose(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT): boolean {
  return remaining(c, limit) > 0;
}

export type ConsumeResult = { ok: true; counter: ProposalCounter } | { ok: false; reason: string; counter: ProposalCounter };

export function consume(c: ProposalCounter, limit = MONTHLY_PROPOSAL_LIMIT): ConsumeResult {
  if (!canPropose(c, limit)) {
    return {
      ok: false,
      counter: c,
      reason: `Hai raggiunto il limite di ${limit} proposte per questo mese (valore provvisorio).`,
    };
  }
  return { ok: true, counter: { month: c.month, used: c.used + 1 } };
}

/** 'YYYY-MM' for a date (local time). */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
