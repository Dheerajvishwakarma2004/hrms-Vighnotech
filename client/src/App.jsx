import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { useAutoLogout } from '@/hooks/useAutoLogout';

const TOAST_OPTIONS = {
  duration: 4000,
  className: '!rounded-xl !border !border-slate-200/70 !bg-white !px-3 !py-2.5 !text-sm !font-medium !text-slate-800 !shadow-popover',
  success: { iconTheme: { primary: '#1b7f79', secondary: '#fff' } },
  error: { duration: 5000, iconTheme: { primary: '#e11d48', secondary: '#fff' } },
};

export default function App() {
  useAutoLogout();

  return (
    <>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster position="top-center" gutter={8} containerClassName="!top-[4.75rem]" toastOptions={TOAST_OPTIONS} />
    </>
  );
}
