export type PlatformRequest = {
  headers?: Record<string, string | undefined>;
  query?: Record<string, string | undefined>;
  body?: unknown;
};

export type PlatformResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    data?: T;
    error_code?: string;
    message?: string;
  };
};
