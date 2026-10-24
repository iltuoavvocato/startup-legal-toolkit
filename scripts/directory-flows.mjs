// Screenshot flows for the investor directory, the investor profile page and the requests inbox (IT/EN).
// Each flow leaves the page in the state to capture and pushes any problem it finds into `problems`.

const COPY = {
  it: {
    directory: 'match-investitori/investitori/',
    profile: 'match-investitori/investitori/scheda/',
    requests: 'match-investitori/richieste/',
    fase: 'Fase',
    settore: 'Settore',
    openFilters: /^Filtri/,
    showResults: /^Mostra \d+ risultat/,
    empty: 'Nessun investitore con questi filtri',
    suggestion: /^Togli “/,
    clear: 'Azzera filtri',
    fictional: 'Dati di esempio fittizi',
    disclaimer: 'Strumento indicativo: non sostituisce una consulenza legale.',
    noProfile: 'Parla con l’agente',
    example: 'Carica un esempio',
    counter: '3/5 proposte questo mese',
    counterTag: 'limite indicativo da definire',
    fit: 'Affinità con il tuo profilo',
    fitOn: 'Affinità calcolata sul tuo profilo',
    propose: /^Proponi il tuo profilo/,
    sent: 'Proposta inviata',
    investorTab: /^Come investitore/,
    founderTab: /^Come startup/,
    yes: /^Sì, mi interessa/,
    interest: 'Interesse inviato',
    travel: 'Simula +7 giorni',
    expiresIn: /Scade tra \d+ giorn/,
    expired: 'Scaduta: nessuna intro',
    demo: 'Solo demo',
    // Words that would reveal the other side's "no" on the asking side.
    reveal: /ha rifiutato|ha detto no|non è interessat|rifiutata dall/i,
  },
  en: {
    directory: 'en/investor-match/investors/',
    profile: 'en/investor-match/investors/profile/',
    requests: 'en/investor-match/requests/',
    fase: 'Stage',
    settore: 'Sector',
    openFilters: /^Filters/,
    showResults: /^Show \d+ result/,
    empty: 'No investors match these filters',
    suggestion: /^Remove “/,
    clear: 'Clear filters',
    fictional: 'Fictional sample data',
    disclaimer: 'Indicative tool: not a substitute for legal advice.',
    noProfile: 'Talk to the agent',
    example: 'Load an example',
    counter: '3/5 proposals this month',
    counterTag: 'indicative limit, to be defined',
    fit: 'Fit with your profile',
    fitOn: 'Fit calculated on your profile',
    propose: /^Propose your profile/,
    sent: 'Proposal sent',
    investorTab: /^As an investor/,
    founderTab: /^As a startup/,
    yes: /^Yes, I’m interested/,
    interest: 'Interest sent',
    travel: 'Simulate +7 days',
    expiresIn: /Expires in \d+ day/,
    expired: 'Expired: no intro',
    demo: 'Demo only',
    reveal: /declined by|(investor|startup) said no|not interested|rejected/i,
  },
};

async function mainText(page) {
  return page.locator('main').innerText();
}

async function expectIn(page, name, problems, needles) {
  const text = await mainText(page);
  for (const n of needles) {
    // Case-insensitive: some labels are set in uppercase with CSS, which innerText reflects.
    const ok = n instanceof RegExp ? n.test(text) : text.toLowerCase().includes(n.toLowerCase());
    if (!ok) problems.push(`${name}: missing ${n}`);
  }
  return text;
}

async function clearInbox(page) {
  await page.evaluate(() => window.sessionStorage.removeItem('matchinvstar-inbox'));
}

const isMobile = (page) => (page.viewportSize()?.width ?? 1440) < 900;

/** Every directory page: fictional-data label and disclaimer. */
async function commonChecks(page, name, lang, problems) {
  const c = COPY[lang];
  await expectIn(page, name, problems, [c.fictional, c.disclaimer]);
}

