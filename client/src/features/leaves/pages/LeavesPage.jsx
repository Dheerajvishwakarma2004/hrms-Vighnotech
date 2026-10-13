import { useCallback, useMemo } from "react";
import { CalendarX2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { getListEmptyState } from "@/components/data/listEmptyState";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { useMetaOptions } from "@/features/meta/metaApi";
import { useClampPage } from "@/hooks/useClampPage";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useDownload } from "@/hooks/useDownload";
import {
  countActiveFilters,
  getNextSort,
  useUrlFilters,
} from "@/hooks/useUrlFilters";
import { formatDateRange } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import LeaveCalendarSection from "../components/LeaveCalendarSection";
import LeaveFilters from "../components/LeaveFilters";
import LeaveFormModal from "../components/LeaveFormModal";
import LeaveTable from "../components/LeaveTable";
import { ASCENDING_FIRST_SORT_KEYS, LEAVE_FILTER_DEFAULTS } from "../constants";
import { useDeleteLeaveMutation, useGetLeavesQuery } from "../leavesApi";

/** Leave requests (filterable list) and the approved-leave calendar: side by side from 2xl, stacked below. */
export default function LeavesPage() {
  const [filters, , resetFilters, setFilters] = useUrlFilters(
    LEAVE_FILTER_DEFAULTS,
  );
  const activeFilterCount = countActiveFilters(filters, LEAVE_FILTER_DEFAULTS);
  const { options } = useMetaOptions();

  const { data, currentData, isLoading, isFetching, error, refetch } =
    useGetLeavesQuery(filters);
  const leaves = data?.items ?? [];
  const meta = data?.meta;

  const {
    isOpen: formOpen,
    data: editingLeave,
    open: openForm,
    close: closeForm,
  } = useDisclosure();
  const deleteDialog = useDisclosure();
  const [deleteLeave, { isLoading: deleting }] = useDeleteLeaveMutation();

  const { download, isDownloading } = useDownload();
  const downloader = useMemo(
    () => ({ download, isDownloading }),
    [download, isDownloading],
  );

  useClampPage(currentData?.meta, filters.page, setFilters);

  const onSortChange = (sortBy) =>
    setFilters(getNextSort(filters, sortBy, ASCENDING_FIRST_SORT_KEYS));

  const openCreate = useCallback(() => openForm(null), [openForm]);

  const empty = getListEmptyState({
    filtered: activeFilterCount > 0,
    noun: "leave requests",
    onReset: resetFilters,
    empty: {
      icon: CalendarX2,
      title: "No leave requests yet",
      description: "Create a leave request for an employee to get started.",
      action: (
        <Button size="sm" icon={Plus} onClick={openCreate}>
          Add leave
        </Button>
      ),
    },
  });

  const confirmDelete = async () => {
    const leave = deleteDialog.data;
    try {
      await deleteLeave({
        id: leave._id,
        employeeId: leave.employee?._id,
      }).unwrap();
      toast.success("Leave deleted");
      deleteDialog.close();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Could not delete the leave"));
    }
  };

  const leaveToDelete = deleteDialog.data;

  return (
    <>
      <PageHeader
        title="Leaves"
        subtitle="Create leave requests, approve or reject them, and see who is on approved leave."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add Leave
          </Button>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section
          aria-labelledby="leave-requests-heading"
          className="min-w-0 space-y-4"
        >
          <h3 id="leave-requests-heading" className="sr-only">
            Leave requests
          </h3>
          <LeaveFilters
            filters={filters}
            options={options}
            onChange={setFilters}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
          <LeaveTable
            leaves={leaves}
            loading={isLoading}
            fetching={isFetching}
            error={error}
            onRetry={refetch}
            sort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
            onSortChange={onSortChange}
            statusOptions={options.leaveStatuses}
            downloader={downloader}
            onEdit={openForm}
            onDelete={deleteDialog.open}
            empty={empty}
          />
          {meta && !error && (
            <Pagination
              {...meta}
              disabled={isFetching}
              onPageChange={(page) => setFilters({ page })}
              onLimitChange={(limit) => setFilters({ limit })}
            />
          )}
        </section>

        <aside aria-label="Approved leave calendar" className="min-w-0">
          <LeaveCalendarSection downloader={downloader} />
        </aside>
      </div>

      <LeaveFormModal
        open={formOpen}
        onClose={closeForm}
        leave={editingLeave}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete leave?"
        confirmLabel="Delete leave"
        message={
          leaveToDelete
            ? `This permanently deletes the ${leaveToDelete.leaveType.toLowerCase()} leave of ${
                leaveToDelete.employee?.fullName ?? "this employee"
              } (${formatDateRange(leaveToDelete.startDate, leaveToDelete.endDate)})${
                leaveToDelete.document ? " and its attached document" : ""
              }.`
            : undefined
        }
      />
    </>
  );
}
