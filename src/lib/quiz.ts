export type QuestionId = 'fondatori' | 'societa' | 'accordi' | 'investimenti' | 'equity' | 'ip' | 'uscita';

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: QuestionId;
  text: string;
  help?: string;
  options: QuizOption[];
}

export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'fondatori',
    text: 'Quanti siete a fondare la startup?',
    options: [
      { value: 'solo', label: 'Da solo' },
      { value: 'due', label: 'Siamo in 2' },
      { value: 'tre', label: 'Siamo in 3 o più' },
    ],
  },
  {
    id: 'societa',
    text: 'Avete già costituito la società?',
    options: [
      { value: 'no', label: 'No, non ancora' },
      { value: 'srl', label: 'Sì, una s.r.l.' },
      { value: 'innovativa', label: 'Sì, una startup innovativa' },
      { value: 'nonso', label: 'Non so' },
    ],
  },
  {
    id: 'accordi',
    text: 'Avete messo per iscritto come dividere quote e ruoli?',
    help: 'Se fondi da solo, pensa agli accordi con eventuali soci futuri.',
    options: [
      { value: 'si', label: 'Sì, è tutto per iscritto' },
      { value: 'no', label: 'No' },
      { value: 'voce', label: 'Solo a voce' },
    ],
  },
  {
    id: 'investimenti',
    text: 'Pensate di raccogliere investimenti nei prossimi 12 mesi?',
    help: 'Per esempio da business angel o in un round pre-seed.',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'forse', label: 'Forse' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'equity',
    text: 'Ci sono collaboratori, advisor o dipendenti che vorreste pagare (anche) in equity?',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'ip',
    text: 'Codice, brand, design o altri asset sono stati creati prima della società o da singoli founder o freelance?',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
      { value: 'nonso', label: 'Non so' },
    ],
  },
  {
    id: 'uscita',
    text: 'Cosa succede se uno di voi lascia il progetto: l’avete previsto?',
    help: 'Se fondi da solo, pensa a cosa succederebbe con soci o collaboratori che entrano in futuro.',
    options: [
      { value: 'si', label: 'Sì, l’abbiamo previsto' },
      { value: 'no', label: 'No' },
    ],
  },
] as const;

export type Answers = Partial<Record<QuestionId, string>>;

export type DocumentId = 'patti' | 'vesting' | 'safe' | 'wfe' | 'ip';
export type Priority = 'prioritario' | 'consigliato' | 'valutare';

export const PRIORITY_LABELS: Record<Priority, string> = {
  prioritario: 'Prioritario',
  consigliato: 'Consigliato',
  valutare: 'Da valutare',
};

const PRIORITY_RANK: Record<Priority, number> = { prioritario: 0, consigliato: 1, valutare: 2 };

export const DOCUMENTS: Record<DocumentId, { title: string; what: string }> = {
  patti: {
    title: 'Patti tra fondatori',
    what: 'Un accordo scritto tra i soci fondatori (spesso un patto parasociale) che fissa quote, ruoli, decisioni importanti e cosa succede se qualcuno esce.',
  },
  vesting: {
    title: 'Clausole di vesting (good/bad leaver)',
    what: 'Regole per cui le quote si “guadagnano” nel tempo: chi lascia presto conserva solo la parte maturata. In una s.r.l. di solito si realizzano con patti parasociali, opzioni call o clausole statutarie.',
  },
  safe: {
    title: 'SAFE (o strumento equivalente per investitori)',
    what: 'Uno strumento con cui l’investitore versa denaro oggi e riceve quote in un round futuro. In Italia non è un contratto tipico: va adattato al diritto italiano e alla forma della società (s.r.l. o startup innovativa).',
  },
  wfe: {
    title: 'Accordo di work for equity',
    what: 'Un contratto che regola chi lavora per la startup ricevendo, in tutto o in parte, quote invece di un compenso: quanto, a quali condizioni e con quali tempi.',
  },
  ip: {
    title: 'Cessione e tutela della proprietà intellettuale',
    what: 'Documenti che trasferiscono alla società i diritti su codice, marchio, design e contenuti, e che ne proteggono il valore.',
  },
};

const DOCUMENT_ORDER: DocumentId[] = ['patti', 'vesting', 'safe', 'wfe', 'ip'];

export interface Trigger {
  question: string;
  answer: string;
}

export interface Recommendation {
  id: DocumentId;
  title: string;
  priority: Priority;
  what: string;
  why: string;
  triggers: Trigger[];
}

function trigger(id: QuestionId, answers: Answers): Trigger {
  const q = QUESTIONS.find((x) => x.id === id)!;
  const value = answers[id];
  const option = q.options.find((o) => o.value === value);
  return { question: q.text, answer: option?.label ?? '—' };
}

export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => q.options.some((o) => o.value === answers[q.id]));
}

