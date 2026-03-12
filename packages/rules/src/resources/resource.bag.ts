import type { ResourceType } from "../../../schemas/src";
import { clampToCapacity } from "../guards/capacity";
import { clampNonNegative } from "../guards/nonnegative";
import { resource_default_values, resource_error_codes, resource_keys, resource_max_values } from "./resource.constants";
import type { ResourceBag, ResourceCapacity, ResourceDelta, ResourceIssue, ResourceResult } from "./resource.types";

const cloneBag = (bag?: Partial<ResourceBag>): ResourceBag => {
  const next = { ...resource_default_values };
  for (const resourceKey of resource_keys) {
    next[resourceKey] = clampNonNegative(bag?.[resourceKey] ?? resource_default_values[resourceKey]);
  }
  return next;
};

const createIssue = (resourceType: ResourceType, code: ResourceIssue["code"], message: string): ResourceIssue => ({
  code,
  resource_type: resourceType,
  message
});

export const createResourceBag = (bag?: Partial<ResourceBag>): ResourceBag => cloneBag(bag);

export const getResourceTotal = (bag: ResourceBag, resourceType: ResourceType): number => bag[resourceType];

export const addResourceDelta = (
  bag: ResourceBag,
  delta: ResourceDelta,
  capacity: ResourceCapacity = {}
): ResourceResult => {
  const next = cloneBag(bag);
  const issues: ResourceIssue[] = [];

  for (const resourceKey of resource_keys) {
    const change = delta[resourceKey] ?? 0;
    if (!Number.isInteger(change)) {
      issues.push(createIssue(resourceKey, resource_error_codes.INVALID_DELTA, `delta for ${resourceKey} must be an integer`));
      continue;
    }

    const rawValue = next[resourceKey] + change;
    if (rawValue < 0) {
      issues.push(createIssue(resourceKey, resource_error_codes.INSUFFICIENT_RESOURCE, `${resourceKey} would become negative`));
      continue;
    }

    const effectiveCapacity = capacity[resourceKey] ?? resource_max_values[resourceKey];
    if (rawValue > effectiveCapacity) {
      issues.push(createIssue(resourceKey, resource_error_codes.CAPACITY_EXCEEDED, `${resourceKey} exceeds capacity`));
      continue;
    }

    next[resourceKey] = clampToCapacity(rawValue, effectiveCapacity);
  }

  return issues.length > 0
    ? { ok: false, bag: next, issues }
    : { ok: true, bag: next, issues: [] };
};

export const subtractResourceCost = (bag: ResourceBag, cost: ResourceDelta): ResourceResult => {
  const negativeDelta: ResourceDelta = {};
  for (const resourceKey of resource_keys) {
    const value = cost[resourceKey] ?? 0;
    if (value !== 0) {
      negativeDelta[resourceKey] = -value;
    }
  }
  return addResourceDelta(bag, negativeDelta);
};

export const mergeResourceBags = (left: ResourceBag, right: Partial<ResourceBag>): ResourceBag =>
  createResourceBag(Object.fromEntries(resource_keys.map((resourceKey) => [resourceKey, (left[resourceKey] ?? 0) + (right[resourceKey] ?? 0)])) as Partial<ResourceBag>);
