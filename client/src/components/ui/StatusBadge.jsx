import { getStatusColor } from '@/lib/colors';
import Badge from './Badge';

/** Colored badge for any status from the server enums (candidate, employee, attendance, leave, "Not Marked"). */
export default function StatusBadge({ status, size = 'sm', className }) {
  if (!status) return null;
  return (
    <Badge color={getStatusColor(status)} dot size={size} className={className}>
      {status}
    </Badge>
  );
}
