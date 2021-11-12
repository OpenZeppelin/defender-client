// MIT License

// Copyright (c) 2019 Giorgio Delgado

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
/* eslint @typescript-eslint/no-use-before-define: 0 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

// eslint-disable-next-line @typescript-eslint/no-use-before-define
export const ok = <T, E>(value: T): Ok<T, E> => new Ok(value);

// eslint-disable-next-line @typescript-eslint/no-use-before-define
export const err = <T, E>(err: E): Err<T, E> => new Err(err);

export class Ok<T, E> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return !this.isOk();
  }

  map<A>(f: (t: T) => A): Result<A, E> {
    return ok(f(this.value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapErr<U>(_f: (e: E) => U): Result<T, U> {
    return ok(this.value);
  }

  // add info on how this is really useful for converting a
  // Result<Result<T, E2>, E1>
  // into a Result<T, E2>
  andThen<U>(f: (t: T) => ResultAsync<U, E>): ResultAsync<U, E>;
  andThen<U>(f: (t: T) => Result<U, E>): Result<U, E>;
  andThen<U>(f: (t: T) => Result<U, E> | ResultAsync<U, E>): Result<U, E> | ResultAsync<U, E> {
    return f(this.value);
  }

  asyncMap<U>(f: (t: T) => Promise<U>): ResultAsync<U, E> {
    return ResultAsync.fromPromise(f(this.value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  match = <A>(ok: (t: T) => A, _err: (e: E) => A): A => {
    return ok(this.value);
  };

  asNullable = (): T | null => {
    return this.value;
  };

  asUndefinable = (): T | undefined => {
    return this.value;
  };

  _unsafeUnwrap(): T {
    return this.value;
  }

  _unsafeUnwrapErr(): E {
    throw new Error('Called `_unsafeUnwrapErr` on an Ok');
  }
}

export class Err<T, E> {
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return !this.isOk();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map<A>(_f: (t: T) => A): Result<A, E> {
    return err(this.error);
  }

  mapErr<U>(f: (e: E) => U): Result<T, U> {
    return err(f(this.error));
  }

  andThen<U>(_f: (t: T) => Result<U, E>): Result<U, E>;
  // Since _f is ignored for Err, the return type is always a Result
  andThen<U>(_f: (t: T) => ResultAsync<U, E>): Result<U, E>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  andThen<U>(_f: (t: T) => Result<U, E> | ResultAsync<U, E>): Result<U, E> {
    return err(this.error);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  asyncMap<U>(_f: (t: T) => Promise<U>): ResultAsync<U, E> {
    return errAsync<U, E>(this.error);
  }

  match = <A>(_ok: (t: T) => A, err: (e: E) => A): A => {
    return err(this.error);
  };

  asNullable = (): T | null => {
    return null;
  };

  asUndefinable = (): T | undefined => {
    return undefined;
  };

  _unsafeUnwrap(): T {
    throw new Error('Called `_unsafeUnwrap` on an Err');
  }

  _unsafeUnwrapErr(): E {
    return this.error;
  }
}

export class ResultAsync<T, E> {
  private _promise: Promise<Result<T, E>>;

  constructor(res: Promise<Result<T, E>>) {
    this._promise = res;
  }

  static fromPromise<T, E>(promise: Promise<T>, errorFn?: (e: unknown) => E): ResultAsync<T, E> {
    let newPromise: Promise<Result<T, E>> = promise.then((value: T) => new Ok(value));
    if (errorFn) {
      newPromise = newPromise.catch((e) => new Err<T, E>(errorFn(e)));

      if (typeof process !== 'object' || (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production')) {
        const yellowColor = '\x1b[33m%s\x1b[0m';

        const warning = [
          '[neverthrow]',
          '`fromPromise` called without a promise rejection handler',
          'Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromsie` to convert a caught exception into an `Err` instance',
        ].join(' - ');

        console.warn(yellowColor, warning);
      }
    }
    return new ResultAsync(newPromise);
  }

  map = <A>(f: (t: T) => A | Promise<A>) =>
    new ResultAsync(
      this._promise.then(async (res: Result<T, E>) => {
        if (res.isErr()) {
          return new Err<A, E>(res.error);
        }

        return new Ok<A, E>(await f(res.value));
      }),
    );

  mapErr = <U>(f: (e: E) => U | Promise<U>) =>
    new ResultAsync(
      this._promise.then(async (res: Result<T, E>) => {
        if (res.isOk()) {
          return new Ok<T, U>(res.value);
        }

        return new Err<T, U>(await f(res.error));
      }),
    );

  andThen = <U>(f: (t: T) => Result<U, E> | ResultAsync<U, E>) =>
    new ResultAsync(
      this._promise.then((res) => {
        if (res.isErr()) {
          return new Err<U, E>(res.error);
        }

        const newValue = f(res.value);

        return newValue instanceof ResultAsync ? newValue._promise : newValue;
      }),
    );

  match = <A>(ok: (t: T) => A, _err: (e: E) => A) => this._promise.then((res) => res.match(ok, _err));

  // Makes ResultAsync awaitable
  then = <A>(successCallback: (res: Result<T, E>) => A) => this._promise.then(successCallback);
}

export const okAsync = <T, E>(value: T): ResultAsync<T, E> => new ResultAsync(Promise.resolve(new Ok<T, E>(value)));

export const errAsync = <T, E>(err: E): ResultAsync<T, E> => new ResultAsync(Promise.resolve(new Err<T, E>(err)));
