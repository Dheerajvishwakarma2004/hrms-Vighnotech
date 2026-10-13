import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import EmployeeIdentity from "@/components/data/EmployeeIdentity";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Textarea from "@/components/ui/Textarea";
import { NOT_MARKED } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { applyServerErrors, getErrorMessage } from "@/lib/errors";
import { useUpsertAttendanceMutation } from "../attendanceApi";
import { TASK_MAX_LENGTH } from "../constants";
import { createAttendanceTaskSchema, toAttendanceTaskValues } from "../schemas";

const FORM_ID = "attendance-task-form";
const STATUS_ID = "attendance-status";
const TASK_ID = "attendance-task";
const FORM_FIELDS = ["status", "task"];

/**
 * Form body. Mounted only while the modal is open, so every open starts from the row's current values.
 * `onSave(values)` must return a promise that rejects with the RTK Query error.
 */
function AttendanceTaskForm({ row, statuses, onSave, onSaved }) {
  const schema = useMemo(
    () => createAttendanceTaskSchema(statuses),
    [statuses],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: toAttendanceTaskValues(row.attendance),
  });

  const taskLength = useWatch({ control, name: "task" })?.length ?? 0;

  const onSubmit = async (values) => {
    try {
      await onSave(values);
      onSaved();
    } catch (error) {
      if (!applyServerErrors(error, setError, { fields: FORM_FIELDS }))
        toast.error(getErrorMessage(error));
    }
  };

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <EmployeeIdentity employee={row.employee} />
        <StatusBadge status={row.attendance?.status ?? NOT_MARKED} />
      </div>

      <FormField
        label="Status"
        htmlFor={STATUS_ID}
        error={errors.status?.message}
        required
      >
        {/* Controlled so the saved status shows up even when the meta options load after the form mounted. */}
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              id={STATUS_ID}
              options={statuses}
              placeholder="Select status"
              placeholderDisabled
              error={errors.status?.message}
            />
          )}
        />
      </FormField>

      <FormField
        label="Task"
        htmlFor={TASK_ID}
        error={errors.task?.message}
        hint="What is the employee working on today? Leave empty if no task is assigned."
        action={
          <span
            className={
              taskLength > TASK_MAX_LENGTH
                ? "text-xs font-medium text-rose-600"
                : "text-xs text-slate-400"
            }
          >
            {taskLength}/{TASK_MAX_LENGTH}
          </span>
        }
      >
        <Textarea
          id={TASK_ID}
          rows={5}
          placeholder="e.g. Finish the payroll export and review pull requests"
          error={errors.task?.message}
          hasHint={!errors.task}
          {...register("task")}
        />
      </FormField>
    </form>
  );
}

/**
 * Edits the task and status of one employee for the selected day (PUT upsert).
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{ employee: object, attendance: object|null }|null} row snapshot taken when the modal was opened
 * @param {string} date `YYYY-MM-DD`
 * @param {string[]} statuses attendance statuses from the meta options
 */
export default function AttendanceTaskModal({
  open,
  onClose,
  row,
  date,
  statuses,
}) {
  const [upsertAttendance, { isLoading }] = useUpsertAttendanceMutation();

  const save = (values) =>
    upsertAttendance({
      employeeId: row.employee._id,
      date,
      ...values,
    }).unwrap();
  const handleSaved = () => {
    toast.success(`Attendance saved for ${row.employee.fullName}`);
    onClose();
  };

  return (
    <Modal
      open={open && Boolean(row)}
      onClose={onClose}
      dismissible={!isLoading}
      title={row?.attendance ? "Update task & status" : "Mark attendance"}
      description={formatDate(date, "EEEE, dd MMM yyyy")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isLoading}>
            Save
          </Button>
        </>
      }
    >
      <AttendanceTaskForm
        row={row}
        statuses={statuses}
        onSave={save}
        onSaved={handleSaved}
      />
    </Modal>
  );
}
