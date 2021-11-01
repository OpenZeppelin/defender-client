export { SentinelClient } from './api';
export { SaveSubscriberRequest as CreateSentinelRequest } from './models/subscriber';
export { ExternalApiSentinelResponse as SentinelResponse } from './models/response';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
