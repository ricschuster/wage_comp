# Annual parameter refresh

A checklist, so the yearly update is mechanical rather than a re-derivation.

Adding a tax year should be a **data change only**. If it requires touching
`src/engine/`, the parameter abstraction has leaked and that is the bug to fix
first.

## When to run it

| Source | Published |
| --- | --- |
| CRA indexation and payroll amounts | November, for the following January |
| CRA T4127 payroll formulas | December or January, and revised mid-year |
| Government of BC and other provincial rates | With each provincial budget |
| Revenu Québec and Ministère des Finances du Québec | November |
| Austrian BMF tariff bands | Autumn, for the following January |
| Austrian social insurance values | Late November, effective 1 January |
| World Bank PPP factors | Continuously, always trailing the tax year |
| ECB reference rate | Daily |

So the earliest a full year can be assembled is roughly **January**.

## Before you start: two traps

1. **canada.ca blocks scripted fetches.** It sits behind bot protection that
   rejects `curl` and `wget` on their TLS handshake, and it resolves to IPv6
   first, so on a host without working IPv6 it hangs before the block is even
   reached. Use `tools/source.sh`, which replays a browser fingerprint.
2. **`vite preview` cannot serve the app for a screenshot.** It returns 404 for
   the module script when the request carries CORS headers, which browsers send
   for a `crossorigin` module, so the page never boots. `tools/screenshot.sh`
   uses a plain static server instead.

## Steps

### 1. Fetch the sources

```sh
tools/source.sh <url> <name>   # writes tools/cache/<name>.html and .txt, or .pdf
```

The URLs are all recorded in the parameter files, and rendered on the app's
methodology page.

### 2. Add the parameter files

Copy each `*-2026.ts` to the new year and update the values. Every value needs
its `retrieved` date changed, not only the ones that moved: the date records
when it was **checked**, not when it last changed.

The parameter interfaces live in `src/data/types.ts` and `src/data/provinces/types.ts`,
so a year file declares no types of its own. Add the provincial map to
`src/data/provinces/index.ts` and register the year in `src/data/years.ts`.
Those two should be the only non-data edits.

### Watch for mid-year changes

A government can change a rate part way through a year, and then two different
numbers are both correct:

- the **annual** figure, which the tax return uses and which this model wants
- the **prorated** figure, which payroll uses for the rest of the year to work
  off what was withheld under the old one

2025 had three of them: the federal rate cut (annual 14.5%, prorated 14% from
July), Manitoba's indexation freeze (annual 15,780, prorated 15,591), and
Alberta's new 8% band (annual 8%, prorated 6%). Taking the prorated figure would
have been wrong by a visible margin in every case. The July edition of T4127
states both, and says which is which.

### 3. Verify against the authority's own arithmetic

This is the step that catches transcription errors, and it has already caught a
real one.

- **Canada**: CRA publishes a constant per bracket in T4127 Table 8.1 such that
  `tax = rate x income - constant`. Reproduce them. Revenu Québec publishes the
  same thing in TP-1015.F, though it **truncates** where CRA rounds.
- **Both**: check the new thresholds equal the old ones times the published
  indexation factor. Canada matches to the dollar. Austria does not quite,
  because it enacts the amounts by regulation rather than deriving them, so a
  one-euro tolerance is expected.
- **Derived maximums**: every published contribution maximum should fall out of
  its own earnings base and rate.

### 4. Check one full result by hand

Run one income all the way through on paper and compare. **Every test can pass
and the answer still be wrong**, because the tests and the code can share an
assumption. That is exactly how the Quebec contribution-credit bug survived
until someone did the arithmetic by hand.

### 5. Run the checks and refresh the screenshot

```sh
npm run format:check && npm run lint && npm run typecheck && npm run test:coverage && npm run build
tools/screenshot.sh
```

### 6. Record anything structural

If a year needed an engine change (a new levy, a changed formula shape), write
an ADR in `docs/decisions/` explaining why the parameter abstraction was not
enough.

## Known changes already coming

Recorded as they were found, so the next refresh does not miss them.

| Year | Change |
| --- | --- |
| 2027 | **CPP base rate falls from 4.95% to 4.75%.** The first and second additional rates are unchanged. This changes the deductible/creditable split, not just a number. |
| 2027 to 2030 | **British Columbia has paused bracket indexation.** Thresholds will not move; indexation resumes for 2031. |
| After 2029 | **Austria's 55% top band expires**, reverting to 50% above one million euro. |

## Backfilling an earlier year

Same steps, one shortcut: the current T4127 publishes the **previous** year's
rates, thresholds, constants, personal amounts and contribution tables in a
second set of tables (8.22 through 8.29 in the 122nd edition). Those are the
final annual figures, already corrected for anything that changed mid-year, so
they are a better source than the edition published at the time. Reach for the
earlier edition only for the things those tables do not carry: the basic
personal amount formulas, and the factors behind the Ontario and British
Columbia tax reductions.

Revenu Québec's rates page and the Ministère des Finances parameter tables both
carry two years side by side, so Quebec needs no second document either.

## Things to re-check rather than assume

- **Manitoba's bracket thresholds are published twice by CRA and do not agree.**
  T4127 and T4032MB both give 47,000 and 100,000 with a basic personal amount
  of 15,780, matching the indexation freeze announced on 2025-03-20 and the
  published bracket constants. The "tax rates and income brackets" page gives
  47,564 and 101,200, which is the frozen pair indexed by 1.2% anyway. The two
  payroll publications win, and the model uses them. Re-check each year: if
  Manitoba resumes indexation the rates page will be right by accident, so
  confirm against T4032MB rather than assuming the disagreement persists.
- **Nova Scotia's basic personal amount** was income-tested until 2025, when
  the announcement of 2025-02-18 set it at the maximum for the whole of that
  year. If the test returns, it needs `basicPersonalAmountPhaseOut` again.
- **Prince Edward Island's surtax** is currently absent from T4127 Table 8.2.
  Confirm it stays absent.
- **The Ontario health premium bands** are not indexed and have not moved in
  years, which makes them easy to copy forward without checking. Check them.
- **Vienna's housing levy** rose to 1.5% in 2026 while the national rate stayed
  at 1.0%. The model uses the national rate; if more states diverge, that
  choice needs revisiting.
- **The PPP reference year** will still trail the tax year. Update it and let
  the app keep saying so.