/** Filters through the UI (sidebar on desktop, sheet on phones); the URL follows and the back button undoes. */
export async function directoryFiltered(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang}-directory-filtered`;
  await page.goto(`${base}${c.directory}`);
  await page.locator('#page-title').waitFor();
  const scope = isMobile(page) ? page.locator('dialog.mi-dir-drawer') : page.locator('aside.mi-dir-filters');
  if (isMobile(page)) {
    if (await page.locator('aside.mi-dir-filters').count()) problems.push(`${name}: sidebar rendered on a phone`);
    await page.getByRole('button', { name: c.openFilters }).click();
    await scope.waitFor();
  }
  await scope.getByLabel(c.fase, { exact: true }).selectOption('seed');
  await page.waitForURL(/fase=seed/);
  await scope.getByLabel(c.settore, { exact: true }).selectOption('fintech');
  await page.waitForURL(/settore=fintech/);
  if (isMobile(page)) await page.getByRole('button', { name: c.showResults }).click();
  await page.goBack();
  await page.waitForURL((u) => !u.search.includes('settore=') && u.search.includes('fase=seed'));
  await page.goForward();
  await page.waitForURL(/settore=fintech/);
  const fase = await page.locator('.mi-dir-chips').innerText();
  if (!/seed/i.test(fase) || !/fintech/i.test(fase)) problems.push(`${name}: active filter chips missing`);
  await commonChecks(page, name, lang, problems);
}

export async function directoryEmpty(page, base, lang, problems) {
  const c = COPY[lang];
  const name = `${lang}-directory-empty`;
  await page.goto(`${base}${c.directory}?tipo=acceleratore&fase=serie-a&settore=fintech`);
  await page.locator('#page-title').waitFor();
  await expectIn(page, name, problems, [c.empty]);
  if (!(await page.getByRole('button', { name: c.suggestion }).count())) problems.push(`${name}: no suggestions in the empty state`);
  await commonChecks(page, name, lang, problems);
}

/** Mobile only: the filter sheet open over the directory. */
export async function directoryDrawer(page, base, lang) {
  const c = COPY[lang];
  await page.goto(`${base}${c.directory}?settore=agritech`);
  await page.locator('#page-title').waitFor();
  await page.getByRole('button', { name: c.openFilters }).click();
  await page.locator('dialog.mi-dir-drawer').waitFor();
  await page.waitForTimeout(300);
}

export async function profileNoProfile(page, base, lang, problems) {
  const c = COPY[lang];
  await clearInbox(page);
  await page.goto(`${base}${c.profile}?id=i03`);
  await page.locator('#page-title').waitFor();
  const text = await expectIn(page, `${lang}-profile`, problems, [c.noProfile]);
  if (/@|\.example/.test(text)) problems.push(`${lang}-profile: contact details shown`);
  await commonChecks(page, `${lang}-profile`, lang, problems);
}

export async function requestsFounder(page, base, lang, problems) {
  const c = COPY[lang];
  await clearInbox(page);
  await page.goto(`${base}${c.requests}`);
  await page.locator('#page-title').waitFor();
  await page.getByRole('button', { name: c.example }).click();
  await expectIn(page, `${lang}-requests-founder`, problems, [c.counter, c.counterTag, c.expiresIn, c.demo, c.disclaimer]);
}

/** Needs a profile (run after requestsFounder): fit on the profile page, then a proposal through the double opt-in. */
export async function profileWithFit(page, base, lang, problems) {
  const c = COPY[lang];
  await page.goto(`${base}${c.profile}?id=i33`);
  await page.locator('#page-title').waitFor();
  await expectIn(page, `${lang}-profile-fit`, problems, [c.fit]);
  const send = page.getByRole('button', { name: c.propose });
  if (await send.count()) {
    await send.click();
    await expectIn(page, `${lang}-profile-fit`, problems, [c.sent]);
  } else problems.push(`${lang}-profile-fit: no "propose" button`);
}

export async function directoryWithFit(page, base, lang, problems) {
  const c = COPY[lang];
  await page.goto(`${base}${c.directory}?ordina=affinita`);
  await page.locator('#page-title').waitFor();
  await expectIn(page, `${lang}-directory-fit`, problems, [c.fitOn, c.sent]);
}

export async function requestsInvestor(page, base, lang, problems) {
  const c = COPY[lang];
  await page.goto(`${base}${c.requests}`);
  await page.locator('#page-title').waitFor();
  await page.getByRole('tab', { name: c.investorTab }).click();
  await page.waitForURL(/vista=investitore/);
  await page.getByRole('button', { name: c.yes }).first().click();
  const text = await expectIn(page, `${lang}-requests-investor`, problems, [c.interest]);
  for (const n of ['Contoverde', 'Radice Lab', 'Giada']) if (text.includes(n)) problems.push(`${lang}-requests-investor: startup name revealed`);
}

/** Two "+7 days": answers arrive and pending requests expire. A "no" must never be readable on the asking side. */
export async function requestsTravel(page, base, lang, problems, tab = 'founder') {
  const c = COPY[lang];
  await page.goto(`${base}${c.requests}`);
  await page.locator('#page-title').waitFor();
  await page.getByRole('button', { name: c.travel }).click();
  await page.getByRole('button', { name: c.travel }).click();
  const founder = await expectIn(page, `${lang}-requests-travel`, problems, [c.expired]);
  if (c.reveal.test(founder)) problems.push(`${lang}-requests-travel: a "no" is readable on the founder side`);
  await page.getByRole('tab', { name: c.investorTab }).click();
  const investor = await mainText(page);
  if (c.reveal.test(investor)) problems.push(`${lang}-requests-travel: a "no" is readable on the investor side`);
  if (tab === 'founder') await page.getByRole('tab', { name: c.founderTab }).click();
}
