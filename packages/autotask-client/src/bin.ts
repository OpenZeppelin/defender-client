#!/usr/bin/env node
import { AxiosError } from 'axios';
import 'dotenv/config';
import { argv } from 'process';
import { VERSION } from '.';
import { initClient, tailLogsFor, validateId, validatePath } from './utils';

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
  const autotaskId = argv[3] as string;
  const path = argv[4] as string;
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
  const autotaskId = argv[3] as string;
  try {
    await tailLogsFor(initClient(), autotaskId);
  } catch (e) {
    const err = e as Error | AxiosError;
    console.error(`Error on listening to Autotask runs: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Utilizes the Autotask API to trigger autotask run manually.
 */
async function executeRun() {
  const autotaskId = argv[3] as string;
  try {
    validateId(autotaskId);
    const client = initClient();
    console.warn(`Executing autotask run for autotask '${autotaskId}'...`);
    const resp = await client.runAutotask(autotaskId, {});
    console.warn(`Successfully executed autotask run for autotask '${autotaskId}'`);
    console.warn(`Run ID: ${resp.autotaskRunId}, \nStatus: ${resp.status}`);
    console.warn(`Tip: Call 'defender-autotask tail-runs ${autotaskId}' to follow the runs.`);
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
      throw new Error(`unhandled command '${argv[2]}'. Make sure your 'mandatoryParamGuard' handles this command.`);
  }
}

main();
