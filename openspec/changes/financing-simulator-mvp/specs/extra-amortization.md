## ADDED User Stories

### User Story: Configure lump-sum extra payment
As a user, I want to add a one-time extra payment at a specific month, so that I can see the impact of a lump-sum amortization on my financing.

#### Acceptance Criteria
- **Given** a simulation has been run
- **When** I navigate to the "Amortização Extraordinária" section
- **Then** I can select the base system (SAC or Price)
- **And** I can add an extra payment with: Tipo = Pontual, Valor (R$), Mês, Modalidade (Redução de prazo / Redução de parcela)
- **And** I can add multiple pontual payments at different months
- **And** I can remove any entry from the list

---

### User Story: Configure recurring extra payment
As a user, I want to add a recurring monthly extra payment, so that I can see the cumulative impact of consistent extra amortization.

#### Acceptance Criteria
- **Given** a simulation has been run and I am in the "Amortização Extraordinária" section
- **When** I add an extra payment with Tipo = Recorrente
- **Then** I specify: Valor (R$), A partir do mês, Modalidade (Redução de prazo / Redução de parcela)
- **And** the recurring payment is applied every month from the start month onward
- **And** I can combine recurring with pontual entries in the same simulation

---

### User Story: Simulate extraordinary amortization with term reduction
As a user, I want to simulate extra payments with "redução de prazo" modality, so that I can see how many months I save and how much interest I avoid.

#### Acceptance Criteria
- **Given** a SAC simulation with PV = R$ 400.000, n = 360, i = 10% a.a.
- **When** I add a pontual extra payment of R$ 50.000 at month 24 with modalidade "Redução de prazo"
- **Then** I click "Simular" and the system:
  - Replays the SAC schedule, injecting R$ 50.000 at month 24
  - Keeps the same monthly amortization amount (A = PV/n) for SAC
  - Computes a new shorter term based on reduced balance
  - Shows "Sem extra" vs "Com extra" comparison cards with: Prazo, Total juros (R$), Total pago (R$)
  - Shows savings: juros economizados (R$), meses a menos
- **And** the balance comparison chart shows two lines diverging at month 24

---

### User Story: Simulate extraordinary amortization with payment reduction
As a user, I want to simulate extra payments with "redução de parcela" modality, so that I can see how my monthly payment decreases.

#### Acceptance Criteria
- **Given** a Price simulation with PV = R$ 400.000, n = 360, i = 10% a.a.
- **When** I add a pontual extra payment of R$ 50.000 at month 24 with modalidade "Redução de parcela"
- **Then** I click "Simular" and the system:
  - Replays the Price schedule, injecting R$ 50.000 at month 24
  - Keeps the same remaining term (n_remaining = 336 months)
  - Recalculates PMT using: `PMT_new = SD_adjusted × [i(1+i)^n_rem] / [(1+i)^n_rem - 1]`
  - Shows "Sem extra" vs "Com extra" cards with: Parcela antes (R$), Parcela depois (R$), Total juros (R$), Total pago (R$)
  - Shows savings: juros economizados (R$)

---

### User Story: FGTS extraordinary amortization
As a user, I want to mark an extra payment as FGTS-sourced, so that the system enforces the 24-month interval rule.

#### Acceptance Criteria
- **Given** I add an FGTS extra payment at month 24
- **When** I try to add another FGTS extra payment at month 36 (12 months later)
- **Then** I see the error "Intervalo mínimo de 24 meses entre usos do FGTS"
- **And** the second entry is not accepted until I change the month to ≥ 48

- **Given** I add an FGTS extra payment at month 24
- **When** I add another FGTS extra payment at month 48 (24 months later)
- **Then** both entries are accepted without error

---

### User Story: View with-vs-without comparison
As a user, I want to see a clear "with vs without" comparison after simulating extra payments, so that I can easily quantify the benefit.

#### Acceptance Criteria
- **Given** an extraordinary amortization simulation has been run
- **When** I view the results
- **Then** I see:
  1. Two summary cards: "Sem amortização extra" (Prazo, Total juros, Total pago) and "Com amortização extra" (same fields)
  2. A savings highlight: Juros economizados (R$), Meses a menos (if prazo), Economia total (R$)
  3. A balance chart with two lines: original trajectory and modified trajectory
- **And** all values use BRL formatting
