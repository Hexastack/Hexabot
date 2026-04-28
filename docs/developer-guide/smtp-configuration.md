---
description: >-
  Configure SMTP delivery for transactional emails such as account confirmation
  and password reset.
icon: envelope
---

# SMTP Configuration

Hexabot uses SMTP for transactional emails sent by the API. In the current NestJS implementation, SMTP is used for account confirmation emails and password reset emails.

The mailer is configured from `EMAIL_SMTP_*` environment variables, then registered with `@nestjs-modules/mailer`, Nodemailer SMTP transport, and [MJML](https://mjml.io/) templates.

### How Email Delivery Works

At API startup, Hexabot reads the SMTP environment variables and builds `config.emails`:

<table><thead><tr><th width="284.1605224609375">Config field</th><th>Source</th></tr></thead><tbody><tr><td><code>config.emails.isEnabled</code></td><td><code>EMAIL_SMTP_ENABLED</code></td></tr><tr><td><code>config.emails.smtp.host</code></td><td><code>EMAIL_SMTP_HOST</code></td></tr><tr><td><code>config.emails.smtp.port</code></td><td><code>EMAIL_SMTP_PORT</code></td></tr><tr><td><code>config.emails.smtp.secure</code></td><td><code>EMAIL_SMTP_SECURE</code></td></tr><tr><td><code>config.emails.smtp.auth.user</code></td><td><code>EMAIL_SMTP_USER</code></td></tr><tr><td><code>config.emails.smtp.auth.pass</code></td><td><code>EMAIL_SMTP_PASS</code></td></tr><tr><td><code>config.emails.from</code></td><td><code>EMAIL_SMTP_FROM</code></td></tr></tbody></table>

When `EMAIL_SMTP_ENABLED=true`, the API registers a real SMTP transporter. When it is `false`, the API does not register the NestJS mailer transport and injects a fallback `MailerService` whose `sendMail()` method throws `Email Service is not enabled`.

That means SMTP can be disabled for local development only if you do not need email-dependent flows. Account creation still succeeds when the confirmation email cannot be sent, but the new user remains inactive until confirmed or enabled manually. Password reset requests require email delivery and will fail if SMTP is disabled or unreachable.

SMTP settings are read only at startup. Restart the API after changing environment variables.

### SMTP Variables

```env
EMAIL_SMTP_ENABLED=true
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-smtp-username
EMAIL_SMTP_PASS=your-smtp-password
EMAIL_SMTP_FROM="Hexabot <noreply@example.com>"
```

<table><thead><tr><th width="189.26995849609375">Variable</th><th width="120.149169921875">Required for sending</th><th width="142.11224365234375">Default</th><th>Notes</th></tr></thead><tbody><tr><td><code>EMAIL_SMTP_ENABLED</code></td><td>Yes</td><td><code>false</code></td><td>Must be exactly <code>true</code> to enable the real mailer module.</td></tr><tr><td><code>EMAIL_SMTP_HOST</code></td><td>Yes</td><td><code>localhost</code></td><td>Hostname reachable from the API process or API container.</td></tr><tr><td><code>EMAIL_SMTP_PORT</code></td><td>Yes</td><td><code>25</code></td><td>Common values are <code>25</code>, <code>587</code>, and <code>465</code>, depending on the provider.</td></tr><tr><td><code>EMAIL_SMTP_SECURE</code></td><td>Yes</td><td><code>false</code></td><td>Use <code>true</code> for implicit TLS from connection start, usually port <code>465</code>. Use <code>false</code> for plain SMTP or STARTTLS, commonly ports <code>25</code> or <code>587</code>.</td></tr><tr><td><code>EMAIL_SMTP_USER</code></td><td>Usually</td><td>empty</td><td>SMTP username, API key username, or provider-specific login.</td></tr><tr><td><code>EMAIL_SMTP_PASS</code></td><td>Usually</td><td>empty</td><td>SMTP password, app password, or provider API key.</td></tr><tr><td><code>EMAIL_SMTP_FROM</code></td><td>Yes</td><td><code>noreply@example.com</code></td><td>Default sender used by <code>MailerModule</code> for outgoing email. Many providers require this address or domain to be verified.</td></tr></tbody></table>

Hexabot sets Nodemailer `ignoreTLS` to `false`, so STARTTLS can be used when the SMTP server advertises it and `EMAIL_SMTP_SECURE=false`.

### Related URL and Token Settings

Email templates include links back to the frontend. Set the public frontend URL correctly, especially in production:

```env
FRONTEND_BASE_URL=https://app.example.com
```

The current templates use this value for:

<table><thead><tr><th width="197.5980224609375">Email</th><th>Link shape</th></tr></thead><tbody><tr><td>Account confirmation</td><td><code>FRONTEND_BASE_URL/login/&#x3C;token></code></td></tr><tr><td>Password reset</td><td><code>FRONTEND_BASE_URL/reset/&#x3C;token></code></td></tr></tbody></table>

Set production-grade secrets and expiration values for the email tokens:

```env
PASSWORD_RESET_SECRET=replace-with-a-long-random-secret
PASSWORD_RESET_EXPIRES_IN=1h
CONFIRM_ACCOUNT_SECRET=replace-with-a-different-long-random-secret
CONFIRM_ACCOUNT_EXPIRES_IN=1h
```

Do not reuse the development defaults in production.

### Local Testing with smtp4dev

The repository includes a Docker Compose override for smtp4dev at `docker/docker-compose.smtp4dev.yml`.

smtp4dev exposes:

| Service                                | Address                 |
| -------------------------------------- | ----------------------- |
| SMTP inside the Docker Compose network | `smtp4dev:25`           |
| Web inbox on the host                  | `http://localhost:9002` |

For Docker-based development, enable SMTP and point the API container at the smtp4dev service:

```env
EMAIL_SMTP_ENABLED=true
EMAIL_SMTP_HOST=smtp4dev
EMAIL_SMTP_PORT=25
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=dev_only
EMAIL_SMTP_PASS=dev_only
EMAIL_SMTP_FROM=noreply@example.com
```

Then start Docker with the smtp4dev compose file. With the CLI:

```bash
hexabot dev --docker --services smtp4dev
```

Or directly from this repository:

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.smtp4dev.yml \
  -f docker/docker-compose.dev.yml \
  up --build
```

Open `http://localhost:9002` to inspect captured messages.

If the API runs on the host machine instead of inside the Docker Compose network, use the host mapping instead:

```env
EMAIL_SMTP_HOST=localhost
EMAIL_SMTP_PORT=25
```

### Production Example

For a typical authenticated SMTP provider using STARTTLS on port `587`:

```env
EMAIL_SMTP_ENABLED=true
EMAIL_SMTP_HOST=smtp.provider.example
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=provider-user-or-api-key-user
EMAIL_SMTP_PASS=provider-password-or-api-key
EMAIL_SMTP_FROM="Hexabot <noreply@example.com>"
FRONTEND_BASE_URL=https://app.example.com
PASSWORD_RESET_SECRET=replace-with-a-long-random-secret
CONFIRM_ACCOUNT_SECRET=replace-with-a-different-long-random-secret
```

For a provider that requires implicit TLS on port `465`, change only the port and secure flag:

```env
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
```

Before going live, verify the provider-side requirements:

<table><thead><tr><th width="271.02130126953125">Requirement</th><th>Why it matters</th></tr></thead><tbody><tr><td>Verified sender or domain</td><td>Providers often reject or rewrite unverified <code>EMAIL_SMTP_FROM</code> addresses.</td></tr><tr><td>Valid SMTP credentials</td><td>Some providers use API keys as the SMTP password.</td></tr><tr><td>Allowed outbound SMTP port</td><td>Cloud networks and hosting providers may block ports <code>25</code>, <code>465</code>, or <code>587</code>.</td></tr><tr><td>Correct TLS mode</td><td>A port/secure mismatch is a common cause of connection failures.</td></tr></tbody></table>

The current environment mapping does not expose advanced Nodemailer options such as custom TLS certificates, `requireTLS`, or multiple transports. Add code-level configuration if your SMTP provider requires those options.

### Verifying the Configuration

1. Restart the API after editing the environment file.
2. Open the dashboard and check **Integrations Health**.
3. Look for **Email (SMTP)**.
4. A healthy SMTP card means `verifyAllTransporters()` succeeded.
5. Trigger a real email flow, such as a password reset request or creating a user that should receive an account confirmation email.
6. Check the recipient inbox, provider logs, or smtp4dev web inbox.

The API also exposes integration health through `/api/stats/integration-health` for authenticated dashboard requests. The SMTP item reports one of these reasons:

| Reason               | Meaning                                                      |
| -------------------- | ------------------------------------------------------------ |
| `smtp.disabled`      | `EMAIL_SMTP_ENABLED` is not `true`.                          |
| `smtp.verified`      | The configured transporter verified successfully.            |
| `smtp.verify_failed` | The transporter verification failed.                         |
| `smtp.timeout`       | Verification did not complete within the API health timeout. |

### Troubleshooting

| Symptom                                  | Likely cause                                       | What to check                                                                           |
| ---------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Email (SMTP)** shows disabled          | SMTP is not enabled                                | Set `EMAIL_SMTP_ENABLED=true` and restart the API.                                      |
| Password reset returns an email error    | Mailer is disabled or cannot send                  | Check SMTP health, API logs, and provider logs.                                         |
| `getaddrinfo ENOTFOUND smtp4dev`         | API process cannot resolve the Docker service name | Use `smtp4dev` only from inside Compose. Use `localhost` when the API runs on the host. |
| TLS or SSL handshake error               | `EMAIL_SMTP_SECURE` does not match the port        | Use `secure=true` for port `465`; use `secure=false` for STARTTLS ports such as `587`.  |
| Authentication failed                    | Wrong user, password, API key, or sender policy    | Regenerate credentials and confirm the provider's SMTP login format.                    |
| Emails send but links point to localhost | `FRONTEND_BASE_URL` still uses a development value | Set it to the public frontend URL and restart.                                          |
| Health check times out                   | Network, firewall, or provider connectivity issue  | Confirm the host and port are reachable from the API container or host.                 |

### Templates

Transactional email templates live in `packages/api/src/templates`:

* `account_confirmation.mjml`
* `password_reset.mjml`

The Nest build copies these files into `dist/templates`, and the mailer reads templates from that compiled directory at runtime. Templates are MJML files rendered through Handlebars. Keep template variable names aligned with the context objects passed by `PasswordResetService` and `ValidateAccountService`; missing Handlebars values render as empty strings.

Text translations used by the templates live under `packages/api/src/config/i18n`.
