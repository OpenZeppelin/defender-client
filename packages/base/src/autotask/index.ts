import Lambda, { _Blob } from 'aws-sdk/clients/lambda';
import { rateLimitModule, RateLimitModule } from '../utils/rate-limit';
import { getTimestampInSeconds } from '../utils/time';

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

  private invocationRateLimit: RateLimitModule;

  public constructor(credentials: string, private arn: string) {
    const creds = credentials ? JSON.parse(credentials) : undefined;

    this.invocationRateLimit = rateLimitModule.createCounterFor(arn, 300);

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
    const invocationTimeStamp = getTimestampInSeconds();

    this.invocationRateLimit.checkRateFor(invocationTimeStamp);
    this.invocationRateLimit.incrementRateFor(invocationTimeStamp);

    const invocationRequestResult = await this.lambda
      .invoke({
        FunctionName: this.arn,
        Payload: JSON.stringify(request),
        InvocationType: 'RequestResponse',
      })
      .promise();

    if (invocationRequestResult.FunctionError) {
      throw new Error(`Error while attempting request: ${cleanError(invocationRequestResult.Payload)}`);
    }

    return JSON.parse(invocationRequestResult.Payload as string) as T;
  }
}
