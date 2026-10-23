// Generates the two fictional sample pitch decks used by "Prova con un deck di esempio" / "Try a sample deck":
//   public/demo/deck-esempio-vignalume.pdf (Italian) and public/demo/sample-deck-kelpwise.pdf (English).
// Companies, people, figures and addresses are invented. Run: node scripts/make-sample-decks.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const DECKS = [
  {
    file: 'public/demo/deck-esempio-vignalume.pdf',
    title: 'Vignalume – deck di esempio fittizio',
    footer: 'Deck di esempio fittizio · azienda, persone e cifre inventate · MatchInvStar (nome provvisorio)',
    slides: [
      ['Vignalume', 'L’agricoltura di precisione per i vigneti del Sud', 'Deck di esempio fittizio – Seed 2026'],
      ['Il problema', 'Le aziende agricole perdono fino al 20% del raccolto per malattie scoperte tardi.', 'Irrigazione e trattamenti sono decisi a occhio.'],
      ['La soluzione', 'Sensori nei filari e un’app che avvisa l’agronomo 10 giorni prima.', 'Agritech pensato per le colture mediterranee.'],
      ['Trazione', '42 aziende agricole clienti, 3 progetti pilota con cantine cooperative', 'MRR di 18.000 € (+12% mese su mese)', '2 lettere d’intenti da consorzi'],
      ['Il mercato', 'TAM: 2,4 miliardi € in Italia e Spagna.', 'Abbiamo chiuso un pre-seed da 150k nel 2024.'],
      ['Il team', 'Siamo un team di 7 persone tra agronomi e ingegneri, 3 cofondatori.', 'Ex Università di Bari.'],
      ['Il round', 'Stiamo raccogliendo un round seed da 800.000 €', 'per assumere e portare i sensori in 200 aziende.'],
      ['Contatti', 'Vignalume S.r.l. (fittizia) – sede operativa: Bari, via dei Mille 1 (indirizzo di esempio)'],
    ],
  },
  {
    file: 'public/demo/sample-deck-kelpwise.pdf',
    title: 'Kelpwise – fictional sample deck',
    footer: 'Fictional sample deck · company, people and figures are invented · MatchInvStar (working name)',
    slides: [
      ['Kelpwise', 'Remote monitoring for chronic patients', 'Fictional sample deck'],
      ['Problem', 'Hospitals in Southern Italy discharge heart patients with almost no follow-up.'],
      ['Solution', 'A digital health platform: a wearable patch and a dashboard for clinics and doctors.'],
      ['Traction', '1,200 active users, 9 paying customers (clinics)', 'ARR €240k, growing 15% MoM', '4 pilots with public hospitals, 2 LOIs'],
      ['Market', 'SAM of €1.1B.', 'Previous round: we raised $300k pre-seed from angels in 2024.'],
      ['Team', 'We are a team of 12: clinicians and engineers.', '2 co-founders, both ex-Politecnico di Milano.'],
      ['The ask', 'We are raising a €1.2M seed round to scale to 30 hospitals.'],
      ['Contact', 'Kelpwise S.r.l. (fictional) – headquartered in Naples, Italy'],
    ],
  },
];

const W = 960;
const H = 540;
const NAVY = rgb(0.106, 0.165, 0.306);
const GOLD = rgb(0.788, 0.635, 0.29);
const INK = rgb(0.16, 0.18, 0.24);

function wrap(text, font, size, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

for (const deck of DECKS) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(deck.title);
  pdf.setAuthor('MatchInvStar demo (fictional)');
  pdf.setProducer('startup-legal-toolkit scripts/make-sample-decks.mjs');
  pdf.setCreator('pdf-lib');
  // Fixed dates keep the output byte-for-byte stable between runs.
  pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'));
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  deck.slides.forEach(([heading, ...body], i) => {
    const page = pdf.addPage([W, H]);
    const cover = i === 0;
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: cover ? NAVY : rgb(1, 1, 1) });
    page.drawRectangle({ x: 64, y: H - 92, width: 56, height: 5, color: GOLD });
    page.drawText(heading, { x: 64, y: H - 150, size: cover ? 56 : 38, font: bold, color: cover ? rgb(1, 1, 1) : NAVY });
    let y = H - (cover ? 215 : 210);
    for (const para of body) {
      for (const line of wrap(para, regular, 24, W - 128)) {
        page.drawText(line, { x: 64, y, size: 24, font: regular, color: cover ? rgb(0.9, 0.92, 0.96) : INK });
        y -= 34;
      }
      y -= 10;
    }
    page.drawText(deck.footer, { x: 64, y: 28, size: 11, font: regular, color: cover ? GOLD : rgb(0.45, 0.48, 0.55) });
    page.drawText(`${i + 1}/${deck.slides.length}`, { x: W - 100, y: 28, size: 11, font: regular, color: cover ? GOLD : rgb(0.45, 0.48, 0.55) });
  });

  mkdirSync('public/demo', { recursive: true });
  const bytes = await pdf.save({ useObjectStreams: false });
  writeFileSync(deck.file, bytes);
  console.log(`${deck.file}: ${deck.slides.length} pages, ${bytes.length} bytes`);
}
