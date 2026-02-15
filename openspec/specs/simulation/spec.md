## ADDED User Stories

### User Story: Enter financing parameters
As a user, I want to enter my property value, down payment, financing term, interest rate, and income details into a form, so that I can simulate mortgage financing options.

#### Acceptance Criteria
- **Given** the application is loaded
- **When** I view the input form
- **Then** I see fields for: Valor do imóvel (R$), Entrada (% or R$), Prazo (meses), Taxa de juros anual (% a.a.), Renda bruta mensal (R$), Renda líquida mensal (R$), Saldo FGTS (R$), Renda co-participante (R$), TR mensal estimada (% a.m., optional, default 0)
- **And** all monetary fields accept Brazilian formatting (R$ 1.234,56)
- **And** the Prazo field defaults to 360 months
- **And** the Entrada field defaults to 30%

---

### User Story: Select bank rate preset
As a user, I want to select a bank from a dropdown to auto-fill the interest rate, so that I don't have to look up current rates manually.

#### Acceptance Criteria
- **Given** the input form is displayed
- **When** I select "Caixa" from the bank preset dropdown
- **Then** the Taxa de juros anual field is auto-filled with 10.49% a.a. (+TR)
- **And** the following banks are shipped as defaults (Feb 2026 reference):
  - Caixa: 10.49% a.a.
  - Banco do Brasil: 12.00% a.a.
  - Itaú: 11.60% a.a.
  - Santander: 11.79% a.a.
  - Pro-Cotista (Caixa): 9.01% a.a.
- **And** selecting a bank does NOT trigger simulation — I must click "Simular"
- **And** I can manually override the auto-filled rate

---

### User Story: Manage bank rate presets
As a user, I want to add, edit, or remove bank rate presets, so that I can keep the rates up to date or add my own bank.

#### Acceptance Criteria
- **Given** the preset management UI is accessible (e.g., via a settings/edit button near the bank dropdown)
- **When** I add a new preset with name "Meu Banco" and rate 11.00% a.a.
- **Then** "Meu Banco" appears in the bank dropdown with rate 11.00%
- **And** the new preset persists across page reloads (stored in localStorage)

- **Given** I have the default presets loaded
- **When** I edit the Caixa preset to change the rate from 10.49% to 10.80%
- **Then** selecting Caixa auto-fills 10.80% instead of 10.49%
- **And** the change persists in localStorage

- **Given** I have modified or added presets
- **When** I click "Restaurar padrões"
- **Then** all presets are reset to the shipped defaults (Caixa 10.49%, BB 12.00%, Itaú 11.60%, Santander 11.79%, Pro-Cotista 9.01%)
- **And** any user-added presets are removed

- **Given** I remove a preset
- **When** I view the bank dropdown
- **Then** the removed preset no longer appears

---

### User Story: Validate inputs against SFH rules
As a user, I want to see validation errors before simulation runs, so that I know my parameters are within regulatory limits.

#### Acceptance Criteria
- **Given** I have entered a property value of R$ 3.000.000
- **When** I click "Simular"
- **Then** I see the error "Valor do imóvel excede o teto do SFH (R$ 2.250.000)" and simulation does not run

- **Given** I have entered an Entrada of 10% (LTV 90%)
- **When** I click "Simular"
- **Then** I see the error "Entrada mínima de 20% do valor do imóvel"

- **Given** I have entered a Taxa de juros of 15% a.a.
- **When** I click "Simular"
- **Then** I see the error "Taxa excede o limite do SFH (12% a.a.)"

- **Given** I have entered FGTS balance > 0 and property value > R$ 1.500.000
- **When** I click "Simular"
- **Then** I see the warning "FGTS não disponível para imóveis acima de R$ 1.500.000"

---

### User Story: Run SAC and Price simulation
As a user, I want to click "Simular" and see both SAC and Price amortization results, so that I can compare the two systems.

#### Acceptance Criteria
- **Given** I have entered valid parameters: Valor R$ 500.000, Entrada 20%, Prazo 360 meses, Taxa 10% a.a.
- **When** I click "Simular"
- **Then** the system computes:
  - Financed amount (PV) = R$ 400.000
  - Monthly rate: `i = (1 + 0.10)^(1/12) - 1 ≈ 0.007974` (0.7974% a.m.)
  - SAC schedule: A = R$ 400.000 / 360 = R$ 1.111,11; P_1 = R$ 1.111,11 + (R$ 400.000 × 0.007974) = R$ 4.300,72
  - Price schedule: PMT = R$ 400.000 × [0.007974 × (1.007974)^360] / [(1.007974)^360 - 1]
- **And** SAC total interest is less than Price total interest
- **And** both schedules' final balance equals R$ 0,00

---

### User Story: View comparison summary
As a user, I want to see a side-by-side summary of SAC vs Price results, so that I can quickly understand the key differences.

#### Acceptance Criteria
- **Given** a simulation has been run
- **When** I view the comparison section
- **Then** I see two summary cards showing for each system: primeira parcela (R$), última parcela (R$), total de juros (R$), total pago (R$)
- **And** I see a savings highlight: "Economia SAC vs Price: R$ X.XXX,XX em juros"
- **And** all values use BRL formatting (R$ with dot thousands separator and comma decimal)

---

### User Story: View amortization schedule
As a user, I want to browse the full month-by-month amortization schedule, so that I can see payment details for any period.

#### Acceptance Criteria
- **Given** a simulation has been run
- **When** I view the schedule section
- **Then** I see a table with columns: Mês, Parcela (R$), Amortização (R$), Juros (R$), Saldo Devedor (R$)
- **And** I can toggle between SAC and Price tabs
- **And** for a 360-month schedule, the table uses virtual scrolling (only visible rows are rendered)
- **And** all monetary values are formatted as BRL (R$ 1.234,56)

---

### User Story: View comparison charts
As a user, I want to see charts comparing SAC and Price, so that I can visually understand the payment evolution, interest composition, and balance trajectory.

#### Acceptance Criteria
- **Given** a simulation has been run
- **When** I view the charts section
- **Then** I see three charts:
  1. **Evolução das Parcelas**: line chart with SAC (decreasing) and Price (flat) lines over months
  2. **Composição da Parcela**: stacked area chart per system showing Juros vs Amortização over time
  3. **Saldo Devedor**: line chart with SAC (linear decline) and Price (concave curve) over months
- **And** charts have tooltips showing exact values on hover
- **And** charts use pt-BR labels and BRL formatting

---

### User Story: Income commitment warning
As a user, I want to be warned if the highest first installment exceeds 30% of my gross income, so that I know the financing may be unaffordable.

#### Acceptance Criteria
- **Given** I have entered Renda bruta = R$ 10.000 and Renda co-participante = R$ 0
- **When** the simulation computes a first SAC payment of R$ 4.300 (43% of income)
- **Then** I see a warning: "Parcela excede 30% da renda bruta mensal (R$ 3.000,00)"
- **And** the simulation results are still displayed (warning is non-blocking)
