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
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.error('N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET env var is not set');
    return res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(req.body || {}),
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
