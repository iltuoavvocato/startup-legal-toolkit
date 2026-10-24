import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';

interface Props {
  side: 'startup' | 'investor';
  current: 'agent' | 'form';
}

/** "Parla con l'agente" / "Compila il modulo": two ways into the same matching, for founders and investors. */
export function ModeSwitch({ side, current }: Props) {
  const { t, path } = useI18n();
  const u = t.intake.ui;
  const items = [
    { mode: 'agent' as const, to: path(side === 'startup' ? 'matchAgentStartup' : 'matchAgentInvestor'), label: u.talk, hint: u.talkHint },
    { mode: 'form' as const, to: path(side === 'startup' ? 'matchStartup' : 'matchInvestor'), label: u.form, hint: u.formHint },
  ];
  return (
    <nav className="mi-mode" aria-label={u.modeLabel}>
      <ul>
        {items.map((it) => (
          <li key={it.mode}>
            <Link to={it.to} className={`mi-mode-link${it.mode === current ? ' is-current' : ''}`} aria-current={it.mode === current ? 'page' : undefined}>
              <span className="mi-mode-icon" aria-hidden="true">
                {it.mode === 'agent' ? <ChatIcon /> : <FormIcon />}
              </span>
              <span>
                <strong>{it.label}</strong>
                <span className="mi-mode-hint">{it.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}
