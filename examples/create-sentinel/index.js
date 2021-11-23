require('dotenv').config();

const abi = require('./abis/erc721.json')
const { SentinelClient } = require('defender-sentinel-client');

async function main() {
    const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
    console.log("Attempting to connect with:", creds);
    const client = new SentinelClient(creds);

    // Succeeds
    const notifs = await client.listNotificationChannels()
    console.log("List notifications: ", notifs.length)

    const blockWatchers = await client.listBlockwatchers()
    console.log("List blockwatchers: ", blockWatchers.length)

    const sentinels = await client.list()
    console.log("List sentinels: ", sentinels.length)

    const blockwatcherWithNetwork = await client.getBlockwatcherIdByNetwork('rinkeby')
    console.log("List blockwatchers for rinkeby: ", blockwatcherWithNetwork.length)


    // Fails
    const createNotifRes = await client.createNotificationChannel('email', {
        name: 'MyEmailNotification',
        config: {
            emails: ['john@example.com']
        },
        paused: false
    })
    console.log("Create a notification:", createNotifRes);

    const pauseSentinel = await client.pause('ae0750d7-7d6f-427c-946e-f3352acf655e');
    console.log("Pause a sentinel:", pauseSentinel);

    const getSentinel = await client.get('ae0750d7-7d6f-427c-946e-f3352acf655e');
    console.log("Get a sentinel:", getSentinel);




    let notification;
    // use an existing notification channel
    const notificationChannels = await client.listNotificationChannels()
    if (notificationChannels.length > 0) {
        // Select your desired notification channel
        notification = notificationChannels[0]
    } else {
        // OR create a new notification channel
        notification = await client.createNotificationChannel('email', {
            name: 'MyEmailNotification',
            config: {
                emails: ['john@example.com']
            },
            paused: false
        })
    }

    // populate the request parameters

    const requestParameters = {
        network: 'rinkeby',
        // optional
        confirmLevel: 1, // if not set, we pick the blockwatcher for the chosen network with the lowest offset
        name: 'MyNewSentinel111',
        address: '0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2',
        abi: JSON.stringify(abi),
        // optional
        paused: false,
        eventConditions: [
            { eventSignature: 'OwnershipTransferred(address,address)', expression: 'previousOwner=0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2' },
            { eventSignature: 'Transfer(address,address,uint256)' }
        ],
        functionConditions: [{ functionSignature: 'renounceOwnership()' }],
        // optional
        txCondition: 'gasPrice > 0',
        // optional
        autotaskCondition: '3dcfee82-f5bd-43e3-8480-0676e5c28964',
        // optional
        autotaskTrigger: undefined,
        // optional
        alertThreshold: {
            amount: 2,
            windowSeconds: 3600,
        },
        // optional
        alertTimeoutMs: 0,
        notificationChannels: [notification.notificationId],
    }

    // call create with the request parameters
    const sentinelResponse = await client.create(requestParameters);

    console.log(sentinelResponse);
}

if (require.main === module) {
    main().catch(console.error);
}
