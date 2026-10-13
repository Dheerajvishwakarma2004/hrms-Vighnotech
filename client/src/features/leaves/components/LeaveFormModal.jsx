import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Save } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FileInput from "@/components/ui/FileInput";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useMetaOptions } from "@/features/meta/metaApi";
import { FILE_TYPES } from "@/lib/constants";
import { applyServerErrors, getErrorMessage } from "@/lib/errors";
import { useCreateLeaveMutation, useUpdateLeaveMutation } from "../leavesApi";
import {
  LEAVE_FORM_FIELDS,
  LEAVE_SERVER_FIELD_MAP,
  getLeaveFormDefaults,
  leaveSchema,
  toLeavePayload,
} from "../schemas";
import { countDays } from "../utils/calendar";
import { pluralize } from "@/lib/format";
import { formatDateRange } from "@/lib/date";
import EmployeePicker from "./EmployeePicker";

const REASON_MAX = 500;

/**
 * Form body. Mounted only while the modal is open, so every open starts from fresh defaults.
 * `onSave(payload)` must return a promise that rejects with the RTK Query error.
 * Selects are controlled so saved values show up even when the meta options load after the form mounted.
 */
function LeaveForm({ formId, leave, saving, onSave, onSaved }) {
  const isEdit = Boolean(leave);
  const { options, isLoading: optionsLoading } = useMetaOptions();
  const [conflict, setConflict] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: getLeaveFormDefaults(leave),
    mode: "onTouched",
  });

  const [startDate, endDate, reason] = useWatch({
    control,
    name: ["startDate", "endDate", "reason"],
  });
  const totalDays = countDays(startDate, endDate);

  const onSubmit = async (values) => {
    setConflict(null);
    const payload = toLeavePayload(values, { includeStatus: !isEdit });
    try {
      await onSave(payload);
      onSaved(payload);
    } catch (error) {
      const message = getErrorMessage(
        error,
        isEdit ? "Could not update the leave" : "Could not create the leave",
      );
      if (error?.status === 409) {
        setConflict(message);
        return;
      }
      const applied = applyServerErrors(error, setError, {
        fieldMap: LEAVE_SERVER_FIELD_MAP,
        fields: LEAVE_FORM_FIELDS,
        fileField: "document",
      });
      if (!applied) toast.error(message);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      {conflict && (
        <Alert
          variant="error"
          title="Overlapping leave"
          onDismiss={() => setConflict(null)}
        >
          {conflict}. Change the dates, or reject the existing leave first.
        </Alert>
      )}

      <FormField
        label="Employee"
        htmlFor="leave-employee"
        error={errors.employee?.message}
        required
      >
        <Controller
          name="employee"
          control={control}
          render={({ field }) => (
            <EmployeePicker
              id="leave-employee"
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.employee?.message}
              disabled={saving}
            />
          )}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Leave type"
          htmlFor="leave-type"
          error={errors.leaveType?.message}
          required
        >
          <Controller
            name="leaveType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="leave-type"
                placeholder={optionsLoading ? "Loading…" : "Select leave type"}
                placeholderDisabled
                options={options.leaveTypes}
                error={errors.leaveType?.message}
                disabled={saving}
              />
            )}
          />
        </FormField>

        {!isEdit && (
          <FormField
            label="Status"
            htmlFor="leave-status"
            error={errors.status?.message}
            hint="Approved leaves appear in the leave calendar."
            required
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  id="leave-status"
                  options={
                    options.leaveStatuses.length
                      ? options.leaveStatuses
                      : [field.value]
                  }
                  error={errors.status?.message}
                  hasHint
                  disabled={saving}
                />
              )}
            />
          </FormField>
        )}

        <FormField
          label="First day of leave"
          htmlFor="leave-start"
          error={errors.startDate?.message}
          required
        >
          <Input
            id="leave-start"
            type="date"
            error={errors.startDate?.message}
            disabled={saving}
            {...register("startDate", { deps: ["endDate"] })}
          />
        </FormField>

        <FormField
          label="Last day of leave"
          htmlFor="leave-end"
          error={errors.endDate?.message}
          hint={
            totalDays > 0
              ? `${pluralize(totalDays, "day")} in total · ${formatDateRange(startDate, endDate)}`
              : undefined
          }
          required
        >
          <Input
            id="leave-end"
            type="date"
            min={startDate || undefined}
            error={errors.endDate?.message}
            hasHint={totalDays > 0}
            disabled={saving}
            {...register("endDate")}
          />
        </FormField>
      </div>

      <FormField
        label="Reason"
        htmlFor="leave-reason"
        error={errors.reason?.message}
        hint={`${reason?.length ?? 0}/${REASON_MAX} characters`}
        required
      >
        <Textarea
          id="leave-reason"
          rows={3}
          maxLength={REASON_MAX}
          placeholder="e.g. Family function out of town"
          error={errors.reason?.message}
          hasHint
          disabled={saving}
          {...register("reason")}
        />
      </FormField>

      <FormField
        label="Supporting document"
        htmlFor="leave-document"
        error={errors.document?.message}
        hint="Optional — medical certificate, approval mail, etc."
      >
        <Controller
          name="document"
          control={control}
          render={({ field }) => (
            <FileInput
              id="leave-document"
              {...field}
              accept={FILE_TYPES.leaveDocument.accept}
              description={FILE_TYPES.leaveDocument.description}
              existingFile={leave?.document}
              error={errors.document?.message}
              hasHint
              disabled={saving}
            />
          )}
        />
      </FormField>
    </form>
  );
}

/**
 * Create / edit a leave request (multipart: fields + optional supporting document).
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {object|null} [leave] the leave being edited; omit (or null) to create
 */
export default function LeaveFormModal({ open, onClose, leave }) {
  const formId = useId();
  const isEdit = Boolean(leave);
  const [createLeave, createState] = useCreateLeaveMutation();
  const [updateLeave, updateState] = useUpdateLeaveMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const save = (payload) =>
    isEdit
      ? updateLeave({
          id: leave._id,
          values: payload,
          previousEmployeeId: leave.employee?._id,
        }).unwrap()
      : createLeave(payload).unwrap();

  const handleSaved = (payload) => {
    if (isEdit) toast.success("Leave updated");
    else {
      toast.success(
        payload.status === "Approved"
          ? "Leave created and added to the calendar"
          : "Leave request created",
      );
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      dismissible={!saving}
      title={isEdit ? "Edit leave" : "Add leave"}
      description={
        isEdit
          ? "Update the leave details. Use the status column in the list to approve or reject."
          : "Create a leave request for an employee."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            icon={isEdit ? Save : CalendarPlus}
            loading={saving}
          >
            {isEdit ? "Save changes" : "Create leave"}
          </Button>
        </>
      }
    >
      <LeaveForm
        formId={formId}
        leave={leave}
        saving={saving}
        onSave={save}
        onSaved={handleSaved}
      />
    </Modal>
  );
}
