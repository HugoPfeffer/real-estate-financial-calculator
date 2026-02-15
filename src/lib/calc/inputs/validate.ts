import type { RawInputs, ValidatedInputs, ValidationError, ValidationResult } from '../types';

export function validate(inputs: RawInputs): ValidationResult {
	const errors: ValidationError[] = [];

	if (!inputs.propertyValue || inputs.propertyValue <= 0) {
		errors.push({ field: 'propertyValue', message: 'Campo obrigatório' });
	} else if (inputs.propertyValue > 2_250_000) {
		errors.push({ field: 'propertyValue', message: 'Valor do imóvel excede o teto do SFH (R$ 2.250.000)' });
	}

	if (!inputs.downPaymentPercent || inputs.downPaymentPercent < 20) {
		errors.push({ field: 'downPaymentPercent', message: 'Entrada mínima de 20% do valor do imóvel' });
	}

	if (!inputs.termMonths || inputs.termMonths < 1 || inputs.termMonths > 420) {
		errors.push({ field: 'termMonths', message: 'Prazo deve ser entre 1 e 420 meses' });
	}

	if (!inputs.annualInterestRate || inputs.annualInterestRate <= 0) {
		errors.push({ field: 'annualInterestRate', message: 'Campo obrigatório' });
	} else if (inputs.annualInterestRate > 12) {
		errors.push({ field: 'annualInterestRate', message: 'Taxa excede o limite do SFH (12% a.a.)' });
	}

	if (!inputs.grossMonthlyIncome || inputs.grossMonthlyIncome <= 0) {
		errors.push({ field: 'grossMonthlyIncome', message: 'Campo obrigatório' });
	}

	if (!inputs.netMonthlyIncome || inputs.netMonthlyIncome <= 0) {
		errors.push({ field: 'netMonthlyIncome', message: 'Campo obrigatório' });
	}

	if (inputs.fgtsBalance > 0 && inputs.propertyValue > 1_500_000) {
		errors.push({ field: 'fgtsBalance', message: 'FGTS não disponível para imóveis acima de R$ 1.500.000' });
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	const financedAmount = inputs.propertyValue * (1 - inputs.downPaymentPercent / 100);
	const monthlyInterestRate = Math.pow(1 + inputs.annualInterestRate / 100, 1 / 12) - 1;
	const totalGrossIncome = inputs.grossMonthlyIncome + (inputs.coBorrowerIncome || 0);

	return {
		ok: true,
		data: {
			...inputs,
			financedAmount,
			monthlyInterestRate,
			totalGrossIncome
		}
	};
}
