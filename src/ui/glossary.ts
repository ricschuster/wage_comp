/**
 * One home for every explanation the dashboard offers.
 *
 * The methodology page and the tooltips say the same things, so the copy lives
 * in one place and is rendered twice rather than written twice. Prose duplicated
 * into components drifts: a rate changes, the methodology page is updated, and a
 * tooltip somewhere goes on asserting the old behaviour.
 *
 * Keeping the copy out of the components also makes it testable. `section`
 * names the methodology heading that expands on the term, so a reader who wants
 * more than two sentences knows where to go.
 */

export interface GlossaryEntry {
  /** Display name, used as the tooltip heading. */
  readonly term: string;
  /** Two sentences at most. Longer belongs on the methodology page. */
  readonly tip: string;
  /** Methodology heading that covers this in full, when one does. */
  readonly section?: string;
}

/*
 * Declared separately from the export so the keys stay a literal union while the
 * values widen to `GlossaryEntry`. Exporting the `as const` object directly
 * would type each entry by its own literal shape, and `section` would not exist
 * on the entries that omit it.
 */
const ENTRIES = {
  grossIncome: {
    term: 'Gross income',
    tip: 'Annual employment income before any deduction. For Austria this is the full annual figure with the 13th and 14th salaries already inside it, because they are a split of annual gross and never an addition to it.',
    section: 'How Austria is modelled',
  },

  canadaNet: {
    term: 'Canada net',
    tip: 'Gross pay minus federal tax, provincial tax, and CPP or QPP, CPP2 and EI contributions. No voluntary deduction is applied: no RRSP, no union dues, no medical credits.',
    section: 'How Canada is modelled',
  },

  austriaNet: {
    term: 'Austria net',
    tip: 'Gross pay minus income tax on regular salary, tax on the 13th and 14th salaries under their own lower bands, and employee social insurance under its two separate regimes. It includes the SV-Rückerstattung, which is a genuine negative tax at low pay.',
    section: 'How Austria is modelled',
  },

  austriaNetCommon: {
    term: 'Austria net, in Canadian dollars',
    tip: 'The Austrian net converted across at the rate shown. Under a PPP basis that rate is not the market exchange rate: it is the rate at which the same basket costs the same in both countries.',
    section: 'How the conversion works',
  },

  ratio: {
    term: 'Ratio, Austria over Canada',
    tip: 'Austrian net divided by Canadian net, both in Canadian dollars. Above 1.0 the Austrian position is ahead and below 1.0 the Canadian one is, but the ratio does not account for what the deductions buy, nor for housing.',
    section: 'What the ratio does not tell you',
  },

  effectiveRate: {
    term: 'Effective deduction rate',
    tip: 'All tax and contributions as a share of gross income. It is not the rate on the last dollar earned, which is always higher.',
  },

  equivalentSalary: {
    term: 'Equivalent Austrian salary',
    tip: 'Comparing both countries at the same gross assumes a labour market parity that does not exist. This solves the inverse question: the Austrian gross whose net matches the Canadian net you entered.',
    section: 'What the ratio does not tell you',
  },

  conversionRate: {
    term: 'Conversion rate',
    tip: 'Canadian dollars per euro, under the chosen basis. The same rate converts the gross in and the net back out, which is why the choice of basis barely moves the ratio.',
    section: 'How the conversion works',
  },

  comparisonBasis: {
    term: 'Comparison basis',
    tip: 'How euro and dollars are made comparable. PPP asks what the money buys, while the market exchange rate asks what it trades for.',
    section: 'How the conversion works',
  },

  pppBasis: {
    term: 'PPP basis',
    tip: 'Which basket the PPP factor is built on. Household consumption is the consumer basket and the better fit here, because GDP PPP includes government spending and capital formation, which is not what a person buys.',
    section: 'How the conversion works',
  },

  specialPayments: {
    term: 'Austrian 13th and 14th salaries',
    tip: 'Austrian annual gross is paid in 14 instalments rather than 12: 12 regular and 2 special. The 2 are taxed under their own lower bands and charged social insurance under a separate regime, so turning this off shows what the regime is worth.',
    section: 'How Austria is modelled',
  },

  taxYear: {
    term: 'Tax year',
    tip: 'Every rate, threshold, credit and conversion factor is keyed to the year. Switching the year changes the tax system, not the salary, so two years at the same gross is not a trend.',
    section: 'What the ratio does not tell you',
  },

  province: {
    term: 'Province',
    tip: 'Provincial tax varies widely, and Quebec differs in kind: QPP and QPIP instead of CPP, EI at a reduced rate, the 16.5% federal abatement, and the deduction for workers in place of the contribution credits.',
    section: 'How Canada is modelled',
  },

  highlightIncome: {
    term: 'Highlighted income',
    tip: 'The single income the cards, the working and the equivalent-salary panel are computed at. It is also marked in the results table.',
  },

  incomeRange: {
    term: 'Income range',
    tip: 'The span the charts and the table cover, as a start, an end and a step. It does not affect the highlighted income.',
  },

  employerCost: {
    term: 'Cost to the employer',
    tip: 'What the job costs to employ, which is a different question from what the employee receives. Provincial employer health taxes are excluded because they depend on an employer total payroll rather than on one salary.',
    section: 'Cost to the employer',
  },

  employerLoad: {
    term: 'Employer load',
    tip: 'Employer contributions as a share of gross salary. Canada caps every one of them and they stop rising near $85,000 of salary, while Austrian wage levies are uncapped.',
    section: 'Cost to the employer',
  },

  working: {
    term: 'The working',
    tip: 'Every step of the calculation with its formula, the numbers substituted in, and a link to the source of each parameter used. Any headline number here can be reconstructed by hand from it.',
    section: 'Sources',
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof ENTRIES;

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = ENTRIES;

export const GLOSSARY_KEYS = Object.keys(GLOSSARY) as GlossaryKey[];
