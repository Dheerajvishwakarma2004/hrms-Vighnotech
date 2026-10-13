import { useMemo } from 'react';
import { Download, Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/data/DataTable';
import Avatar from '@/components/ui/Avatar';
import DropdownMenu from '@/components/ui/DropdownMenu';
import Spinner from '@/components/ui/Spinner';
import { formatPhone } from '@/lib/phone';
import { formatExperience } from '../constants';
import PillMenu from '@/components/ui/PillMenu';

/** Keeps clicks on in-row controls from also triggering the row click (open details). */
const stopRowClick = (event) => event.stopPropagation();

/**
 * Container widths (px): the table needs `table`; lower-priority columns appear as space allows.
 * Experience (a filter/sort attribute) outranks the resume column, which stays reachable from the row menu.
 */
const WIDTHS = { table: 780, experience: 880, resume: 940, details: 1210 };

/**
 * Candidate list: a table when there is room, stacked cards otherwise (see DataTable).
 * The resume download is always available from the row menu.
 *
 * @param {Array} candidates current page of candidates
 * @param {{ page: number, limit: number }} pagination used for the serial number column
 * @param {string[]} statusOptions candidate statuses from the meta API
 * @param {{ onView, onEdit, onDelete, onDownloadResume, onStatusChange }} actions row callbacks
 * @param {(id: string) => boolean} isStatusUpdating
 * @param {(id: string) => boolean} isDownloading
 * Remaining props (loading, fetching, error, onRetry, empty, sort, onSortChange) are passed to DataTable.
 */
export default function CandidateTable({
  candidates,
  pagination,
  statusOptions,
  actions,
  isStatusUpdating,
  isDownloading,
  ...tableProps
}) {
  const { page, limit } = pagination;

  const columns = useMemo(
    () => [
      {
        key: 'serial',
        header: 'Sr. no',
        hideInCards: true,
        hideBelow: WIDTHS.details,
        className: 'w-14 tabular-nums text-slate-500',
        render: (_candidate, index) => (page - 1) * limit + index + 1,
      },
      {
        key: 'fullName',
        header: 'Candidate',
        sortable: true,
        render: (candidate) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={candidate.fullName} size="sm" />
            <div className="min-w-0 in-table:max-w-[14rem]">
              <p className="truncate font-medium text-slate-900">{candidate.fullName}</p>
              <p className="truncate text-xs text-slate-500">{candidate.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        hideBelow: WIDTHS.details,
        className: 'whitespace-nowrap',
        render: (candidate) => (
          <a
            href={`tel:${candidate.phone}`}
            onClick={stopRowClick}
            className="rounded hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {formatPhone(candidate.phone)}
          </a>
        ),
      },
      {
        key: 'position',
        header: 'Position',
        className: 'max-w-[11rem] truncate',
      },
      {
        key: 'department',
        header: 'Department',
        hideInCards: true,
        className: 'whitespace-nowrap',
      },
      {
        key: 'experience',
        header: 'Experience',
        mobileLabel: 'Exp.',
        sortable: true,
        hideInCards: true,
        hideBelow: WIDTHS.experience,
        className: 'whitespace-nowrap tabular-nums',
        render: (candidate) => formatExperience(candidate.experience),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (candidate) => (
          <div onClick={stopRowClick}>
            <PillMenu
              label={`Status of ${candidate.fullName}`}
              menuTitle="Change status"
              value={candidate.status}
              options={statusOptions}
              loading={isStatusUpdating(candidate._id)}
              onChange={(status) => actions.onStatusChange(candidate, status)}
            />
          </div>
        ),
      },
      {
        key: 'resume',
        header: 'Resume',
        align: 'center',
        hideBelow: WIDTHS.resume,
        headerClassName: 'text-center',
        render: (candidate) =>
          candidate.resume ? (
            <button
              type="button"
              disabled={isDownloading(candidate._id)}
              onClick={(event) => {
                event.stopPropagation();
                actions.onDownloadResume(candidate);
              }}
              title={`Download ${candidate.resume.filename}`}
              aria-label={`Download resume of ${candidate.fullName}`}
              className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 in-table:w-10 in-table:px-0 sm:h-9 sm:in-table:w-9"
            >
              {isDownloading(candidate._id) ? (
                <Spinner size="xs" label="Downloading" />
              ) : (
                <Download aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="in-table:hidden">Download</span>
            </button>
          ) : (
            <span className="text-slate-400">
              <span className="in-table:hidden">No resume uploaded</span>
              <span className="hidden in-table:inline">—</span>
            </span>
          ),
      },
      {
        key: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        className: 'w-12',
        render: (candidate) => (
          <DropdownMenu
            label={`Actions for ${candidate.fullName}`}
            items={[
              {
                label: 'View details',
                icon: Eye,
                onClick: () => actions.onView(candidate),
              },
              {
                label: 'Download resume',
                icon: Download,
                onClick: () => actions.onDownloadResume(candidate),
                hidden: !candidate.resume,
                disabled: isDownloading(candidate._id),
              },
              {
                label: 'Edit',
                icon: Pencil,
                onClick: () => actions.onEdit(candidate),
              },
              {
                label: 'Delete',
                icon: Trash2,
                onClick: () => actions.onDelete(candidate),
                danger: true,
              },
            ]}
          />
        ),
      },
    ],
    [page, limit, statusOptions, actions, isStatusUpdating, isDownloading],
  );

  return (
    <DataTable
      columns={columns}
      data={candidates}
      onRowClick={actions.onView}
      tableMinWidth={WIDTHS.table}
      caption="Candidates"
      {...tableProps}
    />
  );
}
