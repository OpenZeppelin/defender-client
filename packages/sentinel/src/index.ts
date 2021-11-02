import { BlockWatcher } from './models/blockwatcher';

export { SentinelClient } from './api';
export { SaveSubscriberRequest as CreateSentinelRequest } from './models/subscriber';
export { ExternalApiSentinelResponse as SentinelResponse, DeletedSentinelResponse } from './models/response';
export {
  NotificationType,
  SaveNotificationRequest as NotificationRequest,
  NotificationSummary as NotificationResponse,
} from './models/notification';

export { BlockWatcher } from './models/blockwatcher';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
