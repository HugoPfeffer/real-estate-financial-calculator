import type { Schedule, ComparisonResult } from '../types';
import { round2 } from '../format';

export function compareSchedules(sac: Schedule, price: Schedule): ComparisonResult {
	return {
		sacTotals: sac.totals,
		priceTotals: price.totals,
		interestSaved: round2(price.totals.totalInterest - sac.totals.totalInterest),
		firstPaymentDelta: round2(sac.totals.firstPayment - price.totals.firstPayment)
	};
}
