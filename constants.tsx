export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * ROBUST GOOGLE APPS SCRIPT WEB APP V2.6
 * 
 * Features: 
 * 1. URL Only Mode (Pastes to Column A)
 * 2. Intelligent Duplicate Check (Column A)
 * 3. Dynamic Tab Selection (Auto-creates if missing)
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
      sheet.appendRow(['URL']); // Only URL header
    }

    const lastRow = sheet.getLastRow();
    let existingUrls = [];
    
    // Only attempt to read range if sheet has data
    if (lastRow > 0) {
      // Get all values from Column A (URLs)
      const range = sheet.getRange(1, 1, lastRow, 1);
      const values = range.getValues();
      existingUrls = values.map(row => row[0].toString().trim().toLowerCase());
    }

    let addedCount = 0;
    let skippedCount = 0;

    incomingUrls.forEach(url => {
      const cleanUrl = url.trim();
      const lowerUrl = cleanUrl.toLowerCase();
      
      // Check for duplicates (case-insensitive) in Column A
      if (existingUrls.indexOf(lowerUrl) === -1) {
        // ONLY append the URL (no timestamp)
        sheet.appendRow([cleanUrl]);
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

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
