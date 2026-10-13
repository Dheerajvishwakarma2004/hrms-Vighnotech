import { useState } from 'react';
import { useMetaOptions } from '@/features/meta/metaApi';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';

/**
 * Confirms selecting a candidate, which moves them to the employee list with their details and resume.
 * The HR can optionally pick the employee role (the server default is used otherwise).
 * Mount it only while open so the role choice starts empty each time.
 *
 * @param {object} candidate
 * @param {(role: string|undefined) => void} onConfirm
 * @param {() => void} onClose
 * @param {boolean} [loading]
 */
export default function MoveToEmployeeDialog({ candidate, onConfirm, onClose, loading = false }) {
  const { options, isLoading } = useMetaOptions();
  const [role, setRole] = useState('');

  return (
    <ConfirmDialog
      open
      variant="primary"
      title="Hire this candidate?"
      message={`Hire ${candidate.fullName}? They'll move to your Employees list with all their details.`}
      confirmLabel="Hire and move"
      loading={loading}
      onClose={onClose}
      onConfirm={() => onConfirm(role || undefined)}
    >
      <p>Their profile and resume come along, and they will no longer appear in Candidates.</p>
      <FormField
        label="Employee role"
        htmlFor="move-candidate-role"
        hint="Not sure yet? Leave it as is. You can change it any time."
      >
        <Select
          id="move-candidate-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Standard role"
          options={options.roles}
          disabled={loading || isLoading}
          hasHint
        />
      </FormField>
    </ConfirmDialog>
  );
}
