import { z } from "zod";
import { job_types } from "../constants";

export const jobs_request_schema = z.object({}).strict();

export const job_schema = z.object({
  job_id: z.string().min(1).max(128),
  job_type: z.enum(job_types),
  tick: z.number().int().min(0),
  summary: z.string().min(1).max(256),
  payload: z.record(z.string(), z.union([z.string(), z.number().int(), z.boolean(), z.null()]))
}).strict();

export const jobs_response_schema = z.object({
  server_tick: z.number().int().min(0),
  jobs: z.array(job_schema)
}).strict();
