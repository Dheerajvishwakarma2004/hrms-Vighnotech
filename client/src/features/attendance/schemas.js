import { z } from "zod";
import { TASK_MAX_LENGTH } from "./constants";

/**
 * Task + status form. `statuses` comes from the meta options so the allowed values are never hard-coded;
 * while options are still loading only presence is checked (the server validates the enum as well).
 */
export function createAttendanceTaskSchema(statuses = []) {
  return z.object({
    status: z
      .string()
      .min(1, "Status is required")
      .refine(
        (value) => statuses.length === 0 || statuses.includes(value),
        "Select a valid status",
      ),
    task: z
      .string()
      .trim()
      .max(
        TASK_MAX_LENGTH,
        `Task must be at most ${TASK_MAX_LENGTH} characters`,
      ),
  });
}

/** Form values for an existing (or missing) attendance record. */
export function toAttendanceTaskValues(attendance) {
  return { status: attendance?.status ?? "", task: attendance?.task ?? "" };
}
