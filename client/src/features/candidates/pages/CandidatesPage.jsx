import { useCallback, useMemo } from 'react';
import { Plus, UserRoundSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClampPage } from '@/hooks/useClampPage';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useDownload } from '@/hooks/useDownload';
import { countActiveFilters, getNextSort, useUrlFilters } from '@/hooks/useUrlFilters';
import { getErrorMessage } from '@/lib/errors';
import { resumeFileName } from '@/lib/format';
import { useMetaOptions } from '@/features/meta/metaApi';
import { getListEmptyState } from '@/components/data/listEmptyState';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { useDeleteCandidateMutation, useGetCandidatesQuery } from '../candidatesApi';
import CandidateDetailsModal from '../components/CandidateDetailsModal';
import CandidateFilters from '../components/CandidateFilters';
import CandidateFormModal from '../components/CandidateFormModal';
import CandidateTable from '../components/CandidateTable';
import MoveToEmployeeDialog from '../components/MoveToEmployeeDialog';
import { ASCENDING_FIRST_SORT_KEYS, CANDIDATE_FILTER_DEFAULTS, candidateResumePath } from '../constants';
import { useCandidateStatusChange } from '../hooks/useCandidateStatusChange';

/** Candidate pipeline: search/filter/sort, CRUD, resume downloads and moving selected candidates to employees. */
export default function CandidatesPage() {
  const [filters, , resetFilters, setFilters] = useUrlFilters(CANDIDATE_FILTER_DEFAULTS);
  const activeFilterCount = countActiveFilters(filters, CANDIDATE_FILTER_DEFAULTS);
  const { options } = useMetaOptions();

  const { data, currentData, error, isLoading, isFetching, refetch } = useGetCandidatesQuery(filters);
  const candidates = data?.items ?? [];
  const meta = data?.meta;

  const formModal = useDisclosure();
  const detailsModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const [deleteCandidate, { isLoading: isDeleting }] = useDeleteCandidateMutation();
  const { download, isDownloading } = useDownload();
  const statusChange = useCandidateStatusChange();

  useClampPage(currentData?.meta, filters.page, setFilters);

  const downloadResume = useCallback(
    (candidate) => download(candidateResumePath(candidate._id), resumeFileName(candidate.fullName), candidate._id),
    [download],
  );

  const { open: openForm, close: closeForm } = formModal;
  const { open: openDetails, close: closeDetails } = detailsModal;
  const { open: openDelete } = deleteDialog;
  const { changeStatus } = statusChange;

  const actions = useMemo(
    () => ({
      onView: openDetails,
      onEdit: openForm,
      onDelete: openDelete,
      onDownloadResume: downloadResume,
      onStatusChange: changeStatus,
    }),
    [openDetails, openForm, openDelete, downloadResume, changeStatus],
  );

  const handleSortChange = (sortBy) => setFilters(getNextSort(filters, sortBy, ASCENDING_FIRST_SORT_KEYS));

  const confirmDelete = async () => {
    const candidate = deleteDialog.data;
    try {
      await deleteCandidate(candidate._id).unwrap();
      toast.success(`${candidate.fullName} deleted`);
      deleteDialog.close();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
      // Already removed elsewhere — nothing left to confirm (the list refreshes itself).
      if (deleteError?.status === 404) deleteDialog.close();
    }
  };

  // Show the freshest copy of the candidate being viewed (e.g. after an edit).
  const viewedCandidate = detailsModal.isOpen
    ? (candidates.find((candidate) => candidate._id === detailsModal.data?._id) ?? detailsModal.data)
    : null;

  const emptyState = getListEmptyState({
    filtered: activeFilterCount > 0,
    noun: 'candidates',
    onReset: resetFilters,
    empty: {
      icon: UserRoundSearch,
      title: 'No candidates yet — add your first candidate',
      description: 'Keep everyone you are hiring in one place, with their resume and status.',
      action: (
        <Button size="sm" icon={Plus} onClick={() => openForm()}>
          Add your first candidate
        </Button>
      ),
    },
  });

  const subtitle = meta
    ? `${meta.total} ${meta.total === 1 ? 'candidate' : 'candidates'}${activeFilterCount > 0 ? ' match your filters' : ' in your hiring list'}`
    : 'Manage candidate profiles and hiring status.';

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={subtitle}
        actions={
          <Button icon={Plus} onClick={() => openForm()}>
            Add Candidate
          </Button>
        }
      />

      <div className="space-y-4">
        <CandidateFilters
          filters={filters}
          options={options}
          onChange={setFilters}
          activeCount={activeFilterCount}
          onReset={resetFilters}
        />

        <CandidateTable
          candidates={candidates}
          pagination={{
            page: meta?.page ?? filters.page,
            limit: meta?.limit ?? filters.limit,
          }}
          statusOptions={options.candidateStatuses}
          actions={actions}
          isStatusUpdating={statusChange.isStatusUpdating}
          isDownloading={isDownloading}
          loading={isLoading}
          fetching={isFetching}
          error={error}
          onRetry={refetch}
          empty={emptyState}
          sort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          onSortChange={handleSortChange}
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

      <CandidateFormModal open={formModal.isOpen} onClose={closeForm} candidate={formModal.data} />

      {viewedCandidate && (
        <CandidateDetailsModal
          candidate={viewedCandidate}
          onClose={closeDetails}
          onEdit={() => {
            closeDetails();
            openForm(viewedCandidate);
          }}
          onDownloadResume={() => downloadResume(viewedCandidate)}
          downloading={isDownloading(viewedCandidate._id)}
        />
      )}

      {statusChange.moveTarget && (
        <MoveToEmployeeDialog
          candidate={statusChange.moveTarget}
          loading={statusChange.isMoving}
          onConfirm={statusChange.confirmMove}
          onClose={statusChange.cancelMove}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete candidate"
        confirmLabel="Delete"
        message={
          deleteDialog.data
            ? `Delete ${deleteDialog.data.fullName}? Their details and resume will be removed for good and can't be brought back.`
            : undefined
        }
      />
    </>
  );
}
