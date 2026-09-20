export type FinancialTransactionType = "income" | "expense" | "transfer";

export type FinancialTransactionAmount = Readonly<{
  amount: number;
  txType: FinancialTransactionType;
  currency?: string;
}>;

export type FinancialTotals = Readonly<{
  currency: string | null;
  income: number;
  expense: number;
  net: number;
  includedTransactions: number;
  excludedTransfers: number;
}>;

function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError("Transaction amount must be finite");
  }
  const rounded = Math.round((amount + Math.sign(amount) * Number.EPSILON) * 100);
  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError("Transaction amount exceeds safe numeric precision");
  }
  return rounded;
}

function normalizeCurrency(currency: string | undefined): string | null {
  const normalized = currency?.trim().toUpperCase();
  return normalized ? normalized : null;
}

/**
 * Totals one currency without counting transfers as income or expense.
 *
 * Mixed currencies require an explicit currency filter because P0 deliberately
 * performs no automatic foreign-exchange conversion.
 */
export function calculateFinancialTotals(
  transactions: readonly FinancialTransactionAmount[],
  currency?: string,
): FinancialTotals {
  const requestedCurrency = normalizeCurrency(currency);
  let summaryCurrency = requestedCurrency;
  let incomeMinor = 0;
  let expenseMinor = 0;
  let includedTransactions = 0;
  let excludedTransfers = 0;

  for (const transaction of transactions) {
    if (transaction.txType === "transfer") {
      excludedTransfers += 1;
      continue;
    }

    const transactionCurrency = normalizeCurrency(transaction.currency);
    if (requestedCurrency && transactionCurrency !== requestedCurrency) {
      continue;
    }

    if (summaryCurrency && transactionCurrency && transactionCurrency !== summaryCurrency) {
      throw new RangeError("Cannot total multiple currencies without a currency filter");
    }
    summaryCurrency ??= transactionCurrency;

    const amountMinor = toMinorUnits(transaction.amount);
    if (transaction.txType === "income") {
      incomeMinor += amountMinor;
    } else {
      expenseMinor += amountMinor;
    }
    includedTransactions += 1;
  }

  const income = incomeMinor / 100;
  const expense = expenseMinor / 100;
  return {
    currency: summaryCurrency,
    income,
    expense,
    net: (incomeMinor - expenseMinor) / 100,
    includedTransactions,
    excludedTransfers,
  };
}
