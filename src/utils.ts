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

  const result = accounts.reduce((acc, value) => {
    const idx = acc.findIndex(row => row[3] === value[2]);
    if (idx === -1) {
      acc[nextEmptyRow] = value;
      nextEmptyRow++;
    } else {
      acc[idx] = acc[idx].map((cell, i) => (i === 3 ? cell : value[i]));
    }

    return acc;
  }, values);

  range.setValues(result);
}
