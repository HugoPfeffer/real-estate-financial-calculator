export interface RawInputs {
	propertyValue: number;
	downPaymentPercent: number;
	termMonths: number;
	annualInterestRate: number;
	grossMonthlyIncome: number;
	netMonthlyIncome: number;
	fgtsBalance: number;
	coBorrowerIncome: number;
	monthlyTR: number;
}

export interface ValidatedInputs {
	propertyValue: number;
	downPaymentPercent: number;
	termMonths: number;
	annualInterestRate: number;
	grossMonthlyIncome: number;
	netMonthlyIncome: number;
	fgtsBalance: number;
	coBorrowerIncome: number;
	monthlyTR: number;
	financedAmount: number;
	monthlyInterestRate: number;
	totalGrossIncome: number;
}

export interface Period {
	month: number;
	payment: number;
	amortization: number;
	interest: number;
	balance: number;
	cumulativeInterest: number;
	cumulativeAmortization: number;
}

export interface Totals {
	totalPayment: number;
	totalInterest: number;
	totalAmortization: number;
	firstPayment: number;
	lastPayment: number;
}

export interface Schedule {
	system: 'sac' | 'price';
	periods: Period[];
	totals: Totals;
}

export interface ComparisonResult {
	sacTotals: Totals;
	priceTotals: Totals;
	interestSaved: number;
	firstPaymentDelta: number;
}

export interface BankPreset {
	id: string;
	name: string;
	annualRate: number;
	referenceDate: string;
	isDefault: boolean;
}

export interface ExtraPayment {
	type: 'pontual' | 'recorrente';
	amount: number;
	month: number;
	modality: 'prazo' | 'parcela';
	isFgts: boolean;
}

export interface SavingsSummary {
	interestSaved: number;
	termReduction: number;
	totalSaved: number;
}

export interface ValidationError {
	field: string;
	message: string;
}

export type ValidationResult =
	| { ok: true; data: ValidatedInputs }
	| { ok: false; errors: ValidationError[] };
