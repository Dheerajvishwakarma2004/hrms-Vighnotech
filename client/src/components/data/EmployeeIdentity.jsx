import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/constants';
import Avatar from '@/components/ui/Avatar';

const NAME_CLASS = 'block truncate text-sm font-medium text-slate-900';

/**
 * Avatar + name + secondary line, used wherever an employee is listed (tables, dialogs, calendar lists).
 * Falls back to "Unknown employee" when the record no longer exists.
 *
 * @param {{ _id: string, fullName: string, email?: string }|null} employee
 * @param {string} [subtitle] secondary line (defaults to the email)
 * @param {boolean} [linked] makes the name open the employee's details page
 * @param {object} [linkState] router state passed to the details page (e.g. `{ backTo }`)
 * @param {'xs'|'sm'|'md'|'lg'} [size] avatar size
 */
export default function EmployeeIdentity({ employee, subtitle, linked = false, linkState, size = 'sm', className }) {
  const name = employee?.fullName ?? 'Unknown employee';
  const secondary = subtitle ?? employee?.email;

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        {linked && employee?._id ? (
          <Link
            to={ROUTES.employeeDetails(employee._id)}
            state={linkState}
            onClick={(event) => event.stopPropagation()}
            title={name}
            className={cn(
              NAME_CLASS,
              'rounded hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            )}
          >
            {name}
          </Link>
        ) : (
          <span className={NAME_CLASS} title={name}>
            {name}
          </span>
        )}
        {secondary && (
          <span className="block truncate text-xs text-slate-500" title={secondary}>
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}
