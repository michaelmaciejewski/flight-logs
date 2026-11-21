/**
 * Flight Log – Google Sheet backend for the GitHub Pages dashboard.
 *
 * Anyone can READ the flight rows (that's what the public page shows).
 * Only someone with the TOKEN can ADD / EDIT / DELETE flights.
 * The sheet itself stays private; the page never links to it.
 *
 * SETUP (one time)
 * 1. In your Google Sheet: Extensions → Apps Script. Delete what's there, paste this file.
 * 2. Set TOKEN below to the token shown in the dashboard's "Connect" panel (or use
 *    the panel's "Copy script" button, which fills it in for you). Save.
 * 3. Deploy → New deployment → type "Web app".  Execute as: Me.  Who has access: Anyone.
 *    Approve the permission prompt, then copy the Web app URL (ends in /exec).
 * 4. On the dashboard, paste the URL + token into the Connect panel and press Connect.
 *
 * After changing this code: Deploy → Manage deployments → Edit (pencil) → Version: New version.
 * That keeps the same URL.
 */
var TOKEN = '__TOKEN__';
var MAIN = 'Flight Information';
var ALLOWED = [MAIN, 'Coords'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    out = p.range ? { ok: true, values: read_(p.range) }
                  : { ok: true, values: read_("'" + MAIN + "'!A:Z"), coords: read_('Coords!A:C') };
  } catch (err) {
    out = { ok: false, code: 'tool_error', error: String((err && err.message) || err) };
  }
  return send_(out, p.callback);
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || (e && e.parameter && e.parameter.payload) || '{}');
  } catch (x) {}
  if (!TOKEN || TOKEN === '__TOKEN__' || body.token !== TOKEN) {
    return send_({ ok: false, code: 'bad_token', error: 'Wrong or missing token' });
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (body.action === 'update') {
      var rg = range_(body.range);
      rg.offset(0, 0, body.values.length, body.values[0].length).setValues(body.values);
    } else if (body.action === 'append') {
      var sh = sheet_(String(body.range).split('!')[0]);
      body.values.forEach(function (r) { sh.appendRow(r); });
    } else if (body.action === 'rows') {
      var m = ss.getSheetByName(MAIN);
      (body.ops || []).forEach(function (op) {
        var row = Number(op.row);
        if (!(row >= 2)) throw new Error('Refusing to change the header row');
        if (op.op === 'insert') m.insertRowBefore(row);
        else if (op.op === 'delete') m.deleteRow(row);
        else throw new Error('Unknown row op');
      });
    } else if (body.action === 'noop') {
      // token check only
    } else {
      throw new Error('Unknown action');
    }
    SpreadsheetApp.flush();
    return send_({ ok: true });
  } catch (err) {
    return send_({ ok: false, code: 'tool_error', error: String((err && err.message) || err) });
  } finally {
    lock.releaseLock();
  }
}

function sheet_(name) {
  name = String(name).replace(/^'|'$/g, '');
  if (ALLOWED.indexOf(name) < 0) throw new Error('Sheet not allowed: ' + name);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}

function range_(a1) {
  var i = String(a1).lastIndexOf('!');
  if (i < 0) throw new Error('Range needs a sheet name');
  return sheet_(a1.slice(0, i)).getRange(a1.slice(i + 1));
}

function read_(a1) {
  var rg = range_(a1);
  var sh = rg.getSheet();
  var last = Math.min(rg.getLastRow(), sh.getLastRow());
  if (last < rg.getRow()) return [];
  var v = sh.getRange(rg.getRow(), rg.getColumn(), last - rg.getRow() + 1, rg.getNumColumns()).getDisplayValues();
  while (v.length && v[v.length - 1].every(function (c) { return c === ''; })) v.pop();
  return v.map(function (r) { while (r.length && r[r.length - 1] === '') r.pop(); return r; });
}

function send_(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb && /^[A-Za-z_$][\w$.]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
