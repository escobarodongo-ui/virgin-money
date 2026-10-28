import type { Account } from "../types";
import { transactions } from "./transactions";
import { roundMoney } from "../utils/money";

/** Shown balance. Opening is derived so this stays equal to the ledger. */
export const displayedBalance = 7.47;

const movement = roundMoney(transactions.reduce((sum, item) => sum + item.amount, 0));

export const account: Account = {
  id: "go-account",
  name: "Go Account",
  holderName: "Alex Morgan",
  holderFirstName: "Alex",
  type: "Transaction",
  currency: "AUD",
  currencyName: "Australian dollar",
  displayIdentifier: "0000 111 000024581",
  maskedIdentifier: "0000 111 •••••4581",
  openingBalance: roundMoney(displayedBalance - movement),
};
