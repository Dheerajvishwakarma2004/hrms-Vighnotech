import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { applyServerErrors, getErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/lib/constants';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import { useLoginMutation } from '../authApi';
import { clearLogoutReason, selectLogoutReason } from '../authSlice';
import AuthHeader from '../components/AuthHeader';
import { DEMO_CREDENTIALS, loginDefaults, loginSchema } from '../schemas';

/** Sign-in form. On success the session is stored and PublicOnlyRoute redirects to `location.state.from`. */
export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const logoutReason = useSelector(selectLogoutReason);
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: loginDefaults, mode: 'onTouched' });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const { user } = await login(values).unwrap();
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
    } catch (error) {
      if (!applyServerErrors(error, setError, { fields: ['email', 'password'] })) {
        setFormError(getErrorMessage(error));
      }
    }
  };

  const fillDemoAccount = () => {
    setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true });
  };

  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Sign in to keep track of your people, leaves and hiring." />

      <div className="space-y-4">
        {logoutReason === 'expired' && (
          <Alert variant="warning" title="Session expired" onDismiss={() => dispatch(clearLogoutReason())}>
            For your security, sessions last 2 hours. Please sign in again.
          </Alert>
        )}
        {formError && (
          <Alert variant="error" title="We couldn't sign you in" onDismiss={() => setFormError(null)}>
            {formError}
          </Alert>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
        <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
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
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
        </FormField>

        <Button type="submit" size="lg" fullWidth icon={LogIn} loading={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium text-slate-900">Just looking around?</p>
            <p className="text-slate-600">Try it with a sample HR account.</p>
          </div>
          <Button variant="soft" size="sm" icon={Sparkles} onClick={fillDemoAccount}>
            Use demo account
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.register}
          state={location.state}
          className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
