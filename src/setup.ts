const ACCOUNTS_SHEET_NAME = 'Account';
const BUDGETS_SHEET_NAME = 'Budgets';
const TRANSACTIONS_SHEET_NAME = 'Transactions';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setup = () => {
  const ssTemplate = SpreadsheetApp.openById(
    '1TEcYCaKfinGgDdra7Jk-XchgF9dALsnDYb5oB-wOWOE'
  );

  const ssActive = SpreadsheetApp.getActiveSpreadsheet();
  let accountSheet = ssActive.getSheetByName(ACCOUNTS_SHEET_NAME);
  let budgetsSheet = ssActive.getSheetByName(BUDGETS_SHEET_NAME);
  let transactionsSheet = ssActive.getSheetByName(TRANSACTIONS_SHEET_NAME);

  if (accountSheet) ssActive.deleteSheet(accountSheet);
  if (budgetsSheet) ssActive.deleteSheet(budgetsSheet);
  if (transactionsSheet) ssActive.deleteSheet(transactionsSheet);

  accountSheet = ssTemplate.getSheetByName(ACCOUNTS_SHEET_NAME)!;
  budgetsSheet = ssTemplate.getSheetByName(BUDGETS_SHEET_NAME)!;
  transactionsSheet = ssTemplate.getSheetByName(TRANSACTIONS_SHEET_NAME)!;
  ssActive.insertSheet(ACCOUNTS_SHEET_NAME, 1, {template: accountSheet});
  ssActive.insertSheet(BUDGETS_SHEET_NAME, 1, {template: budgetsSheet});
  ssActive.insertSheet(TRANSACTIONS_SHEET_NAME, 1, {
    template: transactionsSheet,
  });
};
