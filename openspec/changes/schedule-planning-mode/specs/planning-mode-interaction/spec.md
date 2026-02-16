# Planning Mode Interaction

User stories for the schedule table planning mode toggle, checkbox payment tracking, watermark management, and visual states.

Traceable to: event-storming (User Actions, Business Rules), calculation-modeling (Scenario 1 swim lanes, Scenario 3 watermark absorption).

## ADDED User Stories

### User Story: Toggle planning mode
As a financing holder, I want to toggle a "Modo planejamento" switch on the schedule table, so that I can enter planning mode to track my payments and simulate extra amortizations.

#### Acceptance Criteria
- **Given** a base simulation has been run (SAC or Price schedule exists)
- **When** I click the "Modo planejamento" toggle
- **Then** checkboxes appear on every row of the schedule table, and a modality dropdown ("Redução de prazo" / "Redução de parcela") appears at the top, defaulting to "Redução de prazo"

- **Given** planning mode is ON with some months checked
- **When** I toggle planning mode OFF
- **Then** checkboxes and the modality dropdown disappear, the comparison section hides, but my checked state (paidUpToMonth, extraPaidMonths) is preserved in memory

- **Given** planning mode was previously ON with months checked, then toggled OFF
- **When** I toggle planning mode back ON
- **Then** all previously checked months are restored and the comparison recalculates

---

### User Story: Check sequential months
As a financing holder, I want to check months sequentially from month 1, so that I can mark regular payments I've already made.

#### Acceptance Criteria
- **Given** planning mode is ON and paidUpToMonth = 0
- **When** I check month 1
- **Then** paidUpToMonth advances to 1, month 1 shows a sequential marker (▪)

- **Given** paidUpToMonth = 10
- **When** I check month 11
- **Then** paidUpToMonth advances to 11, month 11 shows a sequential marker (▪)

- **Given** paidUpToMonth = 10 and months 11, 12 are in extraPaidMonths
- **When** I check month 13 (completing contiguous block 11-13)
- **Then** watermark absorption runs: paidUpToMonth advances to 13, months 11-13 are removed from extraPaidMonths and show sequential markers (▪)

---

### User Story: Check extra months (non-sequential)
As a financing holder, I want to check any future month beyond my sequential payments, so that I can plan extraordinary amortization payments.

#### Acceptance Criteria
- **Given** paidUpToMonth = 24
- **When** I check month 350
- **Then** month 350 is added to extraPaidMonths, shows an extra marker (★), and the comparison section recalculates live

- **Given** paidUpToMonth = 24 and extraPaidMonths = {350, 355}
- **When** I check month 360
- **Then** month 360 is added to extraPaidMonths, the total extraPrincipal (sum of amortizations for months 350, 355, 360 from the original schedule) is deducted, and comparison updates

- **Given** paidUpToMonth = 24 and the sum of extra amortizations already equals the balance at month 24
- **When** I try to check another extra month
- **Then** the check is prevented and a warning appears: "Saldo insuficiente para mais amortizações extras."

---

### User Story: Uncheck sequential months (shrink watermark)
As a financing holder, I want to uncheck the last sequential month, so that I can correct my payment tracking if I made a mistake.

#### Acceptance Criteria
- **Given** paidUpToMonth = 10 and no extras
- **When** I uncheck month 10
- **Then** paidUpToMonth drops to 9, month 10 becomes an unchecked checkbox

- **Given** paidUpToMonth = 10
- **When** I attempt to uncheck month 5 (mid-sequence)
- **Then** the action is blocked — the checkbox for month 5 is disabled (visually grayed out, no pointer cursor)

