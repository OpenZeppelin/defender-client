import { version } from 'node:process';

const NODE_MIN_VERSION_FOR_V3 = 18;

export type InvokeResponse = {
  FunctionError?: string;
  Payload: PayloadResponseV2 | PayloadResponseV3;
};

export type InvokeResponseV2 = {
  promise: () => Promise<InvokeResponse>;
};

export type PayloadResponseV3 = {
  transformToString: () => string;
};

export type PayloadResponseV2 = string | Buffer | Uint8Array | Blob;

export type LambdaV2 = {
  invoke: (params: { FunctionName: string; Payload: string; InvocationType: string }) => InvokeResponseV2;
};

export type LambdaV3 = {
  invoke: (params: { FunctionName: string; Payload: string; InvocationType: string }) => Promise<InvokeResponse>;
};

export type LambdaLike = LambdaV2 | LambdaV3;

export type LambdaCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
};

function isLambdaV3Compatible(): boolean {
  // example version: v14.17.0
  const majorVersion = version.slice(1).split('.')[0];
  if (!majorVersion) return false;
  return parseInt(majorVersion, 10) >= NODE_MIN_VERSION_FOR_V3;
}

export function isLambdaV3(lambda: LambdaLike): lambda is LambdaV3 {
  return isLambdaV3Compatible();
}

export function isV3ResponsePayload(payload: PayloadResponseV2 | PayloadResponseV3): payload is PayloadResponseV3 {
  return (payload as PayloadResponseV3).transformToString !== undefined;
}

export function getLambdaFromCredentials(credentials: string): LambdaLike {
  const creds: LambdaCredentials = credentials ? JSON.parse(credentials) : undefined;
  if (isLambdaV3Compatible()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Lambda } = require('@aws-sdk/client-lambda');
    return new Lambda({
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      },
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Lambda = require('aws-sdk/clients/lambda');
    return new Lambda(
      creds
        ? {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
            },
          }
        : undefined,
    );
  }
}
