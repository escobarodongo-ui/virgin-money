import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { account } from "../src/data/account";
import { categoryLabels } from "../src/data/categories";
import { CATEGORIES } from "../src/types";
import { transactions } from "../src/data/transactions";
import { ledgerBalances } from "../src/utils/balances";
import { groupTransactions } from "../src/utils/group";
import { formatBalance, formatSignedAmount } from "../src/utils/money";
import { filterTransactions } from "../src/utils/search";

describe("ledger", () => {
  it("uses one account and unique transactions", () => {
    const ids = new Set(transactions.map((item) => item.id));
    assert.equal(ids.size, transactions.length);
    assert.ok(account.openingBalance > 0);
    assert.equal(account.maskedIdentifier.includes("•"), true);
  });

  it("covers every category from the same collection", () => {
    for (const category of CATEGORIES) {
      assert.ok(transactions.some((item) => item.category === category), category);
      assert.ok(categoryLabels[category]);
    }
  });

  it("keeps the displayed balance equal to the ledger", () => {
    const balances = ledgerBalances(account.openingBalance, transactions);
    assert.equal(balances.available, 7.47);
    assert.ok(balances.pending < 0);
    assert.ok(balances.available < balances.current);
    assert.equal(formatBalance(balances.available), "$7.47");
  });

  it("formats currency with a symbol, cents, and a leading minus", () => {
    assert.equal(formatSignedAmount(120), "+$120.00");
    assert.equal(formatSignedAmount(-46), "-$46.00");
    assert.equal(formatSignedAmount(-1234.56), "-$1,234.56");
    assert.equal(formatSignedAmount(11.9), "+$11.90");
    assert.equal(formatBalance(7.47), "$7.47");
    assert.equal(formatBalance(-20.5), "-$20.50");
    assert.equal(formatSignedAmount(120, false), "+$120");
  });

  it("groups each calendar date once, newest first", () => {
    const groups = groupTransactions(transactions);
    const keys = groups.map((group) => group.key);
    assert.deepEqual(keys, [...keys].sort((a, b) => (a < b ? 1 : -1)));
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(groups.length >= 3);
    assert.match(groups[0].label, /Wednesday, 28 October 2026/);
    const flat = groups.flatMap((group) => group.transactions);
    assert.equal(flat.length, transactions.length);
  });

  it("filters the same collection by description, merchant, category, date, and status", () => {
    assert.equal(filterTransactions(transactions, "   ").length, transactions.length);
    assert.ok(filterTransactions(transactions, "harbor").every((item) => (item.merchant ?? "").includes("Harbor") || item.description.includes("HARBOR")));
    assert.ok(filterTransactions(transactions, "bill payment").every((item) => item.category === "bill_payment"));
    assert.ok(filterTransactions(transactions, "pending").every((item) => item.status === "pending"));
    assert.ok(filterTransactions(transactions, "28 October").length > 0);
    assert.ok(filterTransactions(transactions, "28/10/2026").length > 0);
    const harborGroups = groupTransactions(filterTransactions(transactions, "harbor"));
    assert.ok(harborGroups.length >= 2);
    assert.equal(filterTransactions(transactions, "zzzz-not-a-thing").length, 0);
    const grouped = groupTransactions(filterTransactions(transactions, "seattle"));
    assert.ok(grouped.length >= 1);
    assert.ok(grouped.every((group) => group.transactions.length > 0));
  });
});
