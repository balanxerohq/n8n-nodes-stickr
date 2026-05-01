# n8n-nodes-stickr

[![npm version](https://img.shields.io/npm/v/n8n-nodes-stickr)](https://www.npmjs.com/package/n8n-nodes-stickr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-FF6D5A)](https://docs.n8n.io/integrations/community-nodes/)

Official STICKR Trigger Node for [n8n](https://n8n.io). Receive real-time webhook events from STICKR — album completions, sticker claims, pack issuances, trades, campaigns, and more — directly into your n8n workflows.

---

## What it does

The **STICKR Trigger** node listens for HTTP POST webhooks sent by STICKR when events occur in your organization. Each incoming event is HMAC-verified (using your webhook signing secret), filtered by event type if configured, and emitted as a structured workflow item your downstream nodes can act on immediately.

There are no outbound API calls to STICKR. The node is receive-only: it sits on a webhook URL and forwards verified events into your workflow.

---

## Installation

### n8n Cloud

1. Open your n8n Cloud instance.
2. Go to **Settings → Community Nodes → Install**.
3. Search for `n8n-nodes-stickr` and click **Install**.

### Self-hosted n8n

Install into n8n's custom nodes directory:

```bash
npm install n8n-nodes-stickr
```

Then restart n8n. The node will appear under **Triggers** in the node palette.

---

## Setup

### 1. Add the STICKR Trigger node to a workflow

Open a new or existing workflow and add the **STICKR Trigger** node. Activate the workflow — n8n will generate a webhook URL (e.g. `https://your-n8n.example.com/webhook/abc123/webhook`).

> TODO: screenshot — STICKR Trigger node in the n8n canvas with webhook URL visible

### 2. Copy the webhook URL

Click the node to open its panel. The webhook URL is shown at the top. Copy it.

### 3. Create a webhook subscription in STICKR

In STICKR Admin:

1. Go to **Integrations → Webhooks → New Subscription**.
2. Paste your webhook URL.
3. Select the events you want to receive (or leave all selected).
4. Save — STICKR generates a signing secret for this subscription.
5. Copy the signing secret.

> TODO: screenshot — STICKR Admin webhook subscription creation screen

### 4. Add credentials in n8n

Back in the STICKR Trigger node:

1. Click **Credential → Create new**.
2. Paste the signing secret into **Signing Secret**.
3. Save.

> TODO: screenshot — STICKR API credential creation dialog

### 5. Send a test event

In STICKR Admin, click **Send Test** on your new subscription. The STICKR Trigger node will receive a `webhook.test` event and your workflow will execute.

---

## Events

| Event Name | Value | Description |
|---|---|---|
| Album Completed | `album.completed` | A user has completed an album |
| Album Threshold Reached | `album.threshold_reached` | A user crossed a milestone (25/50/75/90%) |
| Item Claimed | `item.claimed` | A user added a new sticker to their collection |
| Item Rare Pulled | `item.rare_pulled` | A user pulled a rare/epic/legendary item |
| Pack Issued | `pack.issued` | A pack was issued to a user |
| Trade Settled | `trade.settled` | A trade between users completed successfully |
| Campaign Started | `campaign.started` | A distribution campaign went live |
| Campaign Ended | `campaign.ended` | A distribution campaign concluded |
| User Registered | `user.registered` | A user joined via this organization |
| Webhook Test | `webhook.test` | Manual test event from STICKR Admin UI |

Leave the **Events** field empty to receive all event types.

---

## Output Schema

Each event is emitted as a single workflow item with this shape:

```json
{
  "event_type": "album.completed",
  "event_version": 1,
  "event_id": "evt_01HXYZ1234567890ABCDEF",
  "occurred_at": "2026-05-01T14:23:18.421Z",
  "organization_id": "org_01HXYZ0000000000ORGABC",
  "data": {
    "album_id": "alb_01HXYZ1111111111ALBCDE",
    "album_name": "Champions League 2025/26",
    "user_id": "usr_01HXYZ2222222222USRABC",
    "user_external_id": "user@example.com",
    "completed_at": "2026-05-01T14:23:18.421Z",
    "total_stickers": 442,
    "unique_stickers": 442
  },
  "_stickr_meta": {
    "delivery_id": "dlv_01HXYZ0000000000DLVCDE",
    "attempt": 1,
    "verification_status": "verified",
    "received_at": "2026-05-01T14:23:19.005Z",
    "subscription_id": "sub_01HXYZ0000000000SUBCDE"
  }
}
```

The `data` field shape varies per event type — see the [STICKR webhook documentation](https://developers.stickr.de/webhooks) for full payload schemas.

The `_stickr_meta` object is always present and contains connector metadata:

| Field | Description |
|---|---|
| `delivery_id` | Unique ID for this delivery attempt |
| `attempt` | Delivery attempt number (1 for first try) |
| `verification_status` | `verified`, `unverified`, `failed`, or `skipped` |
| `received_at` | ISO timestamp when n8n received the request |
| `subscription_id` | STICKR subscription that sent this event |

---

## Verification Modes

| Mode | Behavior |
|---|---|
| **Strict** (default) | Requests with invalid or missing signatures are rejected with HTTP 401. Recommended for production. |
| **Pass-Through** | Signature is checked but invalid requests are still processed. The `verification_status` field reflects the outcome. Useful for debugging. |
| **Skip** | Signature verification is skipped entirely. Use only in controlled environments where you trust the source. |

The **Timestamp Tolerance** setting (default: 300 seconds) controls how old a request timestamp may be before it is rejected. This protects against replay attacks.

---

## Troubleshooting

**No events arriving in n8n**

Check the STICKR delivery log first (STICKR Admin → Integrations → Webhooks → [your subscription] → Deliveries). If STICKR shows successful deliveries (HTTP 200), the issue is downstream in your workflow. If STICKR shows failures (HTTP 4xx/5xx), check that your n8n instance is publicly reachable and the webhook URL is correct.

**Signature verification failing**

The most common cause is a signing secret mismatch. Verify that the secret in your n8n credential matches exactly what STICKR shows in the subscription settings. If you recently rotated the secret in STICKR, update the credential in n8n.

If you need to debug without verification, temporarily switch to **Pass-Through** mode and inspect the `_stickr_meta.verification_status` field.

**Events arrive late or retry**

STICKR retries deliveries when your endpoint takes too long to respond or returns a non-2xx status. The STICKR Trigger node responds immediately on receipt (`responseMode: onReceived`), so long workflow execution time will not cause retries. If you see repeated deliveries, check the STICKR retry policy and your endpoint's response time.

---

## Local Development

```bash
git clone https://github.com/balanxerohq/n8n-nodes-stickr.git
cd n8n-nodes-stickr
npm install

# Run linter
npm run lint

# Build
npm run build

# Run tests
npm test

# Start n8n with the node loaded and hot reload
npm run dev
```

The `npm run dev` command starts n8n at `http://localhost:5678` with the node available for manual testing.

---

## License

[MIT](LICENSE) © balanxerohq
