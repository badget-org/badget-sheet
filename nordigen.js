const ss = SpreadsheetApp.getActiveSpreadsheet();
const transactionsSheet = ss.getSheetByName('Transactions');
const accountSheet = ss.getSheetByName('Accounts');
const transactionRange = transactionsSheet.getRange('A2:F');

function _getFirstEmptyRow() {
  const values = transactionRange.getValues();
  let ct = 0;
  while (values[ct] && values[ct][0] != '') {
    ct++;
  }
  return ct;
}

function _upsertTransaction(transactions) {
  const values = transactionRange.getValues();
  let nextEmptyRow = _getFirstEmptyRow();

  const result = transactions.reduce((acc, value) => {
    const idx = acc.findIndex(row => row[5] === value[5]);
    if (idx === -1) {
      acc[nextEmptyRow] = value;
      nextEmptyRow++;
    } else {
      acc[idx] = acc[idx].map((cell, i) => (i === 2 ? cell : value[i]));
    }

    return acc;
  }, values);

  transactionRange.setValues(result);
}

function getAccountId(bank) {
  const token = getToken();

  // get institution_id
  const institutions = getInstitutions('IT', token);
  for (const j in institutions) {
    if (institutions[j].name == bank) {
      var institution_id = institutions[j].id;
    }
  }

  const url =
    'https://bankaccountdata.gocardless.com/api/v2/requisitions/?limit=100&offset=1';
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };

  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  const requisitions = JSON.parse(json).results;

  for (const i in requisitions) {
    if (
      requisitions[i].status == 'LN' &&
      requisitions[i].institution_id == institution_id
    ) {
      console.log(requisitions[i].accounts);
      var account_id = requisitions[i].accounts[0]; // FIXME: not precise
    }
  }

  return account_id;
}

function getBalance(account_id) {
  const token = getToken();

  const url =
    'https://bankaccountdata.gocardless.com/api/v2/accounts/' +
    account_id +
    '/balances/';
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };

  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  const balance = JSON.parse(json).balances[0];

  return Number(balance.balanceAmount.amount);
}

function getTransactions() {
  const accounts = accountSheet.getRange(3, 1, 4, 6).getValues();

  // get token
  const token = getToken();

  // get transactions
  transactionsSheet.sort(1, true);

  const fetchedTransactions = [];

  for (const j in accounts) {
    const account_id = accounts[j][1];
    const account_name = accounts[j][0];
    const date_from = Utilities.formatDate(
      new Date('2023/09/01'),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );

    const url =
      'https://bankaccountdata.gocardless.com/api/v2/accounts/' +
      account_id +
      '/transactions/' +
      '?date_from=' +
      date_from;
    const headers = {
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + token,
      },
    };

    const response = UrlFetchApp.fetch(url, headers);
    const json = response.getContentText();
    const transactions = JSON.parse(json).transactions.booked;

    for (const i in transactions) {
      if (transactions[i].creditorName) {
        var trx_text = transactions[i].creditorName;
      } else if (transactions[i].debitorName) {
        var trx_text = transactions[i].debitorName;
      } else if (transactions[i].remittanceInformationUnstructured) {
        var trx_text = transactions[i].remittanceInformationUnstructured;
      } else if (transactions[i].remittanceInformationUnstructuredArray) {
        var trx_text = transactions[i].remittanceInformationUnstructuredArray;
      } else {
        var trx_text = '';
      }

      fetchedTransactions.push([
        transactions[i].bookingDate,
        trx_text,
        '',
        Number(transactions[i].transactionAmount.amount),
        account_name,
        transactions[i].internalTransactionId,
      ]);
    }
  }

  _upsertTransaction(fetchedTransactions);
  transactionsSheet.sort(1, true);
}
