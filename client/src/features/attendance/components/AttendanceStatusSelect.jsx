import toast from "react-hot-toast";
import StatusSelect from "@/components/ui/StatusSelect";
import { NOT_MARKED } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { useUpsertAttendanceMutation } from "../attendanceApi";

/**
 * Inline status picker for one roster row. Saves immediately (PUT upsert, keeping the current task);
 * each row owns its mutation so the pending indicator is per row.
 *
 * @param {{ employee: object, attendance: object|null }} row
 * @param {string} date `YYYY-MM-DD`
 * @param {string[]} statuses attendance statuses from the meta options
 */
export default function AttendanceStatusSelect({
  row,
  date,
  statuses,
  className,
}) {
  const { employee, attendance } = row;
  const [upsertAttendance, { isLoading }] = useUpsertAttendanceMutation();
  const current = attendance?.status ?? "";
  const toastId = `attendance-status-${employee._id}`;

  const handleChange = async (status) => {
    try {
      await upsertAttendance({
        employeeId: employee._id,
        date,
        status,
        task: attendance?.task ?? "",
      }).unwrap();
      toast.success(`${employee.fullName} marked as ${status}`, {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          `Could not update ${employee.fullName}'s attendance`,
        ),
        { id: toastId },
      );
    }
  };

  return (
    <StatusSelect
      value={current}
      options={statuses}
      onChange={handleChange}
      loading={isLoading}
      disabled={statuses.length === 0}
      dotStatus={current || NOT_MARKED}
      placeholder="Not marked"
      label={`Attendance status for ${employee.fullName}`}
      className={className}
    />
  );
}
