// Translatable texts of the fictional demo dataset (names stay the same in every language).
const it = {
  investors: {
    i01: 'Software per servizi finanziari e infrastrutture B2B, dal seed alla serie A.',
    i02: 'Gruppo di angel con esperienza operativa nel software per aziende.',
    i03: 'Club deal di imprenditori del Nord-Ovest su fintech e immobiliare digitale.',
    i04: 'Investimenti di lungo periodo in aziende con ricavi già avviati, senza vincoli di settore.',
    i05: 'Veicolo corporate di un gruppo assicurativo immaginario: insurtech e salute digitale.',
    i06: 'Angel del Centro-Sud interessati a filiera agroalimentare e prodotti di consumo.',
    i07: 'Club deal dedicato a ricerca applicata e salute nelle regioni del Sud e nelle Isole.',
    i08: 'Ticket concentrati per guidare round seed nel software finanziario.',
    i09: 'Angel del Nord-Est su pagamenti, mobilità e servizi per il territorio.',
    i10: 'Programma di accelerazione per team alla prima raccolta, di qualsiasi settore.',
    i11: 'Transizione energetica e mobilità sostenibile, con attenzione alla tecnologia proprietaria.',
    i12: 'Professionisti che co-investono in software per scuole, aziende e servizi finanziari.',
    i13: 'Medici e docenti che investono nelle prime fasi di progetti su salute e formazione.',
    i14: 'Veicolo corporate di un gruppo immobiliare immaginario: edifici, energia e pagamenti.',
    i15: 'Famiglia imprenditoriale dell’agroalimentare che investe in aziende in crescita.',
  },
  startups: {
    s01: 'Conto aziendale per PMI con riconciliazione automatica di fatture e pagamenti.',
    s02: 'Sensori a basso costo e un’app per l’irrigazione di precisione nei frutteti.',
    s03: 'Telemonitoraggio dei pazienti dopo un intervento, integrato con l’ambulatorio.',
    s04: 'Esercizi adattivi di matematica per le scuole medie, pensati per i docenti.',
    s05: 'Sistemi di accumulo e software di gestione per comunità energetiche.',
    s06: 'Gestione digitale dei condomini: assemblee, spese e manutenzioni in un’unica app.',
    s07: 'Navette elettriche a chiamata per le aree industriali, prenotabili dall’app aziendale.',
    s08: 'Previsione della domanda per panifici artigianali, per ridurre gli sprechi.',
  },
  exampleDescription:
    'Conto aziendale per PMI con riconciliazione automatica di fatture e pagamenti. Abbiamo i primi clienti in prova e cerchiamo il primo round per crescere nel Nord Italia.',
};

export type MatchDemoMessages = typeof it;

const en: MatchDemoMessages = {
  investors: {
    i01: 'Software for financial services and B2B infrastructure, from seed to Series A.',
    i02: 'A group of angels with hands-on experience in business software.',
    i03: 'A club deal of North-West entrepreneurs focused on fintech and digital real estate.',
    i04: 'Long-term investments in companies that already have revenue, with no sector constraints.',
    i05: 'Corporate vehicle of a fictional insurance group: insurtech and digital health.',
    i06: 'Angels from central and southern Italy interested in the food supply chain and consumer products.',
    i07: 'A club deal for applied research and health in southern Italy and the islands.',
    i08: 'Concentrated tickets to lead seed rounds in financial software.',
    i09: 'North-East angels focused on payments, mobility and local services.',
    i10: 'An acceleration programme for teams raising for the first time, in any sector.',
    i11: 'Energy transition and sustainable mobility, with a focus on proprietary technology.',
    i12: 'Professionals co-investing in software for schools, businesses and financial services.',
    i13: 'Doctors and teachers investing early in health and education projects.',
    i14: 'Corporate vehicle of a fictional real estate group: buildings, energy and payments.',
    i15: 'A food-industry business family investing in growing companies.',
  },
  startups: {
    s01: 'Business account for SMEs with automatic reconciliation of invoices and payments.',
    s02: 'Low-cost sensors and an app for precision irrigation in orchards.',
    s03: 'Remote monitoring of patients after surgery, integrated with the clinic.',
    s04: 'Adaptive maths exercises for middle schools, designed for teachers.',
    s05: 'Energy storage systems and management software for energy communities.',
    s06: 'Digital management for apartment buildings: meetings, expenses and maintenance in one app.',
    s07: 'On-demand electric shuttles for industrial areas, bookable from the company app.',
    s08: 'Demand forecasting for artisan bakeries, to cut waste.',
  },
  exampleDescription:
    'Business account for SMEs with automatic reconciliation of invoices and payments. We have our first customers on trial and are raising our first round to grow in northern Italy.',
};

export default { it, en };
