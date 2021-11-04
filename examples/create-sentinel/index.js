require('dotenv').config();

const abi = require('./abis/erc721.json')
const { SentinelClient } = require('defender-sentinel-client');

async function main() {
    const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
    const client = new SentinelClient(creds);
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
        name: 'MyNewSentinel',
        paused: false,
        addressRules: [
            {
                conditions: [
                    {
                        eventConditions: [],
                        txConditions: [],
                        functionConditions: [
                            {
                                functionSignature: 'renounceOwnership()',
                                expression: undefined,
                            },
                        ],
                    },
                ],
                autotaskCondition: undefined,
                address: '0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2',
                abi: JSON.stringify(abi)
            },
        ],
        alertThreshold: {
            amount: 2,
            windowSeconds: 3600,
        },
        notifyConfig: {
            // populate this with either an existing nofitication channel object
            // OR the newly created notification object
            notifications: [
                {
                    notificationId: notification.notificationId,
                    type: notification.type,
                },
            ],
            autotaskId: undefined,
            timeoutMs: 0,
        },
    };

    // call create with the request parameters
    const sentinelResponse = await client.create(requestParameters);

    console.log(sentinelResponse);
}

if (require.main === module) {
    main().catch(console.error);
}
