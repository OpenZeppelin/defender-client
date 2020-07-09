import fs from 'fs';
import findUp from 'find-up';
import { merge } from 'lodash';

export interface Config {
  RelayerPoolClientId: string;
  RelayerPoolId: string;
  ApiUrl: string;
}

const CONFIG_PATH = 'defender-client.config.js';

const defaultConfig: Config = {
  ApiUrl: 'https://jdspau484f.execute-api.us-west-2.amazonaws.com/prod/',
  RelayerPoolId: 'us-west-2_iLmIggsiy',
  RelayerPoolClientId: '1bpd19lcr33qvg5cr3oi79rdap',
};

function getConfig(): Config {
  const location = findUp.sync(CONFIG_PATH, { type: 'file' });
  const providedConfig: Config = location != undefined && fs.existsSync(location) ? require(location) : {};
  const config = merge(defaultConfig, providedConfig);
  return config;
}

export default getConfig();
