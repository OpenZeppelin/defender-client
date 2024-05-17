import { rateLimitModule, RateLimitModule } from '../utils/rate-limit';
import { getTimestampInSeconds } from '../utils/time';
import { getLambdaFromCredentials, isLambdaV3, isV3ResponsePayload, LambdaLike, PayloadResponseV2, PayloadResponseV3 } from '../utils/lambda';

// do our best to get .errorMessage, but return object by default
function cleanError(payload?: PayloadResponseV2 | PayloadResponseV3): PayloadResponseV2 | PayloadResponseV3 {
  if (!payload) {
    return 'Error occurred, but error payload was not defined';
  }
  const error = isV3ResponsePayload(payload) ? payload.transformToString() : payload;
  try {
    const errMsg = JSON.parse(error.toString()).errorMessage;
    if (errMsg) {
      return errMsg;
    }
  } catch (e) {}

  return error;
}

export abstract class BaseAutotaskClient {
  private lambda: LambdaLike;

  private invocationRateLimit: RateLimitModule;

  public constructor(credentials: string, private arn: string) {
    const creds = credentials ? JSON.parse(credentials) : undefined;

    this.invocationRateLimit = rateLimitModule.createCounterFor(arn, 300);

    this.lambda = getLambdaFromCredentials(credentials);
  }

  private async invoke(FunctionName: string, Payload: string) {
    if (isLambdaV3(this.lambda)) {
      return this.lambda.invoke({
        FunctionName,
        Payload,
        InvocationType: 'RequestResponse',
      });
    } else {
      return this.lambda
        .invoke({
          FunctionName,
          Payload,
          InvocationType: 'RequestResponse',
        })
        .promise();
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected async execute<T>(request: object): Promise<T> {
    const invocationTimeStamp = getTimestampInSeconds();

    this.invocationRateLimit.checkRateFor(invocationTimeStamp);
    this.invocationRateLimit.incrementRateFor(invocationTimeStamp);

    const invocationRequestResult = await this.invoke(this.arn, JSON.stringify(request));

    if (invocationRequestResult.FunctionError) {
      throw new Error(`Error while attempting request: ${cleanError(invocationRequestResult.Payload)}`);
    }

    return JSON.parse(
      isLambdaV3(this.lambda)
        ? (invocationRequestResult.Payload as PayloadResponseV3).transformToString()
        : (invocationRequestResult.Payload as string),
    ) as T;
  }
}
