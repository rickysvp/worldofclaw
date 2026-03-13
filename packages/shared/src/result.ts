export type Result<TData, TError extends string> =
  | {
      ok: true;
      data: TData;
      error: null;
    }
  | {
      ok: false;
      data: null;
      error: TError;
    };

export const ok = <TData>(data: TData): Result<TData, never> => ({
  ok: true,
  data,
  error: null
});

export const err = <TError extends string>(error: TError): Result<never, TError> => ({
  ok: false,
  data: null,
  error
});
