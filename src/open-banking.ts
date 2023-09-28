const BASE_URI = 'https://bankaccountdata.gocardless.com/api/v2/';

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

  const response = UrlFetchApp.fetch(BASE_URI, requestOptions);
  const json = response.getContentText();
  const token = JSON.parse(json).access as string;

  return token;
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
  return JSON.parse(json);
}

function updateBankList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accountSheet = ss.getSheetByName('Accounts')!;

  // get banks
  accountSheet.getRange('J3:J1000').clear();
  const country = accountSheet.getRange('B1').getValue() as string;
  const institutionList = getInstitutions(country);

  for (const i in institutionList) {
    // 10 = J
    accountSheet
      .getRange(Number(i) + 3, 10)
      .setValue([institutionList[i].name]);
  }
}

function createRequisition(institutionId: string) {
  const url = `${BASE_URI}requisitions/`;
  const token = getToken();

  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const ss = SS.getActiveSheet();
  let redirect_link = '';
  redirect_link += SS.getUrl();
  redirect_link += '#gid=';
  redirect_link += ss.getSheetId();

  const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    payload: JSON.stringify({
      redirect: redirect_link,
      institution_id: institutionId,
    }),
  };

  const response = UrlFetchApp.fetch(url, requestOptions);
  const json = response.getContentText();
  const requisition = JSON.parse(json);

  return requisition;
}
