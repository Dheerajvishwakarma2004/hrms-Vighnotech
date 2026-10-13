import { Building2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import { withQuery } from '@/lib/query';
import BarList from './BarList';
import DashboardSection from './DashboardSection';

/** Headcount per department (largest first), each bar opening the employee list filtered by that department. */
export default function DepartmentHeadcountCard({ employees }) {
  const items = employees.byDepartment.map(({ department, count }) => ({
    key: department,
    label: department,
    value: count,
    to: withQuery(ROUTES.employees, { department }),
  }));

  return (
    <DashboardSection
      title="Employees by department"
      subtitle={`${pluralize(employees.total, 'employee')} in ${pluralize(items.length, 'department')}`}
      link={{ to: ROUTES.employees }}
    >
      {items.length > 0 ? (
        <BarList label="Employees by department" items={items} total={employees.total} />
      ) : (
        <EmptyState
          compact
          icon={Building2}
          title="No employees yet"
          description="Add your first employee to see how your teams are sized."
        />
      )}
    </DashboardSection>
  );
}
