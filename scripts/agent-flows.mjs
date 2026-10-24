// Scripted conversations with the guided intake ("Parla con l'agente" / "Talk to the agent"), used by
// scripts/screenshots.mjs. Each step clicks what a person would click; checks push to `problems`.

const COPY = {
  it: {
    startup: 'match-investitori/agente/startup/',
    investor: 'match-investitori/agente/investitore/',
    sample: 'Prova con un deck di esempio',
    noDeck: 'Continua senza deck',
    yes: 'Sì, usalo',
    extras: 'Sì, citali',
    find: 'Cerca i match',
    confirm: 'Conferma',
    send: 'Invia',
    propose: 'Proponi il profilo',
    requestsLink: 'Le tue richieste',
    travel: 'Simula +7 giorni',
    requests: 'match-investitori/richieste/',
    left: /Proposte rimaste a questo mese: (\d) di 5/,
    interested: 'Mi interessa',
    simulateStartup: 'Simula la risposta della startup',
    excluded: 'Perché alcuni non compaiono?',
    edit: 'Modifica',
    restart: 'Ricomincia',
    log: 'Conversazione con l’agente',
    deckRead: /Ho letto \d+ pagine/,
    found: /Ho trovato \d+ (investitori|startup) in linea/,
    next: 'Prossimo passo',
    gaps: 'Cosa non torna',
    fromDeck: 'Dal tuo deck ho usato',
    disclaimer: 'Strumento indicativo: non sostituisce una consulenza legale.',
    allItaly: 'Tutta Italia',
  },
  en: {
    startup: 'en/investor-match/agent/startup/',
    investor: 'en/investor-match/agent/investor/',
    sample: 'Try a sample deck',
    noDeck: 'Continue without a deck',
    yes: 'Yes, use it',
    extras: 'Yes, mention them',
    find: 'Find matches',
    confirm: 'Confirm',
    send: 'Send',
    propose: 'Propose your profile',
    requestsLink: 'Your requests',
    travel: 'Simulate +7 days',
    requests: 'en/investor-match/requests/',
    left: /Proposals left this month: (\d) of 5/,
    interested: 'I’m interested',
    simulateStartup: 'Simulate the startup’s answer',
    excluded: 'Why are some missing?',
    edit: 'Edit',
    restart: 'Start over',
    log: 'Conversation with the agent',
    deckRead: /I read \d+ pages/,
    found: /I found \d+ (investors|startups) that fit/,
    next: 'Next step',
    gaps: 'What doesn’t fit',
    fromDeck: 'From your deck I used',
    disclaimer: 'Indicative tool: not a substitute for legal advice.',
    allItaly: 'All of Italy',
  },
};

const answers = (page) => page.locator('.mi-agent-answer');
const chip = (page, name) => answers(page).getByRole('button', { name, exact: true });

/** Clicks a chip of the open question and waits for the next question (or the results) to replace it. */
async function pick(page, name) {
  const before = await page.locator('.mi-msg').count();
  await chip(page, name).click();
  await page.waitForFunction((n) => document.querySelectorAll('.mi-msg').length > n, before);
}

async function fresh(page, base, path) {
  await page.goto(`${base}${path}`);
  await page.evaluate(() => window.sessionStorage.clear());
  await page.goto(`${base}${path}`);
  await page.locator('#page-title').waitFor();
  await page.locator('.mi-agent-answer').waitFor();
}

async function expectInChat(page, problems, name, needles) {
  const text = await page.locator('.mi-agent-chat').innerText();
  for (const n of needles) {
    const ok = n instanceof RegExp ? n.test(text) : text.includes(n);
    if (!ok) problems.push(`${name}: chat lacks ${n}`);
  }
}

/** Focus must sit on a control of the open question after an answer. */
async function expectFocusInAnswer(page, problems, name) {
  const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('.mi-agent-answer')));
  if (!inside) problems.push(`${name}: focus did not move to the new question`);
}

/** Founder with the sample deck: read on the device, confirm each finding, results, propose and simulate. */
export async function founderWithDeck(page, base, lang, problems, upTo = 'results') {
  const c = COPY[lang];
  const name = `${lang} founder+deck`;
  await fresh(page, base, c.startup);
  await chip(page, c.sample).click();
  await page.getByText(c.deckRead).waitFor();
  await page.locator('.mi-agent-quote').first().waitFor();
  if (upTo === 'deck') return;
  // Sector, stage, round, location, cover sentence: "yes" to each; then the extras.
  for (let i = 0; i < 6; i++) {
    const open = await answers(page).getAttribute('data-q');
    if (open === 'deck:extras') await pick(page, c.extras);
    else if (open?.startsWith('deck:')) await pick(page, c.yes);
  }
  const q = await answers(page).getAttribute('data-q');
  if (q !== 'confirm') problems.push(`${name}: expected the confirmation after the deck, got ${q}`);
  await expectFocusInAnswer(page, problems, name);
  // The live profile shows deck sources.
  const side = await page.locator('.mi-agent-side').textContent();
  if (!/(dal deck|from the deck), p\. \d/.test(side)) problems.push(`${name}: profile panel lacks deck sources`);
  // Nothing of the deck's text in storage.
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(window.sessionStorage)));
  if (stored.includes('"snippet"') || stored.includes('findings":{')) problems.push(`${name}: deck text in sessionStorage`);
  if (upTo === 'confirm') return;
  await chip(page, c.find).click();
  await page.getByText(c.found).waitFor();
  await expectInChat(page, problems, name, [c.next, c.gaps, c.fromDeck]);
  await proposeFirst(page, c, problems, name);
  // The investor's simulated answer arrives on the inbox's demo clock, as on the requests page.
  await page.locator('.mi-agent-match').first().getByRole('button', { name: c.travel }).click();
}

