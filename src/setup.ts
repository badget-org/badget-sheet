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

const getAccounts = () => {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const accountsSheet = activeSpreadsheet.getSheetByName(ACCOUNTS_SHEET_NAME)!;

  const newAccounts: Account[] = [];
  const accountsRange = accountsSheet.getRange('B2:G');
  const requisitions = getRequisitions() as Requisition[];

  requisitions.forEach(requisition => {
    const timeLPassed =
      new Date().getTime() - new Date(requisition.created).getTime();
    const daysPassed = Math.round(timeLPassed / (1000 * 3600 * 24));

    requisition.accounts.forEach(account => {
      const metadata = getAccountMetadata(account);
      const details = getAccountDetails(account);
      const balances = getAccountBalances(account);
      const institution = findInstitutionsById(metadata.institution_id);

      const newAccount = {
        id: account,
        institutionName: institution.name,
        accountName: details.account.name,
        lastUpdate: Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        ),
        linkExpiration: 90 - daysPassed + ' days left',
        balance: Number(balances.balances[0].balanceAmount.amount),
      } satisfies Account;

      newAccounts.push(newAccount);
    });
  });

  _upsertAccount(accountsRange, newAccounts);
};

function getTransactions() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const accountsSheet = activeSpreadsheet.getSheetByName(ACCOUNTS_SHEET_NAME)!;
  const transactionsSheet = activeSpreadsheet.getSheetByName(
    TRANSACTIONS_SHEET_NAME
  )!;

  const transactionRange = transactionsSheet.getRange('A2:F');
  const currentDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy'
  );

  if (currentDate !== '2024') {
    Logger.log(currentDate + ' is not current year');
    return;
  }

  const accounts = accountsSheet.getRange(2, 1, 10, 7).getValues();

  // get transactions
  const newTransactions = [];

  for (const j in accounts) {
    const account_id = accounts[j][3];
    const account_name = accounts[j][2];

    let transactions: NordigenTransaction[] = [];

    try {
      transactions = getAccountTransactions(account_id).transactions.booked;
    } catch (e) {
      Logger.log(e);
      continue;
    }

    for (const i in transactions) {
      let trx_text = '';
      if (transactions[i].creditorName) {
        trx_text = transactions[i].creditorName;
      } else if (transactions[i].debitorName) {
        trx_text = transactions[i].debitorName;
      } else if (transactions[i].remittanceInformationUnstructured) {
        trx_text = transactions[i].remittanceInformationUnstructured;
      } else if (transactions[i].remittanceInformationUnstructuredArray) {
        trx_text = transactions[i].remittanceInformationUnstructuredArray;
      } else {
        trx_text = '';
      }

      const newTransaction = {
        bookingDate: transactions[i].bookingDate,
        description: trx_text,
        category: '',
        amount: Number(transactions[i].transactionAmount.amount),
        account: account_name,
        id:
          transactions[i].internalTransactionId ||
          transactions[i].transactionId,
      } satisfies Transaction;

      newTransactions.push(newTransaction);
    }
  }

  _upsertTransaction(transactionRange, newTransactions);
  transactionsSheet.sort(1, true);
}

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
