const ACCOUNTS_SHEET_NAME = 'Accounts';
const BUDGETS_SHEET_NAME = 'Categories';
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

  const now = Date.now().toString();
  const tmp = ssActive.insertSheet(now);

  if (accountSheet) ssActive.deleteSheet(accountSheet);
  if (budgetsSheet) ssActive.deleteSheet(budgetsSheet);
  if (transactionsSheet) ssActive.deleteSheet(transactionsSheet);

  accountSheet = ssTemplate
    .getSheetByName(ACCOUNTS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(ACCOUNTS_SHEET_NAME);
  budgetsSheet = ssTemplate
    .getSheetByName(BUDGETS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(BUDGETS_SHEET_NAME);
  transactionsSheet = ssTemplate
    .getSheetByName(TRANSACTIONS_SHEET_NAME)!
    .copyTo(ssActive)
    .setName(TRANSACTIONS_SHEET_NAME);

  ssActive.deleteSheet(tmp);
};

function createTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists =
    triggers.findIndex(
      trigger => trigger.getUniqueId() === 'TRIGGER_BANK_UPDATE'
    ) !== -1;

  if (!exists) {
    ScriptApp.newTrigger('TRIGGER_BANK_UPDATE')
      .timeBased()
      .everyDays(1)
      .atHour(1)
      .create();
  }
}
