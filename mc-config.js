/*!
 * mc-config.js — Site configuration loader for ModernClicks.Co
 * Load as the FIRST <script> in <head> on every public page.
 *
 * Flow:
 *  1. Read from sessionStorage cache (instant on same-session navigations)
 *  2. If no cache, hide page, fetch from Google Apps Script config endpoint
 *  3. Apply theme redirect if needed, then reveal page
 *  4. Expose window.SiteConfig for other scripts to consume
 */
(function () {
  'use strict';

  var GAS_URL = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3Qk41MkdNa0tueHJUV0JNNjJXUEZfdmtuMjJDR0c5YktWTUFBb3Y2MDVMR0xjVkNLRzJ3R0twUGV0MGpQYlpaYUUvZXhlYw==');
  var CACHE_KEY  = 'mc_cfg_cache';
  var CACHE_TTL  = 5 * 60 * 1000; // 5 minutes

  var DEFAULTS = {
    defaultTheme:         'dark',
    spotsRemaining:       3,
    countdownEnabled:     true,
    exitIntentEnabled:    true,
    socialProofEnabled:   true,
    formsEnabled:         true,
    auditFormEnabled:     true,
    maintenanceMode:      false,
    webhookUrl:           'https://n8n.srv1201694.hstgr.cloud/webhook/meta-audit',
    webhookTestMode:      false,
    calendarUrl:          'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3sxWJQLh1AGfBlYs68bKR9uckO42vVnsWzozkEnbBFu5ftyD23NHi-2PXeJUPKy_rfUzzNoh98?gv=true',
    linkedinUrl:          'https://www.linkedin.com/'
  };

  // Pages that should never be theme-redirected
  var path = window.location.pathname;
  var skipRedirect = /\/(admin|404|audit-request)/.test(path);

  // ── 1. Read sessionStorage cache ────────────────────────────────────────
  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
      return entry.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
  }

  // ── 2. Merge with defaults ───────────────────────────────────────────────
  function merge(remote) {
    var out = {};
    for (var k in DEFAULTS) { if (DEFAULTS.hasOwnProperty(k)) out[k] = DEFAULTS[k]; }
    if (remote) { for (var k in remote) { if (remote.hasOwnProperty(k) && out.hasOwnProperty(k)) out[k] = remote[k]; } }
    return out;
  }

  // ── 3. Apply config (theme redirect, maintenance mode) ───────────────────
  function apply(cfg) {
    // Theme redirect
    if (!skipRedirect) {
      var isLight = path.indexOf('-light') !== -1;
      if (cfg.defaultTheme === 'light' && !isLight) {
        var lp = path.endsWith('.html') ? path.replace('.html', '-light.html')
               : (path === '/' || path === '') ? '/index-light' : path + '-light';
        revealPage();
        window.location.replace(lp);
        return;
      }
      if (cfg.defaultTheme === 'dark' && isLight) {
        revealPage();
        window.location.replace(path.replace('-light', ''));
        return;
      }
    }

    // Maintenance mode
    if (cfg.maintenanceMode && !skipRedirect) {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;' +
          'background:#0d0d0d;color:#e5e5e5;font-family:system-ui,sans-serif;text-align:center;padding:2rem">' +
          '<div><div style="font-size:2.5rem;margin-bottom:1rem">🔧</div>' +
          '<h1 style="font-size:1.75rem;font-weight:700;margin-bottom:.75rem">Under Maintenance</h1>' +
          '<p style="color:#888;max-width:360px">We\'ll be back shortly. Thank you for your patience.</p></div></div>';
      });
    }

    revealPage();
    publish(cfg);
  }

  // ── 4. Reveal page ───────────────────────────────────────────────────────
  function revealPage() {
    document.documentElement.style.visibility = '';
  }

  // ── 5. Expose global API ─────────────────────────────────────────────────
  function publish(cfg) {
    window.SiteConfig = {
      get:      function (k) { return cfg.hasOwnProperty(k) ? cfg[k] : DEFAULTS[k]; },
      getAll:   function () { var o = {}; for (var k in cfg) { if (cfg.hasOwnProperty(k)) o[k] = cfg[k]; } return o; },
      DEFAULTS: DEFAULTS
    };
    // Dispatch event so other scripts know config is ready
    document.dispatchEvent(new CustomEvent('siteconfig:ready', { detail: cfg }));
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────
  var cached = readCache();
  if (cached) {
    // Instant path — no network call
    apply(merge(cached));
  } else {
    // Hide until we know the theme
    document.documentElement.style.visibility = 'hidden';

    // Timeout safety: reveal after 600ms even if fetch fails
    var safetyTimer = setTimeout(function () {
      revealPage();
      publish(merge(null));
    }, 600);

    fetch(GAS_URL + '?action=config', { mode: 'cors' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(safetyTimer);
        var cfg = merge(data && data.config ? data.config : null);
        writeCache(cfg);
        apply(cfg);
      })
      .catch(function () {
        clearTimeout(safetyTimer);
        apply(merge(null));
      });
  }

})();
