import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CopyButton } from '../components/CopyButton';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import { QUESTIONS, checklistText, getQuestions, getRecommendations, isComplete, type Answers } from '../lib/quiz';

function parseAnswers(q: URLSearchParams): Answers | null {
  const raw = q.get('r');
  if (!raw) return null;
  const parts = raw.split('.');
  const answers: Answers = {};
  QUESTIONS.forEach((question, i) => {
    if (question.options.some((o) => o.value === parts[i])) answers[question.id] = parts[i];
  });
  return isComplete(answers) ? answers : null;
}

export function QuizPage() {
  const { locale, t } = useI18n();
  const q = t.quiz.page;
  const questions = getQuestions(locale);
  const [initial] = useState(() => parseAnswers(readQuery()));
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const [step, setStep] = useState(initial ? QUESTIONS.length : 0);
  const legendRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const id = useId();

  const done = step >= QUESTIONS.length && isComplete(answers);
  useSyncQuery(done ? { r: QUESTIONS.map((q) => answers[q.id]).join('.') } : null);

  useEffect(() => {
    if (!moved.current) return;
    (done ? resultRef.current : legendRef.current)?.focus();
  }, [step, done]);

  const go = (next: number) => {
    moved.current = true;
    setStep(next);
  };

  const restart = () => {
    setAnswers({});
    go(0);
  };

  if (done) {
    const recs = getRecommendations(answers, locale);
    return (
      <>
        <PageHero eyebrow={q.resultEyebrow(t.common.toolLabel(3, 3))} title={<Rich text={q.title} />}>
          <p>{recs.length > 0 ? q.resultLead : q.resultLeadEmpty}</p>
        </PageHero>
        <section className="section section-cream tool-section">
          <div className="container narrow">
            <div className="card quiz-result">
              <h2 className="card-title" tabIndex={-1} ref={resultRef}>
                {recs.length > 0 ? q.resultTitle(recs.length) : q.emptyTitle}
              </h2>
              {recs.length === 0 ? (
                <div className="empty-result">
                  <p>{q.empty1}</p>
                  <p>{q.empty2}</p>
                </div>
              ) : (
                <ol className="checklist">
                  {recs.map((r) => (
                    <li key={r.id} className={`check-item priority-${r.priority}`}>
                      <div className="check-head">
                        <h3>{r.title}</h3>
                        <span className={`badge badge-${r.priority}`}>{t.quiz.priorities[r.priority]}</span>
                      </div>
                      <p>{r.what}</p>
                      <p>
                        <strong>{q.whyLabel}</strong> {r.why}
                      </p>
                      <ul className="triggers" aria-label={q.triggersLabel}>
                        {r.triggers.map((t) => (
                          <li key={t.question}>
                            <span className="trigger-q">{t.question}</span> <span className="trigger-a">{t.answer}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
              <Disclaimer />
              <div className="actions no-print">
                <CopyButton label={q.copy} getText={() => checklistText(recs, locale)} />
                <button type="button" className="btn btn-outline" onClick={restart}>
                  {q.restart}
                </button>
              </div>
            </div>
            <CtaPanel campaign="quiz" title={q.ctaTitle} text={q.ctaText} />
          </div>
        </section>
      </>
    );
  }

  const index = Math.min(step, QUESTIONS.length - 1);
  const question = questions[index]!;
  const selected = answers[question.id];
  const last = index === QUESTIONS.length - 1;
  const progress = ((index + (selected ? 1 : 0)) / QUESTIONS.length) * 100;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (selected) go(index + 1);
  };

  return (
    <>
      <PageHero eyebrow={t.common.toolLabel(3, 3)} title={<Rich text={q.title} />}>
        <p>{q.lead}</p>
      </PageHero>
      <section className="section section-cream tool-section">
        <div className="container narrow">
          <form className="card quiz-card" onSubmit={submit}>
            <div className="quiz-progress">
              <p className="quiz-step" id={`${id}-step`}>
                {q.step(index + 1, QUESTIONS.length)}
              </p>
              <div
                className="progress"
                role="progressbar"
                aria-labelledby={`${id}-step`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <fieldset key={question.id} className="quiz-fieldset">
              <legend className="quiz-legend">
                <h2 className="quiz-question" tabIndex={-1} ref={legendRef}>
                  {question.text}
                </h2>
              </legend>
              {question.help && <p className="field-hint quiz-help">{question.help}</p>}
              <div className="options">
                {question.options.map((o) => (
                  <label key={o.value} className={`option ${selected === o.value ? 'is-checked' : ''}`}>
                    <input
                      type="radio"
                      name={question.id}
                      value={o.value}
                      checked={selected === o.value}
                      onChange={() => setAnswers((a) => ({ ...a, [question.id]: o.value }))}
                    />
                    <span className="option-radio" aria-hidden="true" />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="quiz-nav">
              <button type="button" className="btn btn-text" onClick={() => go(index - 1)} disabled={index === 0}>
                <span aria-hidden="true">←</span> {q.back}
              </button>
              <button type="submit" className="btn btn-navy" disabled={!selected}>
                {last ? q.seeResults : q.next} <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
          <Disclaimer className="center-text" />
        </div>
      </section>
    </>
  );
}
