import { useId, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FILE_TYPES } from '@/lib/constants';
import { applyServerErrors, getErrorMessage } from '@/lib/errors';
import { useMetaOptions } from '@/features/meta/metaApi';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import FileInput from '@/components/ui/FileInput';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useCreateCandidateMutation, useUpdateCandidateMutation } from '../candidatesApi';
import { EXPERIENCE_RANGE } from '../constants';
import { CANDIDATE_FORM_FIELDS, getCandidateDefaults, getCandidateSchema } from '../schemas';

/** A titled group of related fields. */
function Section({ title, description, children }) {
  return (
    <fieldset className="min-w-0 space-y-4 border-0 p-0">
      <legend className="mb-3 p-0">
        <span className="block font-display text-sm font-semibold text-slate-900">{title}</span>
        {description && <span className="mt-0.5 block text-xs font-normal text-slate-500">{description}</span>}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const POSITION_LIST_ID = 'candidate-position-suggestions';

/**
 * Form body (fields + resume PDF). Mounted only while the modal is open, so every open starts fresh.
 * `onSave(values)` must return a promise that rejects with the RTK Query error.
 */
function CandidateForm({ formId, candidate, saving, onSave, onSaved }) {
  const isEdit = Boolean(candidate);
  const { options } = useMetaOptions();
  const schema = useMemo(() => getCandidateSchema({ isEdit }), [isEdit]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getCandidateDefaults(candidate),
    mode: 'onTouched',
  });

  const onSubmit = async ({ resume, declaration: _declaration, ...fields }) => {
    try {
      await onSave({
        ...fields,
        resume: resume instanceof File ? resume : undefined,
      });
      onSaved(fields.fullName);
    } catch (error) {
      if (
        !applyServerErrors(error, setError, {
          fields: CANDIDATE_FORM_FIELDS,
          fileField: 'resume',
        })
      ) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const fieldError = (name) => errors[name]?.message;

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-7">
      <Section title="Contact details" description="How you can reach this person.">
        <FormField label="Full name" htmlFor="candidate-fullName" error={fieldError('fullName')} required>
          <Input
            id="candidate-fullName"
            autoComplete="off"
            placeholder="Jane Doe"
            error={fieldError('fullName')}
            {...register('fullName')}
          />
        </FormField>

        <FormField label="Email" htmlFor="candidate-email" error={fieldError('email')} required>
          <Input
            id="candidate-email"
            type="email"
            autoComplete="off"
            placeholder="jane@example.com"
            error={fieldError('email')}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Phone"
          htmlFor="candidate-phone"
          error={fieldError('phone')}
          hint="10 to 15 digits. You can start with + for a country code."
          required
        >
          <Input
            id="candidate-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+919876543210"
            error={fieldError('phone')}
            hasHint
            {...register('phone')}
          />
        </FormField>
      </Section>

      <Section title="The role" description="What they are applying for.">
        <FormField label="Position" htmlFor="candidate-position" error={fieldError('position')} required>
          <Input
            id="candidate-position"
            list={POSITION_LIST_ID}
            autoComplete="off"
            placeholder="Frontend Developer"
            error={fieldError('position')}
            {...register('position')}
          />
          <datalist id={POSITION_LIST_ID}>
            {options.positions.map((position) => (
              <option key={position} value={position} />
            ))}
          </datalist>
        </FormField>

        <FormField label="Department" htmlFor="candidate-department" error={fieldError('department')} required>
          {/* Controlled so the saved department shows once the meta options arrive. */}
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="candidate-department"
                placeholder="Select department"
                placeholderDisabled
                options={options.departments}
                error={fieldError('department')}
              />
            )}
          />
        </FormField>

        <FormField label="Experience (years)" htmlFor="candidate-experience" error={fieldError('experience')} required>
          <Input
            id="candidate-experience"
            type="number"
            inputMode="decimal"
            min={EXPERIENCE_RANGE.min}
            max={EXPERIENCE_RANGE.max}
            step="0.5"
            placeholder="0"
            error={fieldError('experience')}
            {...register('experience')}
          />
        </FormField>
      </Section>

      <Section title="Notes and resume" description="Add a short note and attach their resume.">
        <FormField
          label="Notes"
          htmlFor="candidate-notes"
          error={fieldError('notes')}
          hint="Optional. Anything worth remembering, like interview feedback or when they can start."
          className="sm:col-span-2"
        >
          <Textarea id="candidate-notes" rows={3} error={fieldError('notes')} hasHint {...register('notes')} />
        </FormField>

        <FormField
          label={isEdit ? 'Replace resume' : 'Resume'}
          htmlFor="candidate-resume"
          error={fieldError('resume')}
          hint={
            isEdit && candidate.resume
              ? `Optional. Upload a new PDF only if you want to replace the current resume (${candidate.resume.filename}).`
              : 'Please upload the resume as a PDF file. Word documents and photos are not accepted.'
          }
          required={!isEdit}
          className="sm:col-span-2"
        >
          <Controller
            name="resume"
            control={control}
            render={({ field }) => (
              <FileInput
                {...field}
                id="candidate-resume"
                accept={FILE_TYPES.resume.accept}
                description={FILE_TYPES.resume.description}
                existingFile={isEdit ? candidate.resume : undefined}
                error={fieldError('resume')}
                hasHint
                disabled={saving}
              />
            )}
          />
        </FormField>

        {!isEdit && (
          <FormField error={fieldError('declaration')} htmlFor="candidate-declaration" className="sm:col-span-2">
            <Checkbox
              id="candidate-declaration"
              label="I confirm these details are accurate"
              description="The candidate has agreed to share their resume and contact details with us for hiring."
              aria-invalid={fieldError('declaration') ? true : undefined}
              aria-describedby={fieldError('declaration') ? 'candidate-declaration-error' : undefined}
              {...register('declaration')}
            />
          </FormField>
        )}
      </Section>
    </form>
  );
}

/**
 * Create / edit candidate dialog (multipart: fields + resume PDF).
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {object|null} [candidate] candidate to edit; omit (or null) to create
 */
export default function CandidateFormModal({ open, onClose, candidate }) {
  const formId = useId();
  const isEdit = Boolean(candidate);
  const [createCandidate, createState] = useCreateCandidateMutation();
  const [updateCandidate, updateState] = useUpdateCandidateMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const save = (values) =>
    isEdit ? updateCandidate({ id: candidate._id, values }).unwrap() : createCandidate(values).unwrap();

  const handleSaved = (fullName) => {
    toast.success(isEdit ? `${fullName}'s profile updated` : `${fullName} added to candidates`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      dismissible={!saving}
      title={isEdit ? 'Edit candidate' : 'Add candidate'}
      description={
        isEdit ? `Update ${candidate.fullName}'s profile.` : 'Fill in what you know. Fields marked * are needed.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={isEdit ? Save : UserPlus} loading={saving}>
            {isEdit ? 'Save changes' : 'Add candidate'}
          </Button>
        </>
      }
    >
      <CandidateForm formId={formId} candidate={candidate} saving={saving} onSave={save} onSaved={handleSaved} />
    </Modal>
  );
}
