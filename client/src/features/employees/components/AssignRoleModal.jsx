import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMetaOptions } from '@/features/meta/metaApi';
import { applyServerErrors, getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import EmployeeIdentity from '@/components/data/EmployeeIdentity';
import { useAssignEmployeeRoleMutation } from '../employeesApi';
import { assignRoleSchema } from '../schemas';

function AssignRoleForm({ formId, employee, onAssign, onAssigned }) {
  const { options } = useMetaOptions();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { role: employee.role ?? '' },
  });

  const onSubmit = async ({ role }) => {
    if (role === employee.role) {
      setError('role', {
        type: 'validate',
        message: `${employee.fullName} already has this role`,
      });
      return;
    }
    try {
      onAssigned(await onAssign(role));
    } catch (error) {
      if (!applyServerErrors(error, setError, { fields: ['role'] })) toast.error(getErrorMessage(error));
    }
  };

  const roleId = `${formId}-role`;

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <EmployeeIdentity employee={employee} subtitle={`${employee.position} · ${employee.department}`} />
      </div>
      <FormField label="New role" htmlFor={roleId} error={errors.role?.message} required>
        {/* Controlled so the current role shows up even when the meta options load after the dialog opened. */}
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              id={roleId}
              options={options.roles}
              placeholder="Select role"
              placeholderDisabled
              error={errors.role?.message}
            />
          )}
        />
      </FormField>
    </form>
  );
}

/** Dialog to assign a new role to an employee. */
export default function AssignRoleModal({ open, onClose, employee }) {
  const formId = useId();
  const [assignRole, { isLoading }] = useAssignEmployeeRoleMutation();

  const onAssign = (role) => assignRole({ id: employee._id, role }).unwrap();
  const onAssigned = (updated) => {
    toast.success(`${updated.fullName} is now ${updated.role}`);
    onClose();
  };

  return (
    <Modal
      open={open && Boolean(employee)}
      onClose={onClose}
      size="sm"
      dismissible={!isLoading}
      title="Assign role"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={ShieldCheck} loading={isLoading}>
            Assign role
          </Button>
        </>
      }
    >
      {employee && <AssignRoleForm formId={formId} employee={employee} onAssign={onAssign} onAssigned={onAssigned} />}
    </Modal>
  );
}
