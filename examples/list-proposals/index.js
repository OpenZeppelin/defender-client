require('dotenv').config();

const { AdminClient } = require('@openzeppelin/defender-admin-client');

async function main() {
	const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
	const client = new AdminClient(creds);

	const proposals = await client.listProposals({
		limit: 10,
		next: undefined,
	});

	console.log(proposals);
}

if (require.main === module) {
	main().catch(console.error);
}
