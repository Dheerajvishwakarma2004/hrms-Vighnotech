import { useCallback } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getListEmptyState } from "@/components/data/listEmptyState";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/layout/PageHeader";
import { useMetaOptions } from "@/features/meta/metaApi";
import { useClampPage } from "@/hooks/useClampPage";
import { useDisclosure } from "@/hooks/useDisclosure";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import {
  useDeleteAttendanceMutation,
  useGetAttendanceQuery,
} from "../attendanceApi";
import AttendanceDateNav from "../components/AttendanceDateNav";
import AttendanceFilters from "../components/AttendanceFilters";
import AttendanceHistoryModal from "../components/AttendanceHistoryModal";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceTable from "../components/AttendanceTable";
import AttendanceTaskModal from "../components/AttendanceTaskModal";
import { useAttendanceFilters } from "../hooks/useAttendanceFilters";

/** Daily attendance roster: date navigation, status summary, URL-driven filters, inline status and task updates. */
export default function AttendancePage() {
  const {
    filters,
    date,
    queryArgs,
    activeCount,
    setFilters,
    setDate,
    toggleStatus,
    setSort,
    resetFilters,
  } = useAttendanceFilters();
  const { options } = useMetaOptions();
  const statuses = options.attendanceStatuses;

  const { data, currentData, error, isLoading, isFetching, refetch } =
    useGetAttendanceQuery(queryArgs);
  const [deleteAttendance, { isLoading: isClearing }] =
    useDeleteAttendanceMutation();

  const taskModal = useDisclosure();
  const historyModal = useDisclosure();
  const clearDialog = useDisclosure();

  const rows = data?.items ?? [];
  const meta = data?.meta;

  // A status change can move the last rows of a status-filtered page out of the result set.
  useClampPage(currentData?.meta, filters.page, setFilters);

  const handleClear = async () => {
    const { employee, attendance } = clearDialog.data;
    try {
      await deleteAttendance({
        id: attendance._id,
        employeeId: employee._id,
        date,
      }).unwrap();
      toast.success(`Attendance cleared for ${employee.fullName}`);
      clearDialog.close();
    } catch (clearError) {
      toast.error(
        getErrorMessage(clearError, "Could not clear the attendance record"),
      );
    }
  };

  const setPage = useCallback((page) => setFilters({ page }), [setFilters]);
  const setLimit = useCallback((limit) => setFilters({ limit }), [setFilters]);

  const empty = getListEmptyState({
    filtered: activeCount > 0,
    noun: "employees",
    onReset: resetFilters,
    empty: {
      icon: Users,
      title: "No active employees",
      description:
        "Attendance is tracked for active employees. Add employees to start marking attendance.",
      action: (
        <Link
          to={ROUTES.employees}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          Go to employees
        </Link>
      ),
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance, assign tasks and track status for every active employee."
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={isFetching && !isLoading}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      <AttendanceDateNav date={date} onChange={setDate} />

      <AttendanceSummary
        summary={meta?.summary}
        statuses={statuses}
        activeStatus={filters.status}
        onSelect={toggleStatus}
        loading={isLoading}
        fetching={isFetching}
      />

      <AttendanceFilters
        filters={filters}
        options={options}
        activeCount={activeCount}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <AttendanceTable
        rows={rows}
        meta={meta}
        date={date}
        statuses={statuses}
        loading={isLoading}
        fetching={isFetching}
        error={error}
        onRetry={refetch}
        sort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
        onSortChange={setSort}
        empty={empty}
        onEditTask={taskModal.open}
        onViewHistory={historyModal.open}
        onClear={clearDialog.open}
      />

      {!error && meta && (
        <Pagination
          {...meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
          disabled={isFetching}
        />
      )}

      <AttendanceTaskModal
        open={taskModal.isOpen}
        onClose={taskModal.close}
        row={taskModal.data}
        date={date}
        statuses={statuses}
      />

      <AttendanceHistoryModal
        open={historyModal.isOpen}
        onClose={historyModal.close}
        employee={historyModal.data}
        statuses={statuses}
      />

      <ConfirmDialog
        open={clearDialog.isOpen}
        onClose={clearDialog.close}
        onConfirm={handleClear}
        loading={isClearing}
        title="Clear attendance record?"
        confirmLabel="Clear record"
        message={
          clearDialog.data &&
          `${clearDialog.data.employee.fullName}'s status and task for ${formatDate(date)} will be removed and they will show as Not Marked.`
        }
      />
    </div>
  );
}
