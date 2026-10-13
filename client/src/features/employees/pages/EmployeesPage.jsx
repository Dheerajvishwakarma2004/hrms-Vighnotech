import { useCallback } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useClampPage } from '@/hooks/useClampPage';
import { countActiveFilters, getNextSort, useUrlFilters } from '@/hooks/useUrlFilters';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useDownload } from '@/hooks/useDownload';
import { resumeFileName } from '@/lib/format';
import { useMetaOptions } from '@/features/meta/metaApi';
import { getListEmptyState } from '@/components/data/listEmptyState';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useGetEmployeesQuery } from '../employeesApi';
import { ASCENDING_FIRST_SORT_KEYS, EMPLOYEE_FILTER_DEFAULTS, employeeResumePath } from '../constants';
import AssignRoleModal from '../components/AssignRoleModal';
import DeleteEmployeeDialog from '../components/DeleteEmployeeDialog';
import EmployeeFilters from '../components/EmployeeFilters';
import EmployeeFormModal from '../components/EmployeeFormModal';
import EmployeeTable from '../components/EmployeeTable';

function getSubtitle(total, filtered) {
  if (total === undefined) return 'Manage employee details and roles.';
  const noun = total === 1 ? 'employee' : 'employees';
  if (filtered) return `${total} ${noun} ${total === 1 ? 'matches' : 'match'} your filters`;
  return `${total} ${noun} in total`;
}

/** Employee directory: URL-driven search/filters/sort/pagination, CRUD and role assignment. */
export default function EmployeesPage() {
  const [filters, , resetFilters, setFilters] = useUrlFilters(EMPLOYEE_FILTER_DEFAULTS);
  const activeFilterCount = countActiveFilters(filters, EMPLOYEE_FILTER_DEFAULTS);
  const { options } = useMetaOptions();

  const { data, currentData, isLoading, isFetching, error, refetch } = useGetEmployeesQuery(filters);
  const employees = data?.items ?? [];
  const meta = data?.meta;

  const formDialog = useDisclosure();
  const roleDialog = useDisclosure();
  const deleteDialog = useDisclosure();
  const { download, isDownloading } = useDownload();

  useClampPage(currentData?.meta, filters.page, setFilters);

  const onSortChange = (sortBy) => setFilters(getNextSort(filters, sortBy, ASCENDING_FIRST_SORT_KEYS));

  const onDownloadResume = useCallback(
    (employee) => download(employeeResumePath(employee._id), resumeFileName(employee.fullName), employee._id),
    [download],
  );
  const isDownloadingResume = useCallback((employee) => isDownloading(employee._id), [isDownloading]);

  const empty = getListEmptyState({
    filtered: activeFilterCount > 0,
    noun: 'employees',
    onReset: resetFilters,
    empty: {
      icon: Users,
      title: 'No employees yet — add your first employee',
      description: 'You can also hire someone from the Candidates page and they will show up here.',
      action: (
        <Button size="sm" icon={UserPlus} onClick={() => formDialog.open(null)}>
          Add your first employee
        </Button>
      ),
    },
  });

  const subtitle = getSubtitle(meta?.total, activeFilterCount > 0);

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={subtitle}
        actions={
          <Button icon={UserPlus} onClick={() => formDialog.open(null)}>
            Add Employee
          </Button>
        }
      />

      <div className="space-y-4">
        <EmployeeFilters
          filters={filters}
          options={options}
          onChange={setFilters}
          activeCount={activeFilterCount}
          onReset={resetFilters}
        />

        <EmployeeTable
          employees={employees}
          pagination={{
            page: meta?.page ?? filters.page,
            limit: meta?.limit ?? filters.limit,
          }}
          loading={isLoading}
          fetching={isFetching}
          error={error}
          onRetry={refetch}
          empty={empty}
          sort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          onSortChange={onSortChange}
          actions={{
            onEdit: formDialog.open,
            onAssignRole: roleDialog.open,
            onDelete: deleteDialog.open,
            onDownloadResume,
            isDownloadingResume,
          }}
        />

        {meta && !error && (
          <Pagination
            {...meta}
            disabled={isFetching}
            onPageChange={(page) => setFilters({ page })}
            onLimitChange={(limit) => setFilters({ limit })}
          />
        )}
      </div>

      <EmployeeFormModal open={formDialog.isOpen} onClose={formDialog.close} employee={formDialog.data} />
      <AssignRoleModal open={roleDialog.isOpen} onClose={roleDialog.close} employee={roleDialog.data} />
      <DeleteEmployeeDialog open={deleteDialog.isOpen} onClose={deleteDialog.close} employee={deleteDialog.data} />
    </>
  );
}
