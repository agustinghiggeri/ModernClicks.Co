/*!
 * mc-config.js — Static site configuration for ModernClicks.Co
 * No admin panel, no remote fetch, no localStorage.
 * To change any value: edit this file and redeploy to Vercel.
 */
(function () {
  'use strict';

  // Force HTTPS in production
  if (window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1') {
    window.location.replace('https:' + window.location.href.slice(5));
    return;
  }

  var CFG = {
    defaultTheme:       'light',
    spotsRemaining:     3,
    countdownEnabled:   true,
    exitIntentEnabled:  true,
    socialProofEnabled: true,
    formsEnabled:       true,
    auditFormEnabled:   true,
    maintenanceMode:    false,
    calendarUrl:        'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3sxWJQLh1AGfBlYs68bKR9uckO42vVnsWzozkEnbBFu5ftyD23NHi-2PXeJUPKy_rfUzzNoh98?gv=true',
    linkedinUrl:        'https://www.linkedin.com/'
  };

  // Theme redirect (dark/light page variants)
  var path = window.location.pathname;
  var skipRedirect = /\/(admin|404|audit-request)/.test(path);
  if (!skipRedirect) {
    var isLight = path.indexOf('-light') !== -1;
    if (CFG.defaultTheme === 'light' && !isLight) {
      var lp = path.endsWith('.html') ? path.replace('.html', '-light.html')
             : (path === '/' || path === '') ? '/index-light' : path + '-light';
      window.location.replace(lp);
      return;
    }
    if (CFG.defaultTheme === 'dark' && isLight) {
      window.location.replace(path.replace('-light', ''));
      return;
    }
  }

  // Maintenance mode
  if (CFG.maintenanceMode && !skipRedirect) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;' +
        'background:#0d0d0d;color:#e5e5e5;font-family:system-ui,sans-serif;text-align:center;padding:2rem">' +
        '<div><div style="font-size:2.5rem;margin-bottom:1rem">🔧</div>' +
        '<h1 style="font-size:1.75rem;font-weight:700;margin-bottom:.75rem">Under Maintenance</h1>' +
        '<p style="color:#888;max-width:360px">We\'ll be back shortly. Thank you for your patience.</p></div></div>';
    });
  }

  // Expose global API
  window.SiteConfig = {
    get:    function (k) { return CFG.hasOwnProperty(k) ? CFG[k] : undefined; },
    getAll: function () { var o = {}; for (var k in CFG) { if (CFG.hasOwnProperty(k)) o[k] = CFG[k]; } return o; }
  };

  document.dispatchEvent(new CustomEvent('siteconfig:ready', { detail: CFG }));
})();
