import {
  createInitialAppData,
  getIncomeExpenseTotalsByRange,
  listAccountLedger,
  listBills,
  registerUser,
  saveBill,
} from '@/services/localAppService';
import {Account, BillInput, Category} from '@/types/bill';

function createUserData() {
  const data = registerUser(createInitialAppData(), {
    username: 'tester',
    password: '123456',
    nickname: 'tester',
  });
  const userId = data.currentUserId as number;
  const accounts = data.accounts.filter(
    account => account.userId === userId && !account.isArchived,
  );
  const expenseCategory = data.categories.find(
    category => category.type === 'EXPENSE',
  ) as Category;

  return {
    data,
    userId,
    accounts,
    expenseCategory,
  };
}

function buildPayload(
  sourceAccount: Account,
  expenseCategory: Category,
  patch?: Partial<BillInput>,
): BillInput {
  return {
    type: 'EXPENSE',
    amount: 100,
    categoryId: expenseCategory.id,
    accountType: sourceAccount.type,
    accountId: sourceAccount.id,
    billTime: '2026-04-03 09:30:00',
    remark: 'test bill',
    source: 'MANUAL',
    ...patch,
  };
}

describe('localAppService transfer flow', () => {
  it('updates balances for source and target accounts after transfer bill is saved', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];
    const targetAccount = accounts[1];

    const next = saveBill(
      data,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        amount: 128.5,
        isTransfer: true,
        transferTargetAccountId: targetAccount.id,
      }),
    );

    const nextSource = next.accounts.find(account => account.id === sourceAccount.id);
    const nextTarget = next.accounts.find(account => account.id === targetAccount.id);
    expect(nextSource?.currentBalance).toBe(-128.5);
    expect(nextTarget?.currentBalance).toBe(128.5);
  });

  it('rejects transfer bill when source and target account are the same', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];

    expect(() =>
      saveBill(
        data,
        userId,
        buildPayload(sourceAccount, expenseCategory, {
          isTransfer: true,
          transferTargetAccountId: sourceAccount.id,
        }),
      ),
    ).toThrow('转出与转入账户不能相同');
  });

  it('normalizes transfer bill type to EXPENSE and can hide it from list filters', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];
    const targetAccount = accounts[1];

    const next = saveBill(
      data,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        type: 'INCOME',
        isTransfer: true,
        transferTargetAccountId: targetAccount.id,
      }),
    );

    const storedBill = listBills(next, userId)[0];
    expect(storedBill.type).toBe('EXPENSE');
    expect(storedBill.isTransfer).toBe(true);
    expect(listBills(next, userId, {includeTransfers: false})).toHaveLength(0);
  });

  it('excludes transfer bills from stats totals by default and includes them when enabled', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];
    const targetAccount = accounts[1];

    let next = saveBill(
      data,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        type: 'INCOME',
        amount: 500,
        isTransfer: false,
      }),
    );
    next = saveBill(
      next,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        amount: 80,
        isTransfer: true,
        transferTargetAccountId: targetAccount.id,
      }),
    );

    const defaultTotals = getIncomeExpenseTotalsByRange(
      next,
      userId,
      '2026-04-01',
      '2026-04-30',
    );
    const includeTransferTotals = getIncomeExpenseTotalsByRange(
      next,
      userId,
      '2026-04-01',
      '2026-04-30',
      {includeTransfers: true},
    );

    expect(defaultTotals.incomeTotal).toBe(500);
    expect(defaultTotals.expenseTotal).toBe(0);
    expect(includeTransferTotals.incomeTotal).toBe(500);
    expect(includeTransferTotals.expenseTotal).toBe(80);
  });

  it('supports keyword search by source and target account names for transfer bills', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];
    const targetAccount = accounts[1];

    const next = saveBill(
      data,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        amount: 66,
        isTransfer: true,
        transferTargetAccountId: targetAccount.id,
      }),
    );

    const sourceKeywordResult = listBills(next, userId, {keyword: sourceAccount.name});
    const targetKeywordResult = listBills(next, userId, {keyword: targetAccount.name});

    expect(sourceKeywordResult).toHaveLength(1);
    expect(targetKeywordResult).toHaveLength(1);
    expect(targetKeywordResult[0].isTransfer).toBe(true);
  });

  it('builds account-ledger directions for transfer in/out from account perspective', () => {
    const {data, userId, accounts, expenseCategory} = createUserData();
    const sourceAccount = accounts[0];
    const targetAccount = accounts[1];

    let next = saveBill(
      data,
      userId,
      buildPayload(sourceAccount, expenseCategory, {
        amount: 120,
        isTransfer: true,
        transferTargetAccountId: targetAccount.id,
      }),
    );
    next = saveBill(
      next,
      userId,
      buildPayload(targetAccount, expenseCategory, {
        amount: 50,
        type: 'INCOME',
      }),
    );

    const sourceLedger = listAccountLedger(next, userId, sourceAccount.id);
    const targetLedger = listAccountLedger(next, userId, targetAccount.id);

    expect(
      sourceLedger.some(
        entry =>
          entry.direction === 'TRANSFER_OUT' &&
          entry.bill.amount === 120 &&
          entry.signedAmount === -120,
      ),
    ).toBe(true);
    expect(
      targetLedger.some(
        entry =>
          entry.direction === 'TRANSFER_IN' &&
          entry.bill.amount === 120 &&
          entry.signedAmount === 120,
      ),
    ).toBe(true);
    expect(
      targetLedger.some(
        entry =>
          entry.direction === 'INCOME' &&
          entry.bill.amount === 50 &&
          entry.signedAmount === 50,
      ),
    ).toBe(true);
  });
});
