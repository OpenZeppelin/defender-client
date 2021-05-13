import Lambda, { _Blob } from 'aws-sdk/clients/lambda';

// do our best to get .errorMessage, but return object by default
function cleanError(payload?: _Blob): _Blob {
  if (!payload) {
    return 'Error occurred, but error payload was not defined';
  }
  try {
    const errMsg = JSON.parse(payload.toString()).errorMessage;
    if (errMsg) {
      return errMsg;
    }
  } catch (e) {}
  return payload;
}

export abstract class BaseAutotaskClient {
  private lambda: Lambda;

  public constructor(credentials: string, private arn: string) {
    const creds = credentials ? JSON.parse(credentials) : undefined;
    this.lambda = new Lambda(
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

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected async execute<T>(request: object): Promise<T> {
    const result = await this.lambda
      .invoke({
        FunctionName: this.arn,
        Payload: JSON.stringify(request),
        InvocationType: 'RequestResponse',
      })
      .promise();

    if (result.FunctionError) {
      throw new Error(`Error while attempting request: ${cleanError(result.Payload)}`);
    }

    return JSON.parse(result.Payload as string) as T;
  }
}