/** "Proponi il profilo" on the first match: recorded in the shared inbox, and the shared counter drops by one. */
async function proposeFirst(page, c, problems, name) {
  const leftOf = async () => Number((await page.locator('.mi-agent-chat').innerText()).match(c.left)?.[1]);
  const before = await leftOf();
  const firstCard = page.locator('.mi-agent-match').first();
  await firstCard.getByRole('button', { name: new RegExp(`^${c.propose}`) }).click();
  await firstCard.getByRole('link', { name: c.requestsLink }).waitFor();
  const after = await leftOf();
  if (!(after === before - 1)) problems.push(`${name}: shared counter went from ${before} to ${after} after proposing`);
  const inbox = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('matchinvstar-inbox') ?? '{"requests":[]}'));
  if (!inbox.requests.some((r) => r.role === 'founder')) problems.push(`${name}: the agent's proposal is not in the requests inbox`);
}

/** Founder without a deck, then a proposal from the agent's results, then the requests page that lists it. */
export async function agentProposalInInbox(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} agent → inbox`;
  await founderNoDeck(page, base, lang, problems);
  const investor = (await page.locator('.mi-agent-match h3').first().innerText()).replace(/^\d+\.\s*/, '');
  await proposeFirst(page, c, problems, name);
  await page.locator('.mi-agent-match').first().getByRole('link', { name: c.requestsLink }).click();
  await page.waitForURL((u) => u.pathname.endsWith(`/${c.requests}`));
  await page.locator('#page-title').waitFor();
  const text = await page.locator('main').innerText();
  if (!text.includes(investor)) problems.push(`${name}: the requests page does not list ${investor}`);
  if (!/(1\/5 proposte questo mese|1\/5 proposals this month)/.test(text)) problems.push(`${name}: the requests page counter is not 1/5`);
}

/** Founder without a deck: chips, a suggested amount, a typed one-liner, an edit, then results. */
export async function founderNoDeck(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} founder`;
  await fresh(page, base, c.startup);
  await pick(page, c.noDeck);
  await expectFocusInAnswer(page, problems, name);
  await pick(page, 'Fintech');
  await pick(page, 'Seed');
  // Suggested amounts follow the stage.
  await pick(page, lang === 'it' ? '500.000 €' : '€500,000');
  await pick(page, lang === 'it' ? 'Lombardia' : 'Lombardy');
  await answers(page).locator('textarea').fill(lang === 'it' ? 'Pagamenti istantanei per le PMI italiane' : 'Instant payments for Italian SMEs');
  await pick(page, c.send);
  // Edit the stage from its bubble, then come back to the confirmation.
  await page.locator('.mi-msg.is-user').filter({ hasText: 'Seed' }).getByRole('button', { name: new RegExp(`^${c.edit}`) }).click();
  await answers(page).waitFor();
  if ((await answers(page).getAttribute('data-q')) !== 'fase') problems.push(`${name}: "edit" did not reopen the stage`);
  await pick(page, 'Seed');
  if ((await answers(page).getAttribute('data-q')) !== 'confirm') problems.push(`${name}: did not return to the confirmation after the edit`);
  await chip(page, c.find).click();
  await page.getByText(c.found).waitFor();
  await page.getByRole('button', { name: c.excluded }).click();
  await page.locator('.mi-agent-excluded').waitFor();
  // Persisted in this tab: a reload keeps the conversation.
  await page.reload();
  await page.locator('.mi-agent-match').first().waitFor();
}

/** Investor: multi-select chips, a suggested ticket range, all of Italy, location, then interest and a simulated answer. */
export async function investorFlow(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang} investor`;
  await fresh(page, base, c.investor);
  await chip(page, 'Fintech').click();
  await chip(page, 'Proptech').click();
  if ((await chip(page, 'Fintech').getAttribute('aria-pressed')) !== 'true') problems.push(`${name}: multi chips lack aria-pressed`);
  await pick(page, c.confirm);
  await expectFocusInAnswer(page, problems, name);
  await chip(page, 'Seed').click();
  await chip(page, 'Pre-seed').click();
  await pick(page, c.confirm);
  await answers(page).getByRole('button').first().click();
  await page.waitForFunction(() => document.querySelector('.mi-agent-answer')?.getAttribute('data-q') === 'aree');
  await chip(page, c.allItaly).click();
  await pick(page, c.confirm);
  await pick(page, lang === 'it' ? 'Lombardia' : 'Lombardy');
  await chip(page, c.find).click();
  await page.getByText(c.found).waitFor();
  const first = page.locator('.mi-agent-match').first();
  await first.getByRole('button', { name: new RegExp(`^${c.interested}`) }).click();
  await first.getByRole('button', { name: new RegExp(`^${c.simulateStartup}`) }).click();
}

export async function restartWorks(page, base, lang, problems) {
  const c = COPY[lang];
  await page.getByRole('button', { name: c.restart, exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.mi-msg').length === 2);
  const raw = await page.evaluate(() => Object.values(window.sessionStorage).join(''));
  if (raw.includes('"phase":"results"')) problems.push(`${lang}: "start over" kept the old conversation in storage`);
}