- **Given** paidUpToMonth = 10 and extraPaidMonths = {8} (inconsistent — shouldn't happen, but as guard)
- **When** watermark drops to 9
- **Then** any extras with month <= 9 are auto-evicted from extraPaidMonths

---

### User Story: Uncheck extra months
As a financing holder, I want to uncheck any extra month, so that I can adjust my amortization plan freely.

#### Acceptance Criteria
- **Given** extraPaidMonths = {350, 355, 360}
- **When** I uncheck month 355
- **Then** month 355 is removed from extraPaidMonths, comparison recalculates live with only months 350 and 360

- **Given** extraPaidMonths = {350}
- **When** I uncheck month 350 (last extra)
- **Then** extraPaidMonths becomes empty, comparison section hides (no modifications to show)

---

### User Story: Visual distinction between sequential and extra payments
As a financing holder, I want sequential payments and extra payments to look different in the table, so that I can quickly see my regular payment progress vs planned extra amortizations.

#### Acceptance Criteria
- **Given** planning mode is ON with paidUpToMonth = 10 and extraPaidMonths = {20, 55}
- **When** I look at the schedule table
- **Then** months 1-10 show checked checkboxes with a sequential marker (▪), months 20 and 55 show checked checkboxes with an extra marker (★), all other months show unchecked checkboxes

- **Given** planning mode is ON with paidUpToMonth = 10
- **When** I look at months 1-9 in the table
- **Then** their checkboxes are checked AND disabled (cannot be unchecked — mid-sequence protection)

---

### User Story: Planning status bar
As a financing holder, I want to see a summary bar showing my payment state, so that I have quick visibility into how many months I've paid and how many extras I've planned.

#### Acceptance Criteria
- **Given** planning mode is ON with paidUpToMonth = 24 and extraPaidMonths = {350, 355, 360}
- **When** I look at the status bar below the table
- **Then** I see: "Parcelas pagas: 24 | Extras: 3 (mês 350, 355, 360) | Amortização extra total: R$ X.XXX,XX"

- **Given** planning mode is ON with paidUpToMonth = 0 and no extras
- **When** I look at the status bar
- **Then** I see: "Parcelas pagas: 0 | Nenhuma amortização extra"

---

### User Story: Switch amortization modality
As a financing holder, I want to choose between "Redução de prazo" and "Redução de parcela", so that I can see how different amortization strategies affect my financing plan.

#### Acceptance Criteria
- **Given** planning mode is ON with extras checked and modality = "Redução de prazo"
- **When** I switch the dropdown to "Redução de parcela"
- **Then** the comparison section recalculates: same extras but now showing reduced payments instead of reduced term

- **Given** planning mode is ON with no extras checked
- **When** I switch the dropdown
- **Then** no visible change (comparison section not shown without extras)


## MODIFIED User Stories

### User Story: Schedule table gains checkbox column
As a financing holder, I want the existing amortization schedule table to include interactive checkboxes when planning mode is active, so that I can track and plan payments directly in the schedule view.

#### Acceptance Criteria
- **Given** planning mode is OFF
- **When** I view the schedule table
- **Then** the table looks exactly as before — no checkbox column, same columns (Mês, Parcela, Amortização, Juros, Saldo Devedor)

- **Given** planning mode is ON
- **When** I view the schedule table
- **Then** a checkbox column appears as the first column, preceding the Mês column

- **Given** planning mode is ON and the table is scrolled (virtualized rendering)
- **When** I scroll to rows that were off-screen
- **Then** checkbox state is correct — determined by store (paidUpToMonth + extraPaidMonths), not DOM state

---

### User Story: Comparison display moves into schedule section
As a financing holder, I want the comparison cards (original vs modified), savings banner, and balance chart to appear below the schedule table when planning mode has extras, so that I can see the impact of my planned payments in context.

#### Acceptance Criteria
- **Given** planning mode is ON and extraPaidMonths.size > 0
- **When** I look below the schedule table
- **Then** I see: (1) two comparison cards — "Sem amortização extra" with original totals and "Com amortização extra" with modified totals; (2) a savings banner showing juros economizados, meses a menos, and economia total; (3) a balance chart showing original (dashed gray) vs modified (emerald) curves

- **Given** planning mode is ON and extraPaidMonths is empty
- **When** I look below the schedule table
- **Then** the comparison section is not displayed

- **Given** the base system tab is SAC
- **When** extras are checked
- **Then** comparison uses the SAC schedule as base

- **Given** the base system tab is Price
- **When** extras are checked
- **Then** comparison uses the Price schedule as base


## REMOVED User Stories

### User Story: Standalone extra amortization form
As a financing holder, I wanted to manually add extra payment entries (type, amount, month, modality, FGTS) in a separate form section at the bottom of the page, so that I could simulate extraordinary amortizations.

#### Removal Rationale
Replaced by the integrated planning mode. The checkbox-based interaction in the schedule table is more intuitive — users select months directly instead of filling out a form with abstract parameters. The `ExtraPayment` model (type, amount, month, modality, isFgts) is superseded by the simpler `paidUpToMonth` + `extraPaidMonths` model where amounts are derived from the original schedule. FGTS support is deferred to a future change. Recurring payments are replaced by selecting individual months.
