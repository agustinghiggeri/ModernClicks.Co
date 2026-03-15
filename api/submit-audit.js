/**
 * /api/submit-audit
 * Server-side proxy to the n8n audit webhook.
 * N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET live in Vercel env vars —
 * they are never sent to the browser.
 *
 * NOTE: n8n can take up to 60 seconds to generate the audit report.
 * This function has maxDuration: 60 set in vercel.json (requires Vercel Pro).
 * On the free Hobby plan the hard limit is 10s — upgrade if timeouts occur.
 */

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const MAX_PAYLOAD_BYTES = 8192; // 8 KB

function sanitize(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function validateBody(body) {
  const errors = [];

  // Required string fields
  const accountId = sanitize(body.accountId, 25);
  const brandName  = sanitize(body.brandName,  100);
  const productType = sanitize(body.productType, 200);
  const email      = sanitize(body.email, 254);
  const primaryGoal = sanitize(body.primaryGoal, 50);

  if (!accountId)   errors.push('accountId is required');
  if (!brandName)   errors.push('brandName is required');
  if (!productType) errors.push('productType is required');
  if (!email || !EMAIL_RE.test(email)) errors.push('valid email is required');

  const allowed = ['Purchases / Conversions', 'Leads / Sign-ups', 'Website Traffic', 'Brand Awareness / Reach'];
  if (!allowed.includes(primaryGoal)) errors.push('invalid primaryGoal');

  const lookback = parseInt(body.lookback, 10);
  if (![30, 60, 90].includes(lookback)) errors.push('invalid lookback period');

  // Optional numeric fields — accept only finite numbers or omit
  const numericFields = ['targetRoas', 'targetCpp', 'margin', 'monthlyBudget'];
  for (const field of numericFields) {
    if (body[field] !== undefined && body[field] !== '') {
      const n = parseFloat(body[field]);
      if (!isFinite(n) || n < 0) errors.push(`invalid ${field}`);
    }
  }

  return errors;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Guard payload size (Vercel parses JSON body automatically; re-stringify to measure)
  const rawSize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  if (rawSize > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ status: 'error', message: 'Payload too large' });
  }

  const webhookUrl    = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.error('N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET env var is not set');
    return res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
  }

  // Validate and sanitize input
  const errors = validateBody(req.body || {});
  if (errors.length) {
    return res.status(400).json({ status: 'error', message: errors[0] });
  }

  // Build a clean payload — only known fields forwarded to n8n
  const body = req.body || {};
  const payload = {
    accountId:         sanitize(body.accountId, 25),
    brandName:         sanitize(body.brandName, 100),
    productType:       sanitize(body.productType, 200),
    email:             sanitize(body.email, 254),
    primaryGoal:       sanitize(body.primaryGoal, 50),
    lookback:          parseInt(body.lookback, 10),
    additionalContext: sanitize(body.additionalContext || '', 2000),
  };

  // Optional numeric fields
  for (const field of ['targetRoas', 'targetCpp', 'margin', 'monthlyBudget']) {
    if (body[field] !== undefined && body[field] !== '') {
      payload[field] = parseFloat(body[field]);
    }
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      throw new Error(`n8n responded with ${upstream.status}`);
    }

    // Pipe content-type and content-disposition back so the browser downloads the file
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = upstream.headers.get('content-disposition');

    res.setHeader('Content-Type', contentType);
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    const buffer = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (err) {
    console.error('submit-audit upstream error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to process your request. Please try again in a few minutes.',
    });
  }
};
