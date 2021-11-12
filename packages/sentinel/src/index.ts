export { SentinelClient } from './api';
export { ExternalCreateSubscriberRequest as CreateSentinelRequest } from './models/subscriber';
export { CreateSentinelResponse, DeletedSentinelResponse } from './models/response';
export {
  NotificationType,
  SaveNotificationRequest as NotificationRequest,
  NotificationSummary as NotificationResponse,
} from './models/notification';

export { BlockWatcher } from './models/blockwatcher';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
