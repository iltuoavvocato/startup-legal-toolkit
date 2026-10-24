// Quiz content: questions, documents, recommendation reasons and page copy. Keys are shared with src/lib/quiz.ts.
const it = {
  questions: {
    fondatori: {
      text: 'Quanti siete a fondare la startup?',
      help: '',
      options: { solo: 'Da solo', due: 'Siamo in 2', tre: 'Siamo in 3 o più' },
    },
    societa: {
      text: 'Avete già costituito la società?',
      help: '',
      options: { no: 'No, non ancora', srl: 'Sì, una s.r.l.', innovativa: 'Sì, una startup innovativa', nonso: 'Non so' },
    },
    accordi: {
      text: 'Avete messo per iscritto come dividere quote e ruoli?',
      help: 'Se fondi da solo, pensa agli accordi con eventuali soci futuri.',
      options: { si: 'Sì, è tutto per iscritto', no: 'No', voce: 'Solo a voce' },
    },
    investimenti: {
      text: 'Pensate di raccogliere investimenti nei prossimi 12 mesi?',
      help: 'Per esempio da business angel o in un round pre-seed.',
      options: { si: 'Sì', forse: 'Forse', no: 'No' },
    },
    equity: {
      text: 'Ci sono collaboratori, advisor o dipendenti che vorreste pagare (anche) in equity?',
      help: '',
      options: { si: 'Sì', no: 'No' },
    },
    ip: {
      text: 'Codice, brand, design o altri asset sono stati creati prima della società o da singoli founder o freelance?',
      help: '',
      options: { si: 'Sì', no: 'No', nonso: 'Non so' },
    },
    uscita: {
      text: 'Cosa succede se uno di voi lascia il progetto: l’avete previsto?',
      help: 'Se fondi da solo, pensa a cosa succederebbe con soci o collaboratori che entrano in futuro.',
      options: { si: 'Sì, l’abbiamo previsto', no: 'No' },
    },
  },
  priorities: { prioritario: 'Prioritario', consigliato: 'Consigliato', valutare: 'Da valutare' },
  documents: {
    patti: {
      title: 'Patti tra fondatori',
      what: 'Un accordo scritto tra i soci fondatori (spesso un patto parasociale) che fissa quote, ruoli, decisioni importanti e cosa succede se qualcuno esce.',
    },
    vesting: {
      title: 'Clausole di vesting (good/bad leaver)',
      what: 'Regole in base alle quali le quote maturano nel tempo: chi lascia presto conserva solo la parte maturata. In una s.r.l. di solito si realizzano con patti parasociali, opzioni call o clausole statutarie.',
    },
    safe: {
      title: 'SAFE (o strumento equivalente per investitori)',
      what: 'Uno strumento con cui l’investitore versa denaro oggi e riceve quote in un round futuro. In Italia non è un contratto tipico: va adattato al diritto italiano e alla forma della società (s.r.l. o startup innovativa).',
    },
    wfe: {
      title: 'Accordo di work for equity',
      what: 'Un contratto per chi lavora per la startup ricevendo, in tutto o in parte, quote al posto di un compenso: stabilisce quante quote, a quali condizioni e con quali tempi.',
    },
    ip: {
      title: 'Cessione e tutela della proprietà intellettuale',
      what: 'Documenti che trasferiscono alla società i diritti su codice, marchio, design e contenuti, e che ne proteggono il valore.',
    },
  },
  why: {
    pattiVoce:
      'Gli accordi presi solo a voce sono difficili da dimostrare e ognuno tende a ricordarli a modo suo. Metterli per iscritto adesso, mentre siete d’accordo, è molto più semplice che farlo durante un disaccordo.',
    pattiNo:
      'La startup ha più fondatori e non c’è ancora nulla di scritto su quote e ruoli. I patti tra fondatori sono la base su cui poggiano tutti gli altri documenti.',
    pattiInvestors:
      'Avete già degli accordi scritti: con l’arrivo di investitori conviene verificare che coprano governance, trasferimento delle quote e uscita dei soci.',
    pattiCheck:
      'Avete già degli accordi scritti: vale la pena verificare che siano completi e aggiornati rispetto a come sta crescendo il progetto.',
    vestingNoExit:
      'La startup ha più fondatori e non avete previsto cosa succede se uno di voi lascia. Senza vesting, chi esce dopo pochi mesi potrebbe tenere tutte le sue quote.',
    vestingCheck:
      'Avete già pensato all’uscita di un socio: conviene controllare che le regole siano scritte in modo vincolante e che distinguano tra good e bad leaver.',
    vestingSolo:
      'Anche a chi fonda da solo gli investitori possono chiedere un vesting sulle proprie quote, a garanzia dell’impegno nel progetto.',
    safeSoon:
      'Pensate di raccogliere investimenti a breve: serve uno strumento chiaro per regolare l’ingresso degli investitori.',
    safeMaybe:
      'Un round è possibile: sapere in anticipo come funziona uno strumento come il SAFE vi permetterà di arrivare preparati.',
    safeIncorporate: 'Di solito, per usarlo, la società deve essere già costituita.',
    wfe: 'Volete pagare qualcuno (anche) in quote. Senza un accordo scritto è facile che nascano dubbi su quante quote spettino, quando e a quali condizioni.',
    ipBefore:
      'Alcuni asset sono nati prima della società o sono stati creati da singole persone: in genere i diritti restano a chi li ha creati finché non vengono ceduti per iscritto alla società.',
    ipUnknown:
      'Non è chiaro chi abbia creato codice, brand o design: conviene ricostruirlo e, se serve, formalizzare la cessione dei diritti alla società.',
    ipCollaborators:
      'Chi collabora in cambio di equity crea spesso codice o contenuti: l’accordo dovrebbe prevedere che i diritti su ciò che realizza passino alla società.',
    ipInvestors:
      'Gli investitori di solito verificano che la società sia titolare di codice, marchio e altri asset: meglio avere tutto in ordine prima della due diligence.',
  },
  checklist: {
    heading: 'Quali documenti mi servono? — Startup Legal Toolkit (ilTuoAvvocato.com)',
    none: 'Per ora nessun documento risulta urgente in base alle risposte date.',
  },
  page: {
    title: 'Quali documenti *mi servono?*',
    lead: 'Sette domande veloci sulla tua startup. Alla fine ricevi una checklist dei documenti legali da cui partire, con il motivo per cui ti servono.',
    resultEyebrow: (tool: string) => `${tool} · risultato`,
    resultLead: 'Ecco la tua checklist personalizzata, ordinata per priorità.',
    resultLeadEmpty: 'Ecco cosa emerge dalle tue risposte.',
    resultTitle: (n: number) => `La tua checklist: ${n} ${n === 1 ? 'documento' : 'documenti'}`,
    emptyTitle: 'Per ora nessun documento urgente',
    empty1:
      'Dalle tue risposte non emerge un documento da preparare subito. Tieni d’occhio la proprietà intellettuale: se qualcuno, anche un freelance, crea codice, marchio o design per il progetto, conviene che i diritti vengano ceduti alla società.',
    empty2:
      'Rifai il quiz quando le cose cambiano: un nuovo socio, un collaboratore pagato in equity o un round di investimento sono i momenti giusti.',
    whyLabel: 'Perché ti riguarda.',
    triggersLabel: 'Risposte che lo hanno fatto emergere',
    copy: 'Copia checklist',
    restart: 'Rifai il quiz',
    ctaTitle: 'Vuoi preparare questi documenti?',
    ctaText:
      'ilTuoAvvocato.com offre servizi legali online per startup: SAFE, patti tra fondatori, work for equity, vesting e tutela della proprietà intellettuale.',
    step: (n: number, total: number) => `Domanda ${n} di ${total}`,
    back: 'Indietro',
    next: 'Avanti',
    seeResults: 'Vedi i risultati',
  },
};

