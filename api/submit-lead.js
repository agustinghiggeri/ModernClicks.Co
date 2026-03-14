/**
 * /api/submit-lead
 * Server-side proxy to Google Apps Script.
 * The real GAS endpoint URL lives in the VERCEL env var GAS_ENDPOINT_URL —
 * it is never sent to the browser.
 */
module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const gasUrl = process.env.GAS_ENDPOINT_URL;
  if (!gasUrl) {
    console.error('GAS_ENDPOINT_URL env var is not set');
    return res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
  }

  try {
    // Convert the JSON body to form-encoded so GAS doPost() reads e.parameter correctly
    const body = req.body || {};
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      params.append(k, String(v ?? ''));
    }

    await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'follow',
    });

    // Always return ok to the browser — GAS response is irrelevant
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('submit-lead upstream error:', err);
    return res.status(500).json({ status: 'error', message: 'Upstream error' });
  }
};
