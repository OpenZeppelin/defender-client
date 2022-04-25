import { createWriteStream, existsSync } from 'fs';
import { AutotaskClient } from './api';

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
 * Very raw utility function to pass the string to the console or a file. Or both.
 * @param str message to be printed/saved
 * @param saveDest path with a filename to save the message to
 * @param print toggle console printing off/on (default: true)
 */
export function output(str: string, saveDest?: string, print = true): void {
  if (print) {
    console.log(str);
  }
  if (saveDest) {
    const stream = createWriteStream(saveDest, { flags: 'a' });
    stream.write(JSON.parse(JSON.stringify(str)));
  }
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
