
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * SMART SHEET & GUESTBOOK AUTOMATOR V4.0
 * 
 * Improvements:
 * 1. Smart Field Detection: Tries multiple common guestbook field names.
 * 2. Multi-Payload: Sends data in multiple formats to catch different form types.
 * 3. Enhanced Logging: Better error catching for guestbook targets.
 */

function doPost(e) {
  try {
    const contents = e.postData.contents;
    const data = JSON.parse(contents);
    const incomingUrls = data.urls || [];
    const guestbookTargets = data.guestbookUrls || [];
    const requestedSheetName = (data.sheetName || 'Sheet1').trim();
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(requestedSheetName);
    
    // 1. Google Sheets Logic
    if (!sheet) {
      sheet = spreadsheet.insertSheet(requestedSheetName);
      sheet.appendRow(['URL', 'Timestamp']);
    }

    const lastRow = sheet.getLastRow();
    let existingUrls = [];
    if (lastRow > 0) {
      const range = sheet.getRange(1, 1, lastRow, 1);
      const values = range.getValues();
      existingUrls = values.map(row => row[0].toString().trim().toLowerCase());
    }

    let addedCount = 0;
    incomingUrls.forEach(url => {
      const cleanUrl = url.trim();
      if (existingUrls.indexOf(cleanUrl.toLowerCase()) === -1) {
        sheet.appendRow([cleanUrl, new Date().toLocaleString()]);
        existingUrls.push(cleanUrl.toLowerCase()); 
        addedCount++;
      }
    });

    // 2. Smart Guestbook Submission Logic
    let guestbookHits = 0;
    if (guestbookTargets.length > 0 && incomingUrls.length > 0) {
      incomingUrls.forEach(targetUrl => {
        // We create a "Smart Payload" that tries all common guestbook field names
        const smartPayload = {
          // Common Name fields
          'name': 'LinkBot',
          'author': 'LinkBot',
          'guest_name': 'LinkBot',
          
          // Common Email fields
          'email': 'bot@automator.com',
          'guest_email': 'bot@automator.com',
          
          // Common URL/Website fields
          'url': targetUrl,
          'website': targetUrl,
          'web': targetUrl,
          'link': targetUrl,
          
          // Common Comment/Message fields
          'comment': 'Check out this link: ' + targetUrl,
          'message': 'Check out this link: ' + targetUrl,
          'gb_comment': 'Check out this link: ' + targetUrl,
          'comments': 'Check out this link: ' + targetUrl,
          'text': 'Check out this link: ' + targetUrl,
          
          // Technical fields
          'submit': 'Post Comment',
          'action': 'add'
        };

        guestbookTargets.forEach(gbUrl => {
          try {
            UrlFetchApp.fetch(gbUrl, {
              method: 'post',
              payload: smartPayload,
              followRedirects: true,
              muteHttpExceptions: true,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            guestbookHits++;
          } catch (e) {
            console.error("Failed to hit: " + gbUrl + " Error: " + e.message);
          }
        });
      });
    }

    const result = {
      status: "success",
      sheet: requestedSheetName,
      added: addedCount,
      guestbookAttempts: guestbookHits,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
