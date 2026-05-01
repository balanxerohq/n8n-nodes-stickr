/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifySignature } from '../nodes/StickrTrigger/verify';

function signFixture(body: Buffer, secret: string, ts: number): string {
	const signed = Buffer.concat([Buffer.from(`${ts}.`, 'utf-8'), body]);
	const sig = createHmac('sha256', secret).update(signed).digest('hex');
	return `t=${ts},v1=${sig}`;
}

const SECRET = 'whsec_test_secret_abc123';
const BODY = Buffer.from('{"event":"webhook.test"}', 'utf-8');
const NOW = Math.floor(Date.now() / 1000);
const TOLERANCE = 300;

describe('verifySignature', () => {
	it('accepts a valid signature within tolerance', () => {
		const header = signFixture(BODY, SECRET, NOW);
		expect(verifySignature(BODY, header, SECRET, NOW, TOLERANCE)).toBe(true);
	});

	it('rejects an invalid signature', () => {
		const header = signFixture(BODY, 'wrong_secret', NOW);
		expect(verifySignature(BODY, header, SECRET, NOW, TOLERANCE)).toBe(false);
	});

	it('rejects when timestamp is outside tolerance window', () => {
		const oldTs = NOW - TOLERANCE - 1;
		const header = signFixture(BODY, SECRET, oldTs);
		expect(verifySignature(BODY, header, SECRET, oldTs, TOLERANCE)).toBe(false);
	});

	it('rejects when signature header is malformed', () => {
		expect(verifySignature(BODY, 'not-a-valid-header', SECRET, NOW, TOLERANCE)).toBe(false);
	});

	it('rejects when v1 part is missing', () => {
		const header = `t=${NOW},v2=somehash`;
		expect(verifySignature(BODY, header, SECRET, NOW, TOLERANCE)).toBe(false);
	});

	it('rejects when received signature length differs from expected', () => {
		const header = `t=${NOW},v1=short`;
		expect(verifySignature(BODY, header, SECRET, NOW, TOLERANCE)).toBe(false);
	});

	it('constant-time comparison smoke test: two valid sigs with same length return correct results', () => {
		const header1 = signFixture(BODY, SECRET, NOW);
		const header2 = signFixture(BODY, 'another_secret_xyz', NOW);
		expect(verifySignature(BODY, header1, SECRET, NOW, TOLERANCE)).toBe(true);
		expect(verifySignature(BODY, header2, SECRET, NOW, TOLERANCE)).toBe(false);
	});

});
