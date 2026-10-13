import toast from 'react-hot-toast';
import { useMetaOptions } from '@/features/meta/metaApi';
import { getErrorMessage } from '@/lib/errors';
import PillMenu from '@/components/ui/PillMenu';
import { useAssignEmployeeRoleMutation } from '../employeesApi';

/** Inline role pill with a small menu for table rows. Cached lists update optimistically (see employeesApi). */
export default function RoleSelect({ employee }) {
  const { options } = useMetaOptions();
  const [assignRole, { isLoading }] = useAssignEmployeeRoleMutation();

  const onChange = async (role) => {
    try {
      await assignRole({ id: employee._id, role }).unwrap();
      toast.success(`${employee.fullName} is now ${role}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the role'));
    }
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <PillMenu
        value={employee.role}
        options={options.roles}
        onChange={onChange}
        loading={isLoading}
        colored={false}
        menuTitle="Assign role"
        label={`Role of ${employee.fullName}`}
      />
    </div>
  );
}
