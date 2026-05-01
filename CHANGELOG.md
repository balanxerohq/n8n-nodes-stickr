# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-01

First public stable release.

### Added
- STICKR Trigger node — receive HMAC-SHA256 signed webhook events from STICKR
  (per the STICKR Webhook Specification)
- Three verification modes: Strict (default), Pass-through, Skip
- Event-type filtering matching the STICKR Event Catalog v1
  (10 event types: album.completed, album.threshold_reached,
  item.claimed, item.rare_pulled, pack.issued, trade.settled,
  campaign.started, campaign.ended, user.registered, webhook.test)
- Configurable timestamp tolerance (default 300 s, range 30–3600 s)
- Output schema with `_stickr_meta` connector metadata
  (delivery_id, attempt, verification_status, received_at)
- Customer-facing README with setup, troubleshooting, and examples

### Notes
- Phase 1 release — Trigger only, no Action nodes
- Manual subscription model: customer copies hook URL from n8n into
  the STICKR Admin UI to create the subscription on STICKR's side
- Zero runtime dependencies (only Node.js stdlib + n8n helpers)
- Published via npm OIDC Trusted Publishing — provenance-signed,
  no long-lived tokens involved

## [0.0.1-alpha.2] - 2026-05-01

OIDC pipeline verification publish. No code changes from alpha.1;
this version validated that npm Trusted Publishing works end-to-end.

### Changed
- Migrated publish workflow from token-based to OIDC Trusted Publishing
- Removed NPM_TOKEN secret from repository
- Updated workflow Node version to 24 (npm CLI 11.5.1+ requirement)
- Added `--ignore-scripts` flag and automatic `dist-tag` selection to
  publish workflow

## [0.0.1-alpha.1] - 2026-05-01

Bootstrap publish to create the package record on npm. Contains the
n8n scaffold's example node (replaced in 0.1.0).

### Added
- Initial scaffold via `npm create @n8n/node`
- GitHub Actions publish pipeline with provenance signing
- Branch protection on main
