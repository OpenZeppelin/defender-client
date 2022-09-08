import { AxiosError } from 'axios';
import { existsSync } from 'fs';
import { AutotaskClient } from './api';
import {
  AutotaskRunErrorData,
  AutotaskRunListItemResponse,
  AutotaskRunStatus,
  AutotaskRunSuccessData,
} from './models/autotask-run.res';

/**
 * Verifies that the environment variables are present and initializes the client.
 * @returns The initialized client instance.
 */
export function initClient(): AutotaskClient {
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
  if (!apiKey || !apiSecret) throw new Error(`API_KEY or API_SECRET env vars are missing`);
  const client = new AutotaskClient({ apiKey, apiSecret });
  return client;
}

/**
 * Regex Validator for Autotask and Autotask run IDs.
 */
export function validateId(id: string): void {
  const regex = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i;
  if (regex.test(id)) {
    return;
  } else {
    throw new Error(`invalid id '${id}'`);
  }
}

/**
 * Checks if path exists, otherwise throws an error.
 */
export function validatePath(path: string): void {
  if (existsSync(path)) {
    return;
  } else {
    throw new Error(`path ${path} does not exist`);
  }
}

export async function tailLogsFor(client: AutotaskClient, autotaskId: string) {
  try {
    validateId(autotaskId);
    console.warn(`\nPolling latest runs of autotask '${autotaskId}'...\n`);
    // Poll autotask runs every 2 seconds and if there are new runs, get run details and print them out.
    let lastRun: AutotaskRunListItemResponse | undefined;
    while (true) {
      const newRuns = await client.listAutotaskRuns(autotaskId);
      // If cached last run id has changed
      if (newRuns.items[0]?.autotaskRunId !== lastRun?.autotaskRunId) {
        lastRun = newRuns.items[0]; // cache new last run to avoid duplicates.
        const status = lastRun.status as AutotaskRunStatus;
        if (status === 'pending') {
          lastRun = undefined; // clean up so we can check it again on the next poll.
        } else if (status === 'error') {
          const runDetails = (await client.getAutotaskRun(lastRun.autotaskRunId)) as AutotaskRunErrorData;
          console.log(`\nError: ${runDetails.message}`);
          runDetails.decodedLogs ? console.log(`\n${runDetails.decodedLogs}`) : console.log(`No logs available.`);
        } else if (status === 'success') {
          const runDetails = (await client.getAutotaskRun(lastRun.autotaskRunId)) as AutotaskRunSuccessData;
          console.log(`\n${runDetails.decodedLogs}`);
        } else if (status === 'throttled') {
          console.warn(
            `\nThis autotask run was canceled since the hourly run capacity for your account has been exceeded. Contact us at defender-support@openzeppelin.com for additional capacity.`,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (e) {
    throw e;
  }
}
