require('dotenv').config();

const { AdminClient } = require('@openzeppelin/defender-admin-client');

async function main() {
	const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
	const client = new AdminClient(creds);

	const allProposals = await client.listProposals();

	if (allProposals.length > 1) {
		// pagination example
		const firstPage = await client.listProposals({
			limit: 1,
			next: undefined,
		});

		const secondPage = await client.listProposals({
			limit: 1,
			next: firstPage.next,
		});

		console.log('First page:', firstPage.items);
		console.log('Second page:', secondPage.items);
	}

	console.log('All proposals:', allProposals);
}

if (require.main === module) {
	main().catch(console.error);
}
