export interface EventTypeOption {
	name: string;
	value: string;
	description: string;
}

export const STICKR_EVENT_TYPES: EventTypeOption[] = [
	{ name: 'Album Completed', value: 'album.completed', description: 'A user has completed an album' },
	{ name: 'Album Threshold Reached', value: 'album.threshold_reached', description: 'A user crossed a milestone (25/50/75/90%)' },
	{ name: 'Item Claimed', value: 'item.claimed', description: 'A user added a new sticker to their collection' },
	{ name: 'Item Rare Pulled', value: 'item.rare_pulled', description: 'A user pulled a rare/epic/legendary item' },
	{ name: 'Pack Issued', value: 'pack.issued', description: 'A pack was issued to a user' },
	{ name: 'Trade Settled', value: 'trade.settled', description: 'A trade between users completed successfully' },
	{ name: 'Campaign Started', value: 'campaign.started', description: 'A distribution campaign went live' },
	{ name: 'Campaign Ended', value: 'campaign.ended', description: 'A distribution campaign concluded' },
	{ name: 'User Registered', value: 'user.registered', description: 'A user joined via this organization' },
	{ name: 'Webhook Test', value: 'webhook.test', description: 'Manual test event from STICKR Admin UI' },
];

export const STICKR_EVENT_VALUES = STICKR_EVENT_TYPES.map((e) => e.value);
