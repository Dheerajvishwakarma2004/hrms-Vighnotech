import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PASSWORD_RULES } from '@/lib/validation';

const LEVELS = [
  { label: 'Too easy to guess', bar: 'bg-rose-400', text: 'text-rose-700' },
  { label: 'Weak', bar: 'bg-amber-400', text: 'text-amber-800' },
  { label: 'Getting there', bar: 'bg-amber-400', text: 'text-amber-800' },
  { label: 'Good', bar: 'bg-primary-400', text: 'text-primary-700' },
  { label: 'Strong', bar: 'bg-primary-600', text: 'text-primary-700' },
];

/** Live password strength meter + checklist mirroring the server's password rules. */
export default function PasswordStrength({ password = '', id }) {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const passedCount = results.filter((rule) => rule.passed).length;
  const level = LEVELS[Math.max(0, passedCount - 1)];

  if (!password) return null;

  return (
    <div id={id} className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {PASSWORD_RULES.map((rule, index) => (
            <span
              key={rule.id}
              className={cn('h-1.5 flex-1 rounded-full', index < passedCount ? level.bar : 'bg-slate-200')}
            />
          ))}
        </div>
        <span className={cn('text-xs font-medium', level.text)}>{level.label}</span>
      </div>
      <ul className="grid grid-cols-1 gap-1 min-[400px]:grid-cols-2">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={cn('flex items-center gap-1.5 text-xs', rule.passed ? 'text-primary-700' : 'text-slate-500')}
          >
            {rule.passed ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {rule.label}
            <span className="sr-only">{rule.passed ? '(met)' : '(not met)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
