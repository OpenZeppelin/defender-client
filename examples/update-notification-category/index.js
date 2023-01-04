require('dotenv').config();

const { SentinelClient } = require('defender-sentinel-client');

async function main() {
    const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
    const client = new SentinelClient(creds);

    let notification;
    // use an existing notification channel
    const notificationChannels = await client.listNotificationChannels();
    if (notificationChannels.length > 0) {
        // Select your desired notification channel
        notification = notificationChannels[0];
    } else {
        // OR create a new notification channel
        notification = await client.createNotificationChannel({
            type: 'email',
            name: 'MyEmailNotification',
            config: {
                emails: ['john@example.com'],
            },
            paused: false,
        });
    }

    const getExistingCategory = (await client.listNotificationCategories())[0];

    const category = {
        ...getExistingCategory,
        description: "Attach this category to high-risk monitors",
        notificationIds: [{ notificationId: notification.notificationId, type: notification.type }]
    }
    // call update with the request parameters
    const response = await client.updateNotificationCategory(category);
    console.log(response);
}

if (require.main === module) {
    main().catch(console.error);
}
