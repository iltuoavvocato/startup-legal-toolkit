// Localised label of each quick-reply chip (also used for the user's bubble once picked).
import { useI18n } from '../../i18n/context';
import type { Chip } from './chat';

export function useChipLabel(): (chip: Chip) => string {
  const { t } = useI18n();
  const a = t.variants.actions;
  const c = t.variants.v3.chips;
  const labels: Record<Chip, string> = {
    why: a.why,
    propose: a.propose,
    next: c.next,
    excluded: c.excluded,
    restart: a.restart,
    interested: a.interested,
    pass: a.pass,
    simulate: a.simulateReply,
  };
  return (chip) => labels[chip];
}
