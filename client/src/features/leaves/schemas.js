import { z } from "zod";
import { FILE_TYPES } from "@/lib/constants";
import { DATE_KEY_REGEX } from "@/lib/date";
import { dateKeyField, fileField } from "@/lib/validation";
import { leaveDateKey } from "./utils/calendar";

/** Employee chosen in the EmployeePicker (the whole summary object, so the picker can show it). */
const employeeRef = z
  .object(
    { _id: z.string(), fullName: z.string() },
    { invalid_type_error: "Select an employee" },
  )
  .passthrough()
  .nullable()
  .refine((value) => value !== null, "Select an employee");

const leaveFields = z.object({
  employee: employeeRef,
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: dateKeyField("Start date"),
  endDate: dateKeyField("End date"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
  status: z.string().min(1, "Status is required"),
  document: fileField({ label: "Document", ...FILE_TYPES.leaveDocument }),
});

/** Separate intersection branch so the range error shows even while other fields are still invalid. */
const validDateRange = z
  .object({ startDate: z.string(), endDate: z.string() })
  .refine(
    ({ startDate, endDate }) =>
      !DATE_KEY_REGEX.test(startDate) ||
      !DATE_KEY_REGEX.test(endDate) ||
      endDate >= startDate,
    { path: ["endDate"], message: "End date cannot be before start date" },
  );

/** Mirrors the server's leave validator (server/src/validators/leave.validator.js). */
export const leaveSchema = z.intersection(leaveFields, validDateRange);

export const LEAVE_FORM_FIELDS = [
  "employee",
  "leaveType",
  "startDate",
  "endDate",
  "reason",
  "status",
  "document",
];

/** Server field names that differ from the form's. */
export const LEAVE_SERVER_FIELD_MAP = { employeeId: "employee" };

/** Form defaults for creating (no `leave`) or editing an existing leave. */
export function getLeaveFormDefaults(leave, defaultStatus = "Pending") {
  if (!leave) {
    return {
      employee: null,
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: defaultStatus,
      document: null,
    };
  }
  return {
    employee: leave.employee ?? null,
    leaveType: leave.leaveType ?? "",
    startDate: leaveDateKey(leave.startDate),
    endDate: leaveDateKey(leave.endDate),
    reason: leave.reason ?? "",
    status: leave.status ?? defaultStatus,
    document: null,
  };
}

/** Form values → multipart payload fields expected by `POST/PATCH /api/leaves`. */
export function toLeavePayload(values, { includeStatus }) {
  return {
    employeeId: values.employee._id,
    leaveType: values.leaveType,
    startDate: values.startDate,
    endDate: values.endDate,
    reason: values.reason,
    status: includeStatus ? values.status : undefined,
    document: values.document ?? undefined,
  };
}