export type QuizMessages = typeof it;

const en: QuizMessages = {
  questions: {
    fondatori: {
      text: 'How many of you are founding the startup?',
      help: '',
      options: { solo: 'Just me', due: 'Two of us', tre: 'Three or more' },
    },
    societa: {
      text: 'Have you already incorporated the company?',
      help: '',
      options: {
        no: 'No, not yet',
        srl: 'Yes, an S.r.l. (limited liability company)',
        innovativa: 'Yes, an innovative startup (startup innovativa)',
        nonso: 'I don’t know',
      },
    },
    accordi: {
      text: 'Have you put in writing how equity and roles are split?',
      help: 'If you’re a solo founder, think about agreements with any future co-founders.',
      options: { si: 'Yes, it’s all in writing', no: 'No', voce: 'Only verbally' },
    },
    investimenti: {
      text: 'Are you planning to raise investment in the next 12 months?',
      help: 'For example from business angels or in a pre-seed round.',
      options: { si: 'Yes', forse: 'Maybe', no: 'No' },
    },
    equity: {
      text: 'Are there collaborators, advisors or employees you’d like to pay (partly) in equity?',
      help: '',
      options: { si: 'Yes', no: 'No' },
    },
    ip: {
      text: 'Were code, brand, design or other assets created before the company existed, or by individual founders or freelancers?',
      help: '',
      options: { si: 'Yes', no: 'No', nonso: 'I don’t know' },
    },
    uscita: {
      text: 'What happens if one of you leaves the project: have you planned for it?',
      help: 'If you’re a solo founder, think about what would happen with co-founders or collaborators who join later.',
      options: { si: 'Yes, we’ve planned for it', no: 'No' },
    },
  },
  priorities: { prioritario: 'Priority', consigliato: 'Recommended', valutare: 'Worth considering' },
  documents: {
    patti: {
      title: 'Founders’ agreement',
      what: 'A written agreement between the founding shareholders (often a shareholders’ agreement, or patto parasociale) that sets out equity, roles, key decisions and what happens if someone leaves.',
    },
    vesting: {
      title: 'Vesting clauses (good/bad leaver)',
      what: 'Rules under which shares are earned over time: someone who leaves early keeps only the vested part. In an Italian S.r.l. they are usually implemented through shareholders’ agreements, call options or provisions in the articles of association.',
    },
    safe: {
      title: 'SAFE (or an equivalent investor instrument)',
      what: 'An instrument under which the investor pays money today and receives shares in a future round. In Italy it is not a contract type regulated by law: it has to be adapted to Italian law and to the company’s legal form (S.r.l. or innovative startup).',
    },
    wfe: {
      title: 'Work for equity agreement',
      what: 'A contract for people who work for the startup in exchange for shares, wholly or partly instead of pay: it sets out how many shares, on what terms and on what timeline.',
    },
    ip: {
      title: 'Intellectual property assignment and protection',
      what: 'Documents that transfer the rights to code, brand, design and content to the company, and protect their value.',
    },
  },
  why: {
    pattiVoce:
      'Verbal agreements are hard to prove and everyone tends to remember them their own way. Putting them in writing now, while you agree, is much easier than doing it in the middle of a disagreement.',
    pattiNo:
      'The startup has more than one founder and nothing is in writing yet on equity and roles. The founders’ agreement is the foundation every other document rests on.',
    pattiInvestors:
      'You already have written agreements: with investors coming in, it’s worth checking that they cover governance, share transfers and shareholders leaving.',
    pattiCheck:
      'You already have written agreements: it’s worth checking that they are complete and up to date with how the project is growing.',
    vestingNoExit:
      'The startup has more than one founder and you haven’t planned what happens if one of you leaves. Without vesting, someone who leaves after a few months could keep all their shares.',
    vestingCheck:
      'You’ve already thought about a co-founder leaving: it’s worth checking that the rules are written in a binding way and distinguish between good and bad leavers.',
    vestingSolo:
      'Investors may ask even a solo founder to vest their own shares, as a guarantee of their commitment to the project.',
    safeSoon:
      'You’re planning to raise investment soon: you need a clear instrument to govern how investors come in.',
    safeMaybe:
      'A round is possible: knowing in advance how an instrument like the SAFE works will help you arrive prepared.',
    safeIncorporate: 'To use it, the company usually needs to be incorporated already.',
    wfe: 'You want to pay someone (partly) in shares. Without a written agreement, doubts can easily arise about how many shares they are owed, when and on what terms.',
    ipBefore:
      'Some assets were created before the company or by individuals: the rights generally stay with whoever created them until they are assigned to the company in writing.',
    ipUnknown:
      'It isn’t clear who created the code, brand or design: it’s worth reconstructing it and, if needed, formalising the assignment of rights to the company.',
    ipCollaborators:
      'People working for equity often create code or content: the agreement should provide that the rights to what they produce pass to the company.',
    ipInvestors:
      'Investors usually check that the company owns its code, brand and other assets: better to have everything in order before due diligence.',
  },
  checklist: {
    heading: 'Which documents do I need? — Startup Legal Toolkit (ilTuoAvvocato.com)',
    none: 'Based on your answers, no document is urgent for now.',
  },
  page: {
    title: 'Which documents *do I need?*',
    lead: 'Seven quick questions about your startup. At the end you get a checklist of the legal documents to start with, and why you need them.',
    resultEyebrow: (tool: string) => `${tool} · result`,
    resultLead: 'Here is your personalised checklist, sorted by priority.',
    resultLeadEmpty: 'Here is what your answers show.',
    resultTitle: (n: number) => `Your checklist: ${n} ${n === 1 ? 'document' : 'documents'}`,
    emptyTitle: 'No urgent documents for now',
    empty1:
      'Your answers don’t point to a document you need to prepare right away. Keep an eye on intellectual property: if anyone, even a freelancer, creates code, a brand or a design for the project, the rights should be assigned to the company.',
    empty2:
      'Take the quiz again when things change: a new co-founder, a collaborator paid in equity or an investment round are the right moments.',
    whyLabel: 'Why it applies to you.',
    triggersLabel: 'Answers that brought it up',
    copy: 'Copy checklist',
    restart: 'Retake the quiz',
    ctaTitle: 'Want to prepare these documents?',
    ctaText:
      'ilTuoAvvocato.com offers online legal services for startups: SAFE, founders’ agreements, work for equity, vesting and intellectual property protection.',
    step: (n: number, total: number) => `Question ${n} of ${total}`,
    back: 'Back',
    next: 'Next',
    seeResults: 'See the results',
  },
};

export default { it, en };