/** Returns the personalized checklist, sorted by priority (then by a fixed document order). */
export function getRecommendations(answers: Answers): Recommendation[] {
  const recs: Recommendation[] = [];
  const add = (id: DocumentId, priority: Priority, why: string, triggerIds: QuestionId[]) =>
    recs.push({ id, priority, why, title: DOCUMENTS[id].title, what: DOCUMENTS[id].what, triggers: triggerIds.map((t) => trigger(t, answers)) });

  const team = answers.fondatori === 'due' || answers.fondatori === 'tre';
  const investors = answers.investimenti === 'si';
  const maybeInvestors = answers.investimenti === 'forse';
  const notIncorporated = answers.societa === 'no' || answers.societa === 'nonso';
  const equityCollaborators = answers.equity === 'si';

  // Patti tra fondatori
  if (team) {
    if (answers.accordi === 'no' || answers.accordi === 'voce') {
      add(
        'patti',
        'prioritario',
        answers.accordi === 'voce'
          ? 'Gli accordi presi solo a voce sono difficili da dimostrare e facili da ricordare in modo diverso. Metterli per iscritto adesso, quando siete d’accordo, è molto più semplice che farlo durante un disaccordo.'
          : 'Siete più fondatori e non c’è ancora nulla di scritto su quote e ruoli. È la base su cui poggiano tutti gli altri documenti.',
        ['fondatori', 'accordi'],
      );
    } else {
      add(
        'patti',
        investors ? 'consigliato' : 'valutare',
        investors
          ? 'Avete già degli accordi scritti: con l’arrivo di investitori conviene verificare che coprano governance, trasferimento delle quote e uscita dei soci.'
          : 'Avete già degli accordi scritti: vale la pena verificare che siano completi e aggiornati rispetto a come sta crescendo il progetto.',
        investors ? ['fondatori', 'accordi', 'investimenti'] : ['fondatori', 'accordi'],
      );
    }
  }

  // Vesting
  if (team) {
    if (answers.uscita === 'no') {
      add(
        'vesting',
        'prioritario',
        'Siete più fondatori e non avete previsto cosa succede se uno di voi lascia. Senza vesting, chi esce dopo pochi mesi potrebbe tenere tutte le sue quote.',
        ['fondatori', 'uscita'],
      );
    } else {
      add(
        'vesting',
        'valutare',
        'Avete già pensato all’uscita di un socio: conviene controllare che le regole siano scritte in modo vincolante e che distinguano tra good e bad leaver.',
        ['fondatori', 'uscita'],
      );
    }
  } else if (investors || maybeInvestors) {
    add(
      'vesting',
      'valutare',
      'Anche chi fonda da solo può sentirsi chiedere dagli investitori un vesting sulle proprie quote, a garanzia del suo impegno nel progetto.',
      ['fondatori', 'investimenti'],
    );
  }

  // SAFE
  if (investors || maybeInvestors) {
    const base = investors
      ? 'Pensate di raccogliere investimenti a breve: serve uno strumento chiaro per regolare l’ingresso degli investitori.'
      : 'Un round è possibile: conoscere in anticipo come funziona uno strumento tipo SAFE vi farà arrivare preparati.';
    add(
      'safe',
      investors ? 'prioritario' : 'consigliato',
      notIncorporated ? `${base} Di solito, per usarlo, la società deve essere già costituita.` : base,
      notIncorporated ? ['investimenti', 'societa'] : ['investimenti'],
    );
  }

  // Work for equity
  if (equityCollaborators) {
    add(
      'wfe',
      'prioritario',
      'Volete pagare qualcuno (anche) in quote. Senza un accordo scritto è facile che nascano dubbi su quante quote spettino, quando e a quali condizioni.',
      ['equity'],
    );
  }

  // IP
  if (answers.ip === 'si') {
    add(
      'ip',
      'prioritario',
      'Alcuni asset sono nati prima della società o sono stati creati da singole persone: in genere i diritti restano a chi li ha creati finché non vengono ceduti per iscritto alla società.',
      ['ip'],
    );
  } else if (answers.ip === 'nonso') {
    add(
      'ip',
      'consigliato',
      'Non è chiaro chi abbia creato codice, brand o design: conviene ricostruirlo e, se serve, formalizzare la cessione dei diritti alla società.',
      ['ip'],
    );
  } else if (equityCollaborators) {
    add(
      'ip',
      'consigliato',
      'Chi collabora in cambio di equity crea spesso codice o contenuti: l’accordo dovrebbe prevedere che i diritti su ciò che realizza passino alla società.',
      ['equity'],
    );
  } else if (investors) {
    add(
      'ip',
      'valutare',
      'Gli investitori di solito verificano che la società sia titolare di codice, marchio e altri asset: meglio avere tutto in ordine prima della due diligence.',
      ['investimenti'],
    );
  }

  return recs.sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || DOCUMENT_ORDER.indexOf(a.id) - DOCUMENT_ORDER.indexOf(b.id),
  );
}

/** Plain-text checklist for the clipboard. */
export function checklistText(recs: Recommendation[]): string {
  const lines = ['Quali documenti mi servono? — Startup Legal Toolkit (ilTuoAvvocato.com)', ''];
  if (recs.length === 0) {
    lines.push('Per ora nessun documento risulta urgente in base alle risposte date.');
  }
  recs.forEach((r, i) => {
    lines.push(`${i + 1}. [${PRIORITY_LABELS[r.priority]}] ${r.title}`);
    lines.push(`   ${r.why}`);
  });
  lines.push('', 'Strumento indicativo: non sostituisce una consulenza legale.');
  return lines.join('\n');
}
