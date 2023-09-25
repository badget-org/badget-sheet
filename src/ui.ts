function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .createMenu('BadgetSheet')
    .addItem('Show sidebar', 'showSidebar')
    .addItem('Setup', 'setup')
    .addToUi();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showSidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile('./ui/sidebar.html').setTitle(
      'Badget Sheet'
    );
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .showSidebar(html);
}
