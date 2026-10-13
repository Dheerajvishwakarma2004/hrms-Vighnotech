import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';

/** Input with a show/hide password toggle. Accepts every Input prop. */
const PasswordInput = forwardRef(function PasswordInput({ showIcon = true, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      leftIcon={showIcon ? Lock : undefined}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <ToggleIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      }
      {...props}
    />
  );
});

export default PasswordInput;
