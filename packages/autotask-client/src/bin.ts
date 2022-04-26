#!/usr/bin/env node
import { AxiosError } from 'axios';
import 'dotenv/config';
import { createWriteStream, WriteStream } from 'fs';
import { argv } from 'process';
import { VERSION } from '.';
import { AutotaskRunListItemResponse } from './models/autotask-run.res';
import { initClient, output, validateId, validatePath } from './utils';

type Command = 'update-code' | 'tail-runs' | 'execute-run';

function printUsage(dueToError = true) {
  if (dueToError) {
    console.error(`\ndefender-autotask-client: Command not found or wrong parameters provided!\n`);
  }
  console.error(`Defender Autotask Client (version ${VERSION})\n`);
  console.error('Usage: defender-autotask update-code $AUTOTASK_ID $PATH');
  console.error('\nExample:\n  defender-autotask update-code 19ef0257-bba4-4723-a18f-67d96726213e ./lib/autotask\n');
  console.error('Usage: defender-autotask tail-runs $AUTOTASK_ID');
  console.error('\nExample:\n  defender-autotask tail-runs 19ef0257-bba4-4723-a18f-67d96726213e\n');
  console.error('Usage: defender-autotask execute-run $AUTOTASK_ID');
  console.error('\nExample:\n  defender-autotask execute-run 19ef0257-bba4-4723-a18f-67d96726213e\n');
}

/**
 * Makes sure that mandatory params for the given command are present.
 * @param command The command to validate.
 */
function mandatoryParamGuard(command: Command) {
  switch (command) {
    case 'update-code':
      if (!argv[3] || !argv[4]) {
        printUsage();
        process.exit(1);
      }
      break;
    // Same requirements for now
    case 'tail-runs':
    case 'execute-run':
      if (!argv[3]) {
        printUsage();
        process.exit(1);
      }
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

/* -------------------------------- Commands -------------------------------- */

/**
 * Utilizes the Autotask API to update the code of a given autotask.
 */
async function updateCode() {
  const autotaskId = argv[3];
  const path = argv[4];
  try {
    validateId(autotaskId);
    validatePath(path);

    const client = initClient();
    console.error(`Uploading code for autotask ${autotaskId} from ${path}...`);
    await client.updateCodeFromFolder(autotaskId, path);
  } catch (error) {
    const err = error as Error | AxiosError;
    console.error(`Error updating Autotask code: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Utilizes the Autotask API to poll for new runs and print them out.
 */
async function tailRuns() {
  const autotaskId = argv[3];
  const logSavePath = argv[4];
  let logSaveDest: string | undefined;
  let stream: WriteStream | undefined;
  if (logSavePath) {
    validatePath(logSavePath);
    logSaveDest = `${logSavePath}/${autotaskId}-runs.log`;
    stream = createWriteStream(logSaveDest, { flags: 'a' });
  }

  try {
    validateId(autotaskId);
    const client = initClient();
    output(`\nPolling latest runs of autotask '${autotaskId}'...\n`, stream);
    // Poll autotask runs every 2 seconds and if there are new runs, get run details and print them out.
    let lastRun: AutotaskRunListItemResponse | undefined;
    while (true) {
      const newRuns = await client.listAutotaskRuns(autotaskId);
      // If cached last run id has changed
      if (newRuns.items[0]?.autotaskRunId !== lastRun?.autotaskRunId) {
        lastRun = newRuns.items[0]; // cache new last run to avoid duplicates.

        if (lastRun.status !== 'success') {
          output(`\nLatest run '${lastRun.autotaskRunId}' ${lastRun.status}...`, stream);
          lastRun = undefined; // clean up so we can check it again next time.
        } else {
          output(`\nLatest run '${lastRun.autotaskRunId}' ${lastRun.status}...`, stream);
          const runDetails = await client.getAutotaskRun(lastRun.autotaskRunId);
          // Have to make this check to satisfy Typescript.
          if (runDetails.status === 'success') {
            output(`\n${runDetails.decodedLogs}`, stream);
            output(`\n------------------------------------------------------------`, stream);
            output(`\nPolling latest runs of autotask '${autotaskId}'...\n`, stream);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    const err = error as Error | AxiosError;
    output(`Error on listening to Autotask runs: ${err.message}`, stream);
    process.exit(1);
  }
}

/**
 * Utilizes the Autotask API to trigger autotask run manually.
 */
async function executeRun() {
  const autotaskId = argv[3];
  try {
    validateId(autotaskId);
    const client = initClient();
    console.log(`Executing autotask run for autotask '${autotaskId}'...`);
    // TODO: pass in params maybe? Do we have any case for that?
    const resp = await client.runAutotask(autotaskId, {});
    console.log(`Successfully executed autotask run for autotask '${autotaskId}'`);
    console.log(`Run ID: ${resp.autotaskRunId}, \nStatus: ${resp.status}`);
    console.info(`Tip: Call 'defender-autotask tail-runs ${autotaskId}' to follow the runs.`);
  } catch (error) {
    const err = error as Error | AxiosError;
    console.error(`Error executing autotask run: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  mandatoryParamGuard(argv[2] as Command);

  switch (argv[2]) {
    case 'update-code':
      await updateCode();
      break;
    case 'tail-runs':
      await tailRuns();
      break;
    case 'execute-run':
      await executeRun();
      break;
    default:
      throw new Error(`unhandled command '${argv[2]}'. Fix your paramGuard.`);
  }
}

main();
