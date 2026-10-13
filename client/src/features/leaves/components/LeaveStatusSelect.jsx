import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import StatusSelect from "@/components/ui/StatusSelect";
import { getErrorMessage } from "@/lib/errors";
import { useUpdateLeaveStatusMutation } from "../leavesApi";

const SUCCESS_MESSAGES = {
  Approved: "Leave approved — it now appears in the leave calendar",
  Rejected: "Leave rejected",
};

/** Inline status changer for a leave row (optimistic; reverts and explains on failure, e.g. an overlap). */
export default function LeaveStatusSelect({ leave, options, className }) {
  const [updateStatus, { isLoading }] = useUpdateLeaveStatusMutation();
  const employeeName = leave.employee?.fullName ?? "employee";

  const onChange = async (status) => {
    try {
      await updateStatus({
        id: leave._id,
        status,
        employeeId: leave.employee?._id,
      }).unwrap();
      toast.success(
        SUCCESS_MESSAGES[status] ?? `Leave marked as ${status.toLowerCase()}`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update the leave status"));
    }
  };

  const pending =
    leave.status === "Pending" &&
    options.includes("Approved") &&
    options.includes("Rejected");

  return (
    <div className="space-y-2">
      <StatusSelect
        value={leave.status}
        options={options}
        onChange={onChange}
        loading={isLoading}
        label={`Leave status for ${employeeName}`}
        className={className}
      />
      {pending && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="soft"
            icon={Check}
            disabled={isLoading}
            onClick={() => onChange("Approved")}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={X}
            disabled={isLoading}
            onClick={() => onChange("Rejected")}
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
