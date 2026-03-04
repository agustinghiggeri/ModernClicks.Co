// ---- DELETE EVERYTHING IN Code.gs AND PASTE ONLY THIS ----

var SHEET_ID = '1k9gomK3YaXvBfrqfxCznrbbSmQjpNoJnFZPndG8O_gI';

function doPost(e) {
  try {
    var p = e.parameter;

    function clean(val) {
      return String(val || '').replace(/<[^>]*>/g, '').trim().substring(0, 500);
    }

    // Determine which sheet to use based on sheetName parameter
    var sheetParam = p.sheetName || '';
    var targetSheetName;

    // V2 routes (discovery call funnels - email + phone only)
    if (sheetParam === 'main_discovery_v2') {
      targetSheetName = 'Discovery V2';
    } else if (sheetParam === 'audit_discovery_v2') {
      targetSheetName = 'Audit Discovery V2';
    }
    // V1 routes (original funnels - full qualification)
    else if (sheetParam === 'audit') {
      targetSheetName = 'audit';
    } else {
      targetSheetName = 'Sheet1';
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(targetSheetName);

    // Create sheet if it doesn't exist (for v2 sheets)
    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
      // Add headers based on sheet type
      if (targetSheetName === 'Discovery V2' || targetSheetName === 'Audit Discovery V2') {
        sheet.appendRow(['Timestamp', 'Email', 'Phone', 'Discovery Completed', 'Presentation Booked', 'Presentation Completed', 'Status']);
      }
    }

    // Route to appropriate handler based on sheet
    if (targetSheetName === 'Discovery V2' || targetSheetName === 'Audit Discovery V2') {
      // V2 Discovery forms: email, phone, timestamp only
      sheet.appendRow([
        clean(p.timestamp) || new Date().toISOString(),
        clean(p.email),
        clean(p.phone),
        '', // Discovery Completed (manual update)
        '', // Presentation Booked (manual update)
        '', // Presentation Completed (manual update)
        'New' // Status
      ]);
    } else if (targetSheetName === 'audit') {
      // V1 Audit form: email, phone, brand, siteUrl, platform, adSpend, businessType
      sheet.appendRow([
        new Date().toISOString(),
        clean(p.email),
        clean(p.phone),
        clean(p.brand),
        clean(p.siteUrl),
        clean(p.platform),
        clean(p.adSpend),
        clean(p.businessType)
      ]);
    } else {
      // V1 Main form: email, phone, brand, adSpend, businessType
      sheet.appendRow([
        new Date().toISOString(),
        clean(p.email),
        clean(p.phone),
        clean(p.brand),
        clean(p.adSpend),
        clean(p.businessType)
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', sheet: targetSheetName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
