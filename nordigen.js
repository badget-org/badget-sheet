const ss = SpreadsheetApp.getActiveSpreadsheet();
const transactionsSheet = ss.getSheetByName("Transactions");
const accountSheet = ss.getSheetByName("Accounts");
const transactionRange = transactionsSheet.getRange('A2:F');

function _getFirstEmptyRow() {
  var values = transactionRange.getValues();
  var ct = 0;
  while (values[ct] && values[ct][0] != "") {
    ct++;
  }
  return (ct);
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
      acc[idx] = acc[idx].map((cell, i) => i === 2 ? cell : value[i]);
    }

    return acc;
  }, values);

  transactionRange.setValues(result);
}

function getToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  var userId = scriptProperties.getProperty("NORDIGEN_USER_ID");
  var userKey = scriptProperties.getProperty("NORDIGEN_USER_KEY");

  var raw = JSON.stringify({ "secret_id": userId, "secret_key": userKey });
  var myHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json"
  }

  var requestOptions = {
    'method': 'POST',
    'headers': myHeaders,
    'payload': raw
  };

  var response = UrlFetchApp.fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", requestOptions);
  var json = response.getContentText();
  var token = JSON.parse(json).access;

  return token;
}

function getInstitutions(country, token) {
  var url = "https://bankaccountdata.gocardless.com/api/v2/institutions/?country=" + country;
  var headers = {
    "headers": {
      "accept": "application/json",
      "Authorization": "Bearer " + token
    }
  };

  var response = UrlFetchApp.fetch(url, headers);
  var json = response.getContentText();
  return JSON.parse(json);
}

function getBanks() {
  const token = getToken();

  // get banks
  accountSheet.getRange("J3:J1000").clear();
  var data = getInstitutions("IT", token);

  for (var i in data) {
    // 10 = J
    accountSheet.getRange(Number(i)+3,10).setValue([data[i].name]);
  }
}

function getAccountId(bank) {
  const token = getToken();

  // get institution_id
  var institutions = getInstitutions("IT", token)
  for (var j in institutions) {
    if (institutions[j].name == bank) {
      var institution_id = institutions[j].id;
    }
  }

  var url = "https://bankaccountdata.gocardless.com/api/v2/requisitions/?limit=100&offset=1";
  var headers = {
    "headers": {
      "accept": "application/json",
      "Authorization": "Bearer " + token
    }
  };

  var response = UrlFetchApp.fetch(url, headers);
  var json = response.getContentText();
  var requisitions = JSON.parse(json).results;

  for (var i in requisitions) {
    if (requisitions[i].status == "LN" && requisitions[i].institution_id == institution_id) {
      console.log(requisitions[i].accounts);
      var account_id = requisitions[i].accounts[0]; // FIXME: not precise
    }
  }

  return account_id;
}

function createLink() {
  const token = getToken();

  // create link
  var bank = accountSheet.getRange("E19").getValue();
  var institutions = getInstitutions("IT", token)

  for (var j in institutions) {
    if (institutions[j].name == bank) {
      var institution_id = institutions[j].id;
    }
  }

  var myHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  }

  var SS = SpreadsheetApp.getActiveSpreadsheet();
  var ss = SS.getActiveSheet();
  var redirect_link = '';
  redirect_link += SS.getUrl();
  redirect_link += '#gid=';
  redirect_link += ss.getSheetId(); 

  var raw = JSON.stringify({ "redirect": redirect_link, "institution_id": institution_id });

  var requestOptions = {
    'method': 'POST',
    'headers': myHeaders,
    'payload': raw
  };

  var response = UrlFetchApp.fetch("https://bankaccountdata.gocardless.com/api/v2/requisitions/", requestOptions);
  var json = response.getContentText();
  var requisition_id = JSON.parse(json).id;

  var myHeaders = {
    "accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  }

  var json = response.getContentText();
  var link = JSON.parse(json).link;

  accountSheet.getRange("E20").setValue([link]);
  accountSheet.getRange("E21").setValue([requisition_id]);
}

function getBalance(account_id) {
  const token = getToken();

  const url = "https://bankaccountdata.gocardless.com/api/v2/accounts/" + account_id + "/balances/";
  const headers = {
    "headers": {
      "accept": "application/json",
      "Authorization": "Bearer " + token
    }
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

  for (var j in accounts) {
    var account_id = accounts[j][1];
    var account_name = accounts[j][0];
    var date_from = Utilities.formatDate(new Date("2023/09/01"), Session.getScriptTimeZone(), "yyyy-MM-dd");

    var url = "https://bankaccountdata.gocardless.com/api/v2/accounts/" + account_id + "/transactions/" + "?date_from=" + date_from;
    var headers = {
      "headers": {
        "accept": "application/json",
        "Authorization": "Bearer " + token
      }
    };

    var response = UrlFetchApp.fetch(url, headers);
    var json = response.getContentText();
    var transactions = JSON.parse(json).transactions.booked;


    for (var i in transactions) {
      if (transactions[i].creditorName) {
        var trx_text = transactions[i].creditorName
      } else if (transactions[i].debitorName) {
        var trx_text = transactions[i].debitorName
      } else if (transactions[i].remittanceInformationUnstructured) {
        var trx_text = transactions[i].remittanceInformationUnstructured
      } else if (transactions[i].remittanceInformationUnstructuredArray) {
        var trx_text = transactions[i].remittanceInformationUnstructuredArray
      } else {
        var trx_text = ""
      }
      
      fetchedTransactions.push([
        transactions[i].bookingDate,
        trx_text,
        "",
        Number(transactions[i].transactionAmount.amount),
        account_name,
        transactions[i].internalTransactionId
      ]);
    }
  }

  _upsertTransaction(fetchedTransactions);
  transactionsSheet.sort(1, true);
}