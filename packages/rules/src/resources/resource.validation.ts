import type { ResourceType } from "../../../schemas/src";
import { resource_keys, resource_max_values } from "./resource.constants";
import type { ResourceBag, ResourceIssue } from "./resource.types";

export const validateResourceBag = (bag: ResourceBag): ResourceIssue[] => {
  const issues: ResourceIssue[] = [];

  for (const resourceKey of resource_keys) {
    const value = bag[resourceKey as ResourceType];
    if (!Number.isInteger(value)) {
      issues.push({
        code: "RESOURCE_INVALID_DELTA",
        resource_type: resourceKey,
        message: `${resourceKey} must be an integer`
      });
      continue;
    }

    if (value < 0) {
      issues.push({
        code: "RESOURCE_NONNEGATIVE_VIOLATION",
        resource_type: resourceKey,
        message: `${resourceKey} cannot be negative`
      });
    }

    if (value > resource_max_values[resourceKey]) {
      issues.push({
        code: "RESOURCE_CAPACITY_EXCEEDED",
        resource_type: resourceKey,
        message: `${resourceKey} exceeds hard cap`
      });
    }
  }

  return issues;
};
