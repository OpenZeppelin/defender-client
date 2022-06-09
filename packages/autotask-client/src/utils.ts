import { existsSync, WriteStream } from 'fs';
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
