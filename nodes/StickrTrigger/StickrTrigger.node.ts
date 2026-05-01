import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	ICredentialDataDecryptedObject,
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	INodeCredentialTestResult,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { STICKR_EVENT_TYPES } from './eventTypes';
import { verifySignature } from './verify';

type VerifyMode = 'strict' | 'passthrough' | 'skip';
type VerificationStatus = 'verified' | 'unverified' | 'failed' | 'skipped';

export class StickrTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'STICKR Trigger',
		name: 'stickrTrigger',
		icon: 'file:stickr.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive HMAC-signed webhook events from STICKR',
		subtitle: '={{$parameter["events"].length ? $parameter["events"].join(", ") : "All events"}}',
		defaults: {
			name: 'STICKR Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'stickrApi',
				required: false,
				testedBy: 'stickrApiTest',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: STICKR_EVENT_TYPES.map((e) => ({
					name: e.name,
					value: e.value,
					description: e.description,
				})),
				default: [],
				description: 'Event types to receive. Leave empty to receive all events.',
			},
			{
				displayName: 'Verification Mode',
				name: 'verifyMode',
				type: 'options',
				options: [
					{
						name: 'Pass-Through',
						value: 'passthrough',
						description: 'Verify signature but still process if invalid (logs verification status)',
					},
					{
						name: 'Skip',
						value: 'skip',
						description: 'Do not verify signatures at all (not recommended for production)',
					},
					{
						name: 'Strict',
						value: 'strict',
						description: 'Reject requests with invalid or missing signatures (recommended)',
					},
				],
				default: 'strict',
				description: 'How to handle HMAC signature verification',
			},
			{
				displayName: 'Timestamp Tolerance (Seconds)',
				name: 'tolerance',
				type: 'number',
				default: 300,
				description: 'Maximum age in seconds for a valid request timestamp',
				displayOptions: {
					hide: {
						verifyMode: ['skip'],
					},
				},
			},
		],
		usableAsTool: true,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	methods = {
		credentialTest: {
			async stickrApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const secret = credential.data?.signingSecret as string | undefined;
				if (!secret || secret.trim().length === 0) {
					return { status: 'Error', message: 'Signing secret must not be empty' };
				}
				return { status: 'OK', message: 'Signing secret is configured' };
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headers = req.headers;

		const eventType = headers['x-stickr-event'] as string | undefined;
		const eventVersionRaw = headers['x-stickr-event-version'] as string | undefined;
		const eventId = headers['x-stickr-event-id'] as string | undefined;
		const timestampRaw = headers['x-stickr-timestamp'] as string | undefined;
		const signatureHeader = headers['x-stickr-signature'] as string | undefined;
		const deliveryId = headers['x-stickr-delivery-id'] as string | undefined;
		const subscriptionId = headers['x-stickr-subscription-id'] as string | undefined;
		const attemptRaw = headers['x-stickr-attempt'] as string | undefined;

		const responseData = this.getResponseObject();

		if (!eventType || !eventVersionRaw || !eventId || !timestampRaw || !deliveryId) {
			responseData.status(400).send('Missing required X-STICKR-* headers');
			return { noWebhookResponse: true };
		}

		const selectedEvents = this.getNodeParameter('events') as string[];
		if (selectedEvents.length > 0 && !selectedEvents.includes(eventType)) {
			responseData.status(200).send('OK');
			return { noWebhookResponse: true };
		}

		const verifyMode = this.getNodeParameter('verifyMode') as VerifyMode;
		let verificationStatus: VerificationStatus = 'skipped';

		if (verifyMode !== 'skip') {
			const tolerance = this.getNodeParameter('tolerance') as number;
			const timestamp = parseInt(timestampRaw, 10);

			if (!signatureHeader) {
				if (verifyMode === 'strict') {
					responseData.status(400).send('Missing X-STICKR-Signature header');
					return { noWebhookResponse: true };
				}
				verificationStatus = 'unverified';
			} else {
				let credentials: ICredentialDataDecryptedObject | undefined;
				try {
					credentials = await this.getCredentials<ICredentialDataDecryptedObject>('stickrApi');
				} catch {
					// credentials not configured
				}

				const secret = (credentials?.signingSecret as string | undefined) ?? '';

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body));

				const valid = verifySignature(rawBody, signatureHeader, secret, timestamp, tolerance);

				if (valid) {
					verificationStatus = 'verified';
				} else if (verifyMode === 'strict') {
					responseData.status(401).send('Signature verification failed');
					return { noWebhookResponse: true };
				} else {
					verificationStatus = 'failed';
				}
			}
		}

		const body = req.body as Record<string, unknown>;

		const item = {
			json: {
				event_type: eventType,
				event_version: parseInt(eventVersionRaw, 10),
				event_id: eventId,
				occurred_at: (body.occurred_at as string) ?? new Date().toISOString(),
				organization_id: (body.organization_id as string) ?? '',
				data: (body.data as Record<string, unknown>) ?? {},
				_stickr_meta: {
					delivery_id: deliveryId,
					attempt: parseInt(attemptRaw ?? '1', 10),
					verification_status: verificationStatus,
					received_at: new Date().toISOString(),
					subscription_id: subscriptionId ?? '',
				},
			},
		};

		return {
			workflowData: [[item]],
		};
	}
}
