import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifySignature(
	body: Buffer,
	signatureHeader: string,
	secret: string,
	timestamp: number,
	toleranceSeconds: number,
): boolean {
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - timestamp) > toleranceSeconds) return false;

	const parts: Record<string, string> = {};
	for (const part of signatureHeader.split(',')) {
		const [k, v] = part.split('=', 2);
		if (k && v) parts[k.trim()] = v.trim();
	}
	const received = parts['v1'];
	if (!received) return false;

	const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf-8'), body]);
	const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');

	if (received.length !== expected.length) return false;
	try {
		return timingSafeEqual(Buffer.from(received, 'utf-8'), Buffer.from(expected, 'utf-8'));
	} catch {
		return false;
	}
}
