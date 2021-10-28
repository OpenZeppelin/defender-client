export { SentinelClient, SentinelResponseWithUrl as SentinelResponse } from './api';
export { SaveSubscriberRequest as CreateSentinelRequest } from './models/subscriber';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
