import { useMemo } from 'react';
import { Eye, FileDown, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/date';
import { ROUTES } from '@/lib/constants';
import DataTable from '@/components/data/DataTable';
import EmployeeIdentity from '@/components/data/EmployeeIdentity';
import DropdownMenu from '@/components/ui/DropdownMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPhone } from '@/lib/phone';
import RoleSelect from './RoleSelect';

/** Container widths (px): the table needs `table`; lower-priority columns appear as space allows. */
const WIDTHS = { table: 920, details: 1110, phone: 1250, type: 1350 };

/**
 * Employee list with inline role assignment and a per-row actions menu.
 * Lower-priority columns appear when the table has room; in the card layout every column is shown.
 *
 * @param {{ page: number, limit: number }} pagination used for the "Sr. no" column
 * @param {{ onEdit, onAssignRole, onDelete, onDownloadResume, isDownloadingResume }} actions row action handlers
 */
export default function EmployeeTable({
  employees,
  pagination,
  loading,
  fetching,
  error,
  onRetry,
  empty,
  sort,
  onSortChange,
  actions,
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { page, limit } = pagination;
  const { onEdit, onAssignRole, onDelete, onDownloadResume, isDownloadingResume } = actions;

  const columns = useMemo(() => {
    // Lets the details page link back to this exact list view (filters, sort, page).
    const linkState = { backTo: `${pathname}${search}` };

    return [
      {
        key: 'serial',
        header: 'Sr. no',
        hideInCards: true,
        hideBelow: WIDTHS.details,
        className: 'w-14 text-slate-500 tabular-nums',
        render: (_employee, index) => (page - 1) * limit + index + 1,
      },
      {
        key: 'employee',
        header: 'Employee',
        sortable: true,
        sortKey: 'fullName',
        render: (employee) => (
          <EmployeeIdentity employee={employee} linked linkState={linkState} className="in-table:max-w-[14rem]" />
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        hideBelow: WIDTHS.phone,
        hideInCards: true,
        className: 'whitespace-nowrap',
        render: (employee) => (
          <a href={`tel:${employee.phone}`} className="hover:text-primary-600 hover:underline">
            {formatPhone(employee.phone)}
          </a>
        ),
      },
      {
        key: 'position',
        header: 'Position',
        render: (employee) => (
          <span title={employee.position} className="block in-table:max-w-[10rem] in-table:truncate">
            {employee.position}
          </span>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        className: 'whitespace-nowrap',
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (employee) => <RoleSelect employee={employee} />,
      },
      {
        key: 'employmentType',
        header: 'Type',
        mobileLabel: 'Employment type',
        hideBelow: WIDTHS.type,
        hideInCards: true,
        className: 'whitespace-nowrap',
      },
      {
        key: 'status',
        header: 'Status',
        render: (employee) => <StatusBadge status={employee.status} />,
      },
      {
        key: 'dateOfJoining',
        header: 'Joined',
        mobileLabel: 'Date of joining',
        sortable: true,
        hideBelow: WIDTHS.details,
        hideInCards: true,
        className: 'whitespace-nowrap',
        render: (employee) => formatDate(employee.dateOfJoining),
      },
      {
        key: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        className: 'w-12',
        render: (employee) => (
          <DropdownMenu
            label={`Actions for ${employee.fullName}`}
            items={[
              {
                label: 'View details',
                icon: Eye,
                onClick: () =>
                  navigate(ROUTES.employeeDetails(employee._id), {
                    state: linkState,
                  }),
              },
              { label: 'Edit', icon: Pencil, onClick: () => onEdit(employee) },
              {
                label: 'Assign role',
                icon: ShieldCheck,
                onClick: () => onAssignRole(employee),
              },
              {
                label: 'Download resume',
                icon: FileDown,
                hidden: !employee.resume,
                disabled: isDownloadingResume(employee),
                onClick: () => onDownloadResume(employee),
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onClick: () => onDelete(employee),
              },
            ]}
          />
        ),
      },
    ];
  }, [page, limit, pathname, search, navigate, onEdit, onAssignRole, onDelete, onDownloadResume, isDownloadingResume]);

  return (
    <DataTable
      caption="Employees"
      columns={columns}
      data={employees}
      tableMinWidth={WIDTHS.table}
      loading={loading}
      fetching={fetching}
      error={error}
      onRetry={onRetry}
      empty={empty}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
