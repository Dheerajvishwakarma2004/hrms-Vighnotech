import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User, UserPlus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { applyServerErrors, getErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/lib/constants';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import { useRegisterMutation } from '../authApi';
import AuthHeader from '../components/AuthHeader';
import PasswordStrength from '../components/PasswordStrength';
import { registerDefaults, registerSchema } from '../schemas';

const FIELDS = ['fullName', 'email', 'password', 'confirmPassword'];

/** HR registration. A successful registration signs the user in immediately. */
export default function RegisterPage() {
  const location = useLocation();
  const [registerAccount, { isLoading }] = useRegisterMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    trigger,
    getFieldState,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: registerDefaults, mode: 'onTouched' });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const { user } = await registerAccount(values).unwrap();
      toast.success(`Account created. Welcome, ${user.fullName.split(' ')[0]}!`);
    } catch (error) {
      if (!applyServerErrors(error, setError, { fields: FIELDS })) {
        setFormError(getErrorMessage(error));
      }
    }
  };

  const passwordField = register('password', {
    // Keep "Passwords do not match" in sync when the password changes after confirming it.
    onChange: () => {
      if (getFieldState('confirmPassword').isTouched) trigger('confirmPassword');
    },
  });

  return (
    <>
      <AuthHeader title="Create your account" subtitle="It takes a minute. You can add your team afterwards." />

      {formError && (
        <Alert variant="error" title="We couldn't create your account" onDismiss={() => setFormError(null)} className="mb-2">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Jane Doe"
            leftIcon={User}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </FormField>

        <FormField label="Work email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...passwordField}
          />
          <PasswordStrength password={password} />
        </FormField>

        <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </FormField>

        <Button type="submit" size="lg" fullWidth icon={UserPlus} loading={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to={ROUTES.login}
          state={location.state}
          className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
