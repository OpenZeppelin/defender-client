export { AutotaskClient } from './api';
export {
  CreateAutotaskRequest,
  UpdateAutotaskRequest,
  GetSecretsResponse,
  SaveSecretsRequest,
} from './models/autotask';
export { AutotaskRunBase, AutotaskRunListResponse, AutotaskRunResponse } from './models/autotask-run.res';
export { AutotaskDeleteResponse, AutotaskListResponse, AutotaskResponse } from './models/response';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
