import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Success toast body shown after a candidate is moved to employees, with a shortcut to the new record.
 * (The Toaster renders outside the router, so navigation is passed in instead of using <Link>.)
 *
 * @param {string} name candidate / employee name
 * @param {() => void} onView navigates to the employee list
 */
export default function MovedToEmployeesToast({ name, onView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span>
        <span className="font-semibold">{name}</span> moved to employees
      </span>
      <Button variant="soft" size="xs" rightIcon={ArrowRight} onClick={onView}>
        View employee
      </Button>
    </div>
  );
}
