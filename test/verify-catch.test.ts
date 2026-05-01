/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { createHmac } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';

vi.mock('node:crypto', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:crypto')>();
	return {
		...actual,
		timingSafeEqual: vi.fn(() => {
			throw new Error('forced error for catch coverage');
		}),
	};
});

const { verifySignature } = await import('../nodes/StickrTrigger/verify');

function signFixture(body: Buffer, secret: string, ts: number): string {
	const signed = Buffer.concat([Buffer.from(`${ts}.`, 'utf-8'), body]);
	const sig = createHmac('sha256', secret).update(signed).digest('hex');
	return `t=${ts},v1=${sig}`;
}

const SECRET = 'whsec_test_secret_abc123';
const BODY = Buffer.from('{"event":"webhook.test"}', 'utf-8');
const NOW = Math.floor(Date.now() / 1000);
const TOLERANCE = 300;

describe('verifySignature catch branch', () => {
	it('returns false when timingSafeEqual throws unexpectedly', () => {
		const header = signFixture(BODY, SECRET, NOW);
		expect(verifySignature(BODY, header, SECRET, NOW, TOLERANCE)).toBe(false);
	});
});
