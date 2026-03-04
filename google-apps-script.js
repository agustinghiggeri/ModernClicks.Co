// ---- DELETE EVERYTHING IN Code.gs AND PASTE ONLY THIS ----
// IMPORTANT: Set SHEET_ID via Project Settings > Script Properties (key: SHEET_ID)
// Do NOT hardcode it here. Run initProperties() once after deploying.

function initProperties() {
  // Run this function ONCE manually after first deploy to set the sheet ID
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', 'YOUR_SHEET_ID_HERE');
}

function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_ID');
}

// Simple per-email rate limiting: max 3 submissions per hour
function isRateLimited(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  var count = parseInt(cache.get(key) || '0', 10);
  if (count >= 3) return true;
  cache.put(key, String(count + 1), 3600); // 1-hour window
  return false;
}

function doPost(e) {
  try {
    var p = e.parameter;

    // ── Admin: config write action ─────────────────────────────────────────
    if (p.action === 'setConfig') {
      var token = p.token || '';
      var adminToken = getAdminToken();
      if (!adminToken || token !== adminToken) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      try {
        var cfgObj = JSON.parse(p.config || '{}');
        writeConfigToSheet(cfgObj);
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'ok' }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (parseErr) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid config JSON' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- Sanitize: strip HTML tags, cap length, and block formula injection ---
    function clean(val) {
      var str = String(val || '').replace(/<[^>]*>/g, '').trim().substring(0, 500);
      // Prevent spreadsheet formula injection (cells starting with =, +, -, @, tab, CR)
      if (/^[=+\-@\t\r`]/.test(str)) {
        str = "'" + str;
      }
      return str;
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

    // Rate limit by email
    var emailVal = clean(p.email);
    if (!emailVal || isRateLimited(emailVal)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' })) // Return ok silently to avoid info leak
        .setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.openById(getSheetId());
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

// ── Config sheet helpers ────────────────────────────────────────────────────

function getConfigSheet() {
  var ss    = SpreadsheetApp.openById(getSheetId());
  var sheet = ss.getSheetByName('Config');
  if (!sheet) {
    sheet = ss.insertSheet('Config');
    sheet.appendRow(['key', 'value']);
  }
  return sheet;
}

function readConfigFromSheet() {
  var sheet = getConfigSheet();
  var data  = sheet.getDataRange().getValues();
  var cfg   = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0]; var val = data[i][1];
    if (!key) continue;
    // Parse booleans and numbers stored as strings
    if (val === 'true')  val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(val) && val !== '') val = Number(val);
    cfg[key] = val;
  }
  return cfg;
}

function writeConfigToSheet(cfgObj) {
  var sheet = getConfigSheet();
  // Clear existing data (keep header)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  // Write each key-value pair
  var rows = [];
  for (var k in cfgObj) {
    if (cfgObj.hasOwnProperty(k)) rows.push([k, String(cfgObj[k])]);
  }
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function getAdminToken() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
}

// ── GET: serve public config + handle enumeration guard ─────────────────────

function doGet(e) {
  var action = e && e.parameter ? (e.parameter.action || '') : '';

  if (action === 'config') {
    try {
      var cfg = readConfigFromSheet();
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', config: cfg }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', config: {} }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // All other GET requests: return nothing useful
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
