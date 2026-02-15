const brlFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

export function formatBRL(value: number): string {
	return brlFormatter.format(value);
}

export function formatPercent(value: number): string {
	return percentFormatter.format(value) + '%';
}

export function parseBRL(input: string): number {
	const cleaned = input
		.replace(/[R$\s]/g, '')
		.replace(/\./g, '')
		.replace(',', '.');
	const result = parseFloat(cleaned);
	return isNaN(result) ? 0 : result;
}

export function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
