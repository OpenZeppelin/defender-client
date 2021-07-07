#!/usr/bin/env node
import 'dotenv/config';
import { existsSync } from 'fs';
import { argv } from 'process';
import { AutotaskClient, VERSION } from '.';

function printUsage() {
  console.error(`Defender Autotask Client (version ${VERSION})\n`);
  console.error('Usage: defender-autotask update-code $AUTOTASK_ID $PATH');
  console.error('\nExample:\n  defender-autotask update-code 19ef0257-bba4-4723-a18f-67d96726213e ./lib/autotask\n');
}

async function updateCode() {
  const autotaskId = argv[3];
  const path = argv[4];
  const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;

  if (autotaskId.length !== 36) throw new Error(`invalid autotask id '${autotaskId}'`);
  if (!existsSync(path)) throw new Error(`path ${path} does not exist`);
  if (!apiKey || !apiSecret) throw new Error(`API_KEY or API_SECRET env vars are missing`);

  const client = new AutotaskClient({ apiKey, apiSecret });
  console.error(`Uploading code for autotask ${autotaskId} from ${path}...`);
  await client.updateCodeFromFolder(autotaskId, path);
}

async function main() {
  if (argv[2] !== 'update-code' || !argv[3] || !argv[4]) {
    printUsage();
    return;
  }

  try {
    await updateCode();
  } catch (err) {
    console.error(`Error updating Autotask code: ${err.message}`);
    process.exit(1);
  }
}

main();
