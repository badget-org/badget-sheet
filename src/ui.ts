function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .createMenu('Badget')
    .addItem('Show sidebar', 'showSidebar')
    .addItem('Setup', 'setup')
    .addToUi();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showSidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile('ui/sidebar.html').setTitle('Badget.');
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .showSidebar(html);
}

function getNordigenSecrets(): {secret_id: string; secret_key: string} {
  const userProperties = PropertiesService.getUserProperties();
  return {
    secret_id: userProperties.getProperty('NORDIGEN_SECRET_ID') ?? '',
    secret_key: userProperties.getProperty('NORDIGEN_SECRET_KEY') ?? '',
  };
}

function setupForm(formObject: {secret_id: string; secret_key: string}) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('NORDIGEN_SECRET_ID', formObject.secret_id);
  userProperties.setProperty('NORDIGEN_SECRET_KEY', formObject.secret_key);

  // TODO: show success toaster
}
