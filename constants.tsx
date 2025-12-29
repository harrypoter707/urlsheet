
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * ROBUST GOOGLE APPS SCRIPT WEB APP V2.5
 * 
 * Features: 
 * 1. Intelligent Duplicate Check (Column B)
 * 2. Dynamic Tab Selection (Auto-creates if missing)
 * 3. Empty Sheet Handling
 */

function doPost(e) {
  try {
    const contents = e.postData.contents;
    const data = JSON.parse(contents);
    const incomingUrls = data.urls || [];
    const requestedSheetName = (data.sheetName || 'Sheet1').trim();
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(requestedSheetName);
    
    // Auto-create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(requestedSheetName);
      sheet.appendRow(['Timestamp', 'URL']);
    }

    const lastRow = sheet.getLastRow();
    let existingUrls = [];
    
    // Only attempt to read range if sheet has data
    if (lastRow > 0) {
      // Get all values from Column B (URLs)
      const range = sheet.getRange(1, 2, lastRow, 1);
      const values = range.getValues();
      existingUrls = values.map(row => row[0].toString().trim().toLowerCase());
    }

    let addedCount = 0;
    let skippedCount = 0;

    incomingUrls.forEach(url => {
      const cleanUrl = url.trim();
      const lowerUrl = cleanUrl.toLowerCase();
      
      // Check for duplicates (case-insensitive)
      if (existingUrls.indexOf(lowerUrl) === -1) {
        sheet.appendRow([new Date(), cleanUrl]);
        existingUrls.push(lowerUrl); 
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    const result = {
      status: "success",
      sheet: requestedSheetName,
      added: addedCount,
      skipped: skippedCount,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
