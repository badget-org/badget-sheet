const BASE_URI = 'https://bankaccountdata.gocardless.com/api/v2/';

function getToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const userId = scriptProperties.getProperty('NORDIGEN_USER_ID');
  const userKey = scriptProperties.getProperty('NORDIGEN_USER_KEY');

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
