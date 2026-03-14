# Security SOP — Standard Operating Procedure
## ModernClicks.Co / Future Projects

---

## 1. Pre-Launch Checklist

### 1.1 Secrets & Credentials
- [ ] No API keys, tokens, passwords, or webhook URLs hardcoded in HTML or JS files
- [ ] No Base64-encoded secrets in client-side code (Base64 is encoding, not encryption)
- [ ] No `.env` files committed to git — add `.env*` to `.gitignore` before first commit
- [ ] All secrets live in environment variables (Vercel env vars, Google Script Properties, n8n credentials)
- [ ] Rotate any credential that was ever committed to git — assume it is compromised
- [ ] Run `git log -p | grep -i "secret\|key\|token\|password\|webhook"` before every push

### 1.2 Third-Party Scripts & Dependencies
- [ ] Audit every CDN script tag — does it need SRI (`integrity=` + `crossorigin="anonymous"`)?
- [ ] Check current version of every pinned library against known CVE databases (Snyk, NIST NVD)
- [ ] SRI is not feasible for GTM, Facebook Pixel, or any frequently-changing CDN script — document and accept this risk explicitly
- [ ] Prefer loading third-party scripts via a tag manager rather than inline, to contain scope

### 1.3 HTTP Security Headers (verify in vercel.json or equivalent)
- [ ] `Content-Security-Policy` — defined, no directive errors, tested in CSP Evaluator
- [ ] `Strict-Transport-Security` — `max-age=31536000; includeSubDomains; preload`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (or `SAMEORIGIN` if embedding yourself)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — disable geolocation, microphone, camera unless needed
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] `Cross-Origin-Resource-Policy: same-origin`
- [ ] **Remove** `X-XSS-Protection` — deprecated, can introduce vulnerabilities in IE

### 1.4 Content Security Policy
- [ ] Run CSP through https://csp-evaluator.withgoogle.com before launch
- [ ] Avoid `'unsafe-inline'` in `script-src` — use nonces or move to external files
- [ ] Avoid `'unsafe-eval'` entirely
- [ ] Do not use wildcard `*` in `script-src` or `connect-src`
- [ ] `object-src 'none'` — always
- [ ] `base-uri 'self'` — always
- [ ] `form-action` restricted to known endpoints only
- [ ] If inline scripts are unavoidable, generate per-request nonces server-side

### 1.5 API Endpoints & Webhooks
- [ ] Every public-facing endpoint requires authentication (header token, HMAC signature, or OAuth)
- [ ] Webhook URLs are never in client-side HTML or JS — proxy through your own backend or serverless function
- [ ] Test endpoints are disabled or protected separately from production
- [ ] Rate limiting is enforced server-side, not only client-side
- [ ] All inputs are validated and sanitized server-side regardless of client validation
- [ ] Error messages never expose internal paths, stack traces, or server details

### 1.6 Client-Side Code Review
- [ ] No internal server hostnames, IPs, or infrastructure details visible in source
- [ ] No commented-out debug code containing real endpoints or credentials
- [ ] No `console.log` statements containing user data or internal state in production
- [ ] Form submissions use POST, never GET with query params for sensitive data
- [ ] `autocomplete="off"` on sensitive fields where appropriate

### 1.7 Data Handling
- [ ] Identify exactly what personal data is collected (email, phone, IP via analytics)
- [ ] Privacy policy accurately reflects all data collected and all third parties receiving it (GA4, Meta)
- [ ] Retention period defined and enforced
- [ ] User data is never logged in plaintext to any client-visible location

---

## 2. Tooling — Run Before Every Deploy

| Tool | Purpose | URL |
|---|---|---|
| CSP Evaluator | Validate Content-Security-Policy | https://csp-evaluator.withgoogle.com |
| SecurityHeaders.com | Full HTTP header scan | https://securityheaders.com |
| Mozilla Observatory | Combined header + TLS audit | https://observatory.mozilla.org |
| Snyk | Dependency CVE scan | https://snyk.io |
| NIST NVD | CVE lookup by library name | https://nvd.nist.gov |
| Have I Been Pwned API | Check if emails in your DB are breached | https://haveibeenpwned.com/API |
| git-secrets / truffleHog | Scan git history for secrets | CLI tools |
| ummniweb.com | Web security scanner (used on this project) | https://ummniweb.com |

---

## 3. Secrets Management Rules

### Never
- Hardcode secrets in any file tracked by git
- Use Base64 as "obfuscation" for secrets — it is publicly reversible
- Put secrets in client-side JavaScript, even in variables named `const SECRET`
- Reuse secrets across projects

### Always
- Store secrets in the platform's secret manager (Vercel Environment Variables, Google Script Properties, n8n Credentials store)
- Use different secrets for production vs. staging vs. development
- Rotate secrets on a schedule (every 90 days) or immediately after any suspected exposure
- Document where each secret lives — not the value, just the name and location

### For Static Sites Specifically
Static sites cannot protect secrets. If a value is in any `.html`, `.js`, or `.css` file, it is public. The correct pattern:
1. Client sends form data to a **serverless function** (Vercel Function, Cloudflare Worker)
2. The serverless function holds the real endpoint/key in environment variables
3. The serverless function validates, rate-limits, and forwards to the backend
4. The real backend URL is never in the browser

---

## 4. Webhook Security Pattern

For every webhook integration (n8n, Zapier, Make, etc.):

```
Browser → Your Vercel Serverless Function (holds auth) → n8n / backend
```

Never:
```
Browser → n8n directly (URL visible in source)
```

In n8n, always enable **Header Auth** on every webhook trigger:
- Add a secret header (e.g., `X-Webhook-Secret: <random-256bit-value>`)
- Store the value in Vercel env vars, pass it from your serverless function
- Rotate it if the Vercel function source is ever exposed

---

## 5. Post-Launch Monitoring

- [ ] Set up Vercel log drains or equivalent to monitor unusual traffic spikes to form endpoints
- [ ] Alert on >10 form submissions from a single IP in 5 minutes
- [ ] Review Google Sheets leads weekly for obviously fake data (signals of endpoint abuse)
- [ ] Monitor n8n execution logs for unexpected payloads or error rates
- [ ] Subscribe to CVE alerts for every library in use (GitHub Dependabot, Snyk)
- [ ] Re-run SecurityHeaders.com and ummniweb.com scans monthly or after any deploy

---

## 6. Incident Response — If a Secret is Exposed

1. **Rotate immediately** — generate a new key/token before doing anything else
2. **Revoke the old one** — don't just replace, actively revoke
3. **Audit logs** — check for any usage of the exposed key in the last 30 days
4. **Remove from git history** — use `git filter-repo` or BFG Repo Cleaner; force-push
5. **Notify if user data was accessed** — GDPR requires notification within 72 hours if personal data was affected
6. **Document the incident** — what was exposed, for how long, what was done

---

*Last updated: 2026-03-09 | Project: ModernClicks.Co*
