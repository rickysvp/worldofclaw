import type { ResourceType } from "../../../schemas/src";

export type ResourceBag = Record<ResourceType, number>;

export type ResourceCapacity = Partial<Record<ResourceType, number>>;

export type ResourceErrorCode =
  | "RESOURCE_NONNEGATIVE_VIOLATION"
  | "RESOURCE_CAPACITY_EXCEEDED"
  | "RESOURCE_INVALID_TYPE"
  | "RESOURCE_INSUFFICIENT"
  | "RESOURCE_INVALID_DELTA";

export type ResourceIssue = {
  code: ResourceErrorCode;
  resource_type: ResourceType;
  message: string;
};

export type ResourceResult = {
  ok: true;
  bag: ResourceBag;
  issues: [];
} | {
  ok: false;
  bag: ResourceBag;
  issues: ResourceIssue[];
};

export type ResourceDelta = Partial<Record<ResourceType, number>>;
