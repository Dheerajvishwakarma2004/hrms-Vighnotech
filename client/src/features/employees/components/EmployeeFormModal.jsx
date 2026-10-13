import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMetaOptions } from '@/features/meta/metaApi';
import { applyServerErrors, getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useCreateEmployeeMutation, useUpdateEmployeeMutation } from '../employeesApi';
import { EMPLOYEE_FORM_FIELDS, employeeSchema, getEmployeeFormDefaults } from '../schemas';

/**
 * Form body. Mounted only while the modal is open, so every open starts from fresh defaults.
 * `onSave(values)` must return a promise that rejects with the RTK Query error.
 */
function EmployeeForm({ formId, employee, onSave, onSaved }) {
  const { options } = useMetaOptions();
  const positionListId = `${formId}-positions`;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: getEmployeeFormDefaults(employee, options),
    mode: 'onTouched',
  });

  const onSubmit = async (values) => {
    try {
      onSaved(await onSave(values));
    } catch (error) {
      if (!applyServerErrors(error, setError, { fields: EMPLOYEE_FORM_FIELDS })) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const fieldId = (name) => `${formId}-${name}`;
  const controlProps = (name) => ({
    id: fieldId(name),
    error: errors[name]?.message,
    ...register(name),
  });
  // Selects are controlled so a saved value shows up even when the meta options arrive after the form mounted.
  const selectControl = (name, choices, placeholder) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          id={fieldId(name)}
          options={choices}
          placeholder={placeholder}
          placeholderDisabled
          error={errors[name]?.message}
        />
      )}
    />
  );
  const fieldProps = (name, label, required = true) => ({
    label,
    htmlFor: fieldId(name),
    error: errors[name]?.message,
    required,
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField {...fieldProps('fullName', 'Full name')}>
        <Input autoComplete="off" placeholder="Jane Doe" {...controlProps('fullName')} />
      </FormField>

      <FormField {...fieldProps('email', 'Email')}>
        <Input type="email" autoComplete="off" placeholder="jane@company.com" {...controlProps('email')} />
      </FormField>

      <FormField {...fieldProps('phone', 'Phone')}>
        <Input type="tel" inputMode="tel" autoComplete="off" placeholder="+919876543210" {...controlProps('phone')} />
      </FormField>

      <FormField {...fieldProps('position', 'Position')} hint="Pick an existing title or type a new one.">
        <Input
          list={positionListId}
          autoComplete="off"
          placeholder="Frontend Developer"
          hasHint={!errors.position}
          {...controlProps('position')}
        />
        <datalist id={positionListId}>
          {options.positions.map((position) => (
            <option key={position} value={position} />
          ))}
        </datalist>
      </FormField>

      <FormField {...fieldProps('department', 'Department')}>
        {selectControl('department', options.departments, 'Select department')}
      </FormField>

      <FormField {...fieldProps('role', 'Role')}>{selectControl('role', options.roles, 'Select role')}</FormField>

      <FormField {...fieldProps('employmentType', 'Employment type')}>
        {selectControl('employmentType', options.employmentTypes, 'Select type')}
      </FormField>

      <FormField {...fieldProps('status', 'Status')}>
        {selectControl('status', options.employeeStatuses, 'Select status')}
      </FormField>

      <FormField {...fieldProps('experience', 'Experience (years)')}>
        <Input type="number" inputMode="decimal" min={0} max={50} step={0.5} {...controlProps('experience')} />
      </FormField>

      <FormField {...fieldProps('dateOfJoining', 'Date of joining')}>
        <Input type="date" {...controlProps('dateOfJoining')} />
      </FormField>

      <FormField {...fieldProps('notes', 'Notes', false)} className="sm:col-span-2">
        <Textarea rows={3} placeholder="Anything HR should know (optional)" {...controlProps('notes')} />
      </FormField>
    </form>
  );
}

/**
 * Add / edit employee dialog.
 * @param {object|null} [employee] the employee to edit; omit (or null) to create a new one
 */
export default function EmployeeFormModal({ open, onClose, employee }) {
  const formId = useId();
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const isEdit = Boolean(employee);
  const saving = isCreating || isUpdating;

  const save = (values) =>
    isEdit ? updateEmployee({ id: employee._id, ...values }).unwrap() : createEmployee(values).unwrap();

  const handleSaved = (saved) => {
    toast.success(isEdit ? `${saved.fullName}'s details were updated` : `${saved.fullName} was added to employees`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      dismissible={!saving}
      title={isEdit ? 'Edit employee' : 'Add employee'}
      description={isEdit ? `Update ${employee.fullName}'s profile.` : 'Fields marked * are required.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={isEdit ? Save : UserPlus} loading={saving}>
            {isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <EmployeeForm formId={formId} employee={employee} onSave={save} onSaved={handleSaved} />
    </Modal>
  );
}
