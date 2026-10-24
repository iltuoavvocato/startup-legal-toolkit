import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';

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

// Option values in display order; the copy (question text, help, labels) comes from the dictionaries.
const STRUCTURE: { id: QuestionId; options: string[] }[] = [
  { id: 'fondatori', options: ['solo', 'due', 'tre'] },
  { id: 'societa', options: ['no', 'srl', 'innovativa', 'nonso'] },
  { id: 'accordi', options: ['si', 'no', 'voce'] },
  { id: 'investimenti', options: ['si', 'forse', 'no'] },
  { id: 'equity', options: ['si', 'no'] },
  { id: 'ip', options: ['si', 'no', 'nonso'] },
  { id: 'uscita', options: ['si', 'no'] },
];

export function getQuestions(locale: Locale = 'it'): QuizQuestion[] {
  const q = MESSAGES[locale].quiz.questions;
  return STRUCTURE.map(({ id, options }) => {
    const copy = q[id];
    const labels = copy.options as Record<string, string>;
    return {
      id,
      text: copy.text,
      ...(copy.help ? { help: copy.help } : {}),
      options: options.map((value) => ({ value, label: labels[value]! })),
    };
  });
}

/** Italian questions (default locale). */
export const QUESTIONS: readonly QuizQuestion[] = getQuestions('it');

export type Answers = Partial<Record<QuestionId, string>>;

export type DocumentId = 'patti' | 'vesting' | 'safe' | 'wfe' | 'ip';
export type Priority = 'prioritario' | 'consigliato' | 'valutare';

export const PRIORITY_LABELS: Record<Priority, string> = MESSAGES.it.quiz.priorities;

const PRIORITY_RANK: Record<Priority, number> = { prioritario: 0, consigliato: 1, valutare: 2 };

export const DOCUMENTS: Record<DocumentId, { title: string; what: string }> = MESSAGES.it.quiz.documents;

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

function trigger(id: QuestionId, answers: Answers, questions: readonly QuizQuestion[]): Trigger {
  const q = questions.find((x) => x.id === id)!;
  const value = answers[id];
  const option = q.options.find((o) => o.value === value);
  return { question: q.text, answer: option?.label ?? '—' };
}

export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => q.options.some((o) => o.value === answers[q.id]));
}

/** Returns the personalized checklist, sorted by priority (then by a fixed document order). */
export function getRecommendations(answers: Answers, locale: Locale = 'it'): Recommendation[] {
  const { documents, why: W } = MESSAGES[locale].quiz;
  const questions = getQuestions(locale);
  const recs: Recommendation[] = [];
  const add = (id: DocumentId, priority: Priority, why: string, triggerIds: QuestionId[]) =>
    recs.push({
      id,
      priority,
      why,
      title: documents[id].title,
      what: documents[id].what,
      triggers: triggerIds.map((t) => trigger(t, answers, questions)),
    });

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
          ? W.pattiVoce
          : W.pattiNo,
        ['fondatori', 'accordi'],
      );
    } else {
      add(
        'patti',
        investors ? 'consigliato' : 'valutare',
        investors
          ? W.pattiInvestors
          : W.pattiCheck,
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
        W.vestingNoExit,
        ['fondatori', 'uscita'],
      );
    } else {
      add(
        'vesting',
        'valutare',
        W.vestingCheck,
        ['fondatori', 'uscita'],
      );
    }
  } else if (investors || maybeInvestors) {
    add(
      'vesting',
      'valutare',
      W.vestingSolo,
      ['fondatori', 'investimenti'],
    );
  }

  // SAFE
  if (investors || maybeInvestors) {
    const base = investors
      ? W.safeSoon
      : W.safeMaybe;
    add(
      'safe',
      investors ? 'prioritario' : 'consigliato',
      notIncorporated ? `${base} ${W.safeIncorporate}` : base,
      notIncorporated ? ['investimenti', 'societa'] : ['investimenti'],
    );
  }

  // Work for equity
  if (equityCollaborators) {
    add(
      'wfe',
      'prioritario',
      W.wfe,
      ['equity'],
    );
  }

  // IP
  if (answers.ip === 'si') {
    add(
      'ip',
      'prioritario',
      W.ipBefore,
      ['ip'],
    );
  } else if (answers.ip === 'nonso') {
    add(
      'ip',
      'consigliato',
      W.ipUnknown,
      ['ip'],
    );
  } else if (equityCollaborators) {
    add(
      'ip',
      'consigliato',
      W.ipCollaborators,
      ['equity'],
    );
  } else if (investors) {
    add(
      'ip',
      'valutare',
      W.ipInvestors,
      ['investimenti'],
    );
  }

  return recs.sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || DOCUMENT_ORDER.indexOf(a.id) - DOCUMENT_ORDER.indexOf(b.id),
  );
}

/** Plain-text checklist for the clipboard. */
export function checklistText(recs: Recommendation[], locale: Locale = 'it'): string {
  const m = MESSAGES[locale];
  const lines = [m.quiz.checklist.heading, ''];
  if (recs.length === 0) {
    lines.push(m.quiz.checklist.none);
  }
  recs.forEach((r, i) => {
    lines.push(`${i + 1}. [${m.quiz.priorities[r.priority]}] ${r.title}`);
    lines.push(`   ${r.why}`);
  });
  lines.push('', m.common.disclaimer);
  return lines.join('\n');
}
