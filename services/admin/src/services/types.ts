export type AdminRequest = {
  headers?: Record<string, string | undefined>;
  query?: Record<string, string | undefined>;
  body?: unknown;
};

export type AdminResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    data?: T;
    error_code?: string;
    message?: string;
  };
};
