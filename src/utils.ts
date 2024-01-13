function _getFirstEmptyRow(range: GoogleAppsScript.Spreadsheet.Range) {
  const values = range.getValues();
  let ct = 0;
  while (values[ct] && values[ct][1] !== '') {
    ct++;
  }
  return ct;
}

function _upsertAccount(
  range: GoogleAppsScript.Spreadsheet.Range,
  accounts: Account[]
) {
  const values = range.getValues();
  let nextEmptyRow = _getFirstEmptyRow(range);

  const result = accounts.reduce((acc, account) => {
    const idx = acc.findIndex(row => row[2] === account.id);
    if (idx === -1) {
      acc[nextEmptyRow] = [
        account.institutionName,
        account.accountName,
        account.id,
        account.lastUpdate,
        account.linkExpiration,
        account.balance,
      ];
      nextEmptyRow++;
    } else {
      acc[idx] = [
        account.institutionName,
        account.accountName,
        account.id,
        account.lastUpdate,
        account.linkExpiration,
        account.balance,
      ];
    }

    return acc;
  }, values);

  range.setValues(result);
}

function _upsertTransaction(
  range: GoogleAppsScript.Spreadsheet.Range,
  transactions: Transaction[]
) {
  const values = range.getValues();
  let nextEmptyRow = _getFirstEmptyRow(range);

  const result = transactions.reduce((acc, transaction) => {
    const idx = acc.findIndex(row => row[5] === transaction.id);
    if (idx === -1) {
      acc[nextEmptyRow] = [
        transaction.bookingDate,
        transaction.description,
        transaction.category,
        transaction.amount,
        transaction.account,
        transaction.id,
      ];
      nextEmptyRow++;
    } else {
      acc[idx] = acc[idx].map((cell, i) => {
        if (i === 0) return transaction.bookingDate;
        if (i === 1) return transaction.description;
        if (i === 2) return cell;
        if (i === 3) return transaction.amount;
        if (i === 4) return transaction.account;
        if (i === 5) return transaction.id;
      });
    }

    return acc;
  }, values);

  range.setValues(result);
}
