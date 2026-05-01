import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class StickrApi implements ICredentialType {
	name = 'stickrApi';
	displayName = 'STICKR API';
	documentationUrl = 'https://developers.stickr.de/connectors/n8n';
	icon = 'file:stickr.svg' as const;
	testedBy = 'stickrApiTest';

	properties: INodeProperties[] = [
		{
			displayName: 'Signing Secret',
			name: 'signingSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'The signing secret from your STICKR webhook subscription. ' +
				'Find it in STICKR under Integrations → Webhooks → [your subscription] → Settings.',
		},
	];
}
