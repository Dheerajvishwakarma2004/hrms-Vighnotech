import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errors';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDeleteEmployeeMutation } from '../employeesApi';

/** Confirms and performs the cascading delete of an employee (attendance, leaves and files go too). */
export default function DeleteEmployeeDialog({ open, onClose, employee }) {
  const [deleteEmployee, { isLoading }] = useDeleteEmployeeMutation();

  const onConfirm = async () => {
    try {
      await deleteEmployee(employee._id).unwrap();
      toast.success(`${employee.fullName} was deleted`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the employee'));
    }
  };

  return (
    <ConfirmDialog
      open={open && Boolean(employee)}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isLoading}
      title="Delete employee?"
      confirmLabel="Delete employee"
    >
      {employee && (
        <>
          <p>
            <span className="font-semibold text-slate-900">{employee.fullName}</span> will be removed from your team.
          </p>
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
            Everything saved about them goes too: attendance records, leave requests and uploaded documents. This
            can&apos;t be undone.
          </p>
        </>
      )}
    </ConfirmDialog>
  );
}
