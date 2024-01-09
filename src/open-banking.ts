type Account = {
  id: string;
};

const BASE_URI = 'https://bankaccountdata.gocardless.com/api/v2/';
const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const activeSheet = activeSpreadsheet.getActiveSheet();
const sheetId = activeSheet.getSheetId();

function getToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const userId = scriptProperties.getProperty('NORDIGEN_SECRET_ID');
  const userKey = scriptProperties.getProperty('NORDIGEN_SECRET_KEY');

  const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({secret_id: userId, secret_key: userKey}),
  };

  const response = UrlFetchApp.fetch(`${BASE_URI}token/new/`, requestOptions);
  const json = response.getContentText();
  const token = JSON.parse(json).access as string;

  return token;
}

function findInstitutionsById(institutionId: string) {
  const url = `${BASE_URI}institutions/${institutionId}`;
  const token = getToken();
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  return JSON.parse(json);
}

function findInstitutionsByCountry(country: string) {
  const url = `${BASE_URI}institutions/?country=${country}`;
  const token = getToken();

  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };

  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  const institutions = JSON.parse(json);

  // return sandbox if dev env
  return sheetId === 782178950
    ? [{id: 'SANDBOXFINANCE_SFIN0000', name: 'Sandbox'}]
    : institutions;
}

function updateBankList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accountSheet = ss.getSheetByName('Accounts')!;

  // get banks
  accountSheet.getRange('J3:J1000').clear();
  const country = accountSheet.getRange('B1').getValue() as string;
  const institutionList = findInstitutionsByCountry(country);

  for (const i in institutionList) {
    // 10 = J
    accountSheet
      .getRange(Number(i) + 3, 10)
      .setValue([institutionList[i].name]);
  }
}

function createRequisition(formObject: {institution_id: string}) {
  const url = `${BASE_URI}requisitions/`;
  const token = getToken();

  let redirect_link = '';
  redirect_link += activeSpreadsheet.getUrl();
  redirect_link += '#gid=';
  redirect_link += sheetId;

  const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    payload: JSON.stringify({
      redirect: redirect_link,
      institution_id: formObject.institution_id,
    }),
  };

  const response = UrlFetchApp.fetch(url, requestOptions);
  const json = response.getContentText();
  const requisition = JSON.parse(json);

  return requisition;
}

function getRequisitions() {
  const url = `${BASE_URI}requisitions/`;
  const token = getToken();
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const ss = SS.getActiveSheet();
  const sheetId = ss.getSheetId();
  const requestOptions = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  const response = UrlFetchApp.fetch(url, requestOptions);
  const json = response.getContentText();
  const requisitions = JSON.parse(json);

  // get institution info for every requisition
  return requisitions.results
    .filter(requisition => {
      return requisition.redirect.endsWith('' + sheetId);
    })
    .map(requisition => {
      const institution = findInstitutionsById(requisition.institution_id);
      const timeLeft =
        new Date().getTime() - new Date(requisition.created).getTime();
      const daysLeft = Math.round(timeLeft / (1000 * 3600 * 24));
      return {
        institution,
        daysLeft,
        ...requisition,
      };
    });
}

// Nordgiden Accounts API

function getAccountMetadata(accountId: string) {
  const url = `${BASE_URI}accounts/${accountId}/`;
  const token = getToken();
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  return JSON.parse(json);
}

function getAccountDetails(accountId: string) {
  const url = `${BASE_URI}accounts/${accountId}/details/`;
  const token = getToken();
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  return JSON.parse(json);
}

function getAccountBalances(accountId: string) {
  const url = `${BASE_URI}accounts/${accountId}/balances/`;
  const token = getToken();
  const headers = {
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  const response = UrlFetchApp.fetch(url, headers);
  const json = response.getContentText();
  return JSON.parse(json);
}
