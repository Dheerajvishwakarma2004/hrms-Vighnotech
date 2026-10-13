import { useCallback } from 'react';
import { ArrowLeft, FileDown, Pencil, UserX } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useDownload } from '@/hooks/useDownload';
import { ROUTES } from '@/lib/constants';
import { resumeFileName } from '@/lib/format';
import { leaveDocumentPath } from '@/features/leaves/leavesApi';
import ErrorState from '@/components/feedback/ErrorState';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useGetEmployeeSummaryQuery } from '../employeesApi';
import { employeeResumePath } from '../constants';
import AttendanceOverviewCard from '../components/AttendanceOverviewCard';
import EmployeeDetailsSkeleton from '../components/EmployeeDetailsSkeleton';
import EmployeeFormModal from '../components/EmployeeFormModal';
import EmployeeProfileCard from '../components/EmployeeProfileCard';
import LeavesOverviewCard from '../components/LeavesOverviewCard';

/** 404 (missing employee) and 400 (malformed id) both mean "this employee does not exist". */
const isNotFound = (error) => error?.status === 404 || error?.status === 400;

/** Employee profile with a 30-day attendance overview and recent leaves (GET /employees/:id/summary). */
export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Return to the list with the filters the user came from, when available.
  const backTo = location.state?.backTo ?? ROUTES.employees;
  const back = { to: backTo, label: 'All employees' };

  // `currentData` is only the data for this id, so switching employees never flashes the previous profile.
  const { currentData: summary, isFetching, error, refetch } = useGetEmployeeSummaryQuery(id);
  const editDialog = useDisclosure();
  const { download, isDownloading } = useDownload();

  const onDownloadDocument = useCallback(
    (leave) => download(leaveDocumentPath(leave._id), leave.document.filename, leave._id),
    [download],
  );
  const isDownloadingDocument = useCallback((leave) => isDownloading(leave._id), [isDownloading]);

  if (isNotFound(error)) {
    return (
      <>
        <PageHeader title="Employee not found" back={back} />
        <Card>
          <EmptyState
            icon={UserX}
            title="We couldn't find this employee"
            description="They may have been deleted, or the link is incorrect."
            action={
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(backTo)}>
                Back to employees
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  if (error && !summary) {
    return (
      <>
        <PageHeader title="Employee details" back={back} />
        <Card>
          <ErrorState title="Couldn't load this employee" error={error} onRetry={refetch} retrying={isFetching} />
        </Card>
      </>
    );
  }

  if (!summary) return <EmployeeDetailsSkeleton />;

  const { employee, attendance, leaves } = summary;
  const downloadResume = () =>
    download(employeeResumePath(employee._id), resumeFileName(employee.fullName), employee._id);
  const downloadingResume = isDownloading(employee._id);

  return (
    <>
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.position} · ${employee.department}`}
        back={back}
        actions={
          <>
            {employee.resume && (
              <Button variant="secondary" icon={FileDown} loading={downloadingResume} onClick={downloadResume}>
                Resume
              </Button>
            )}
            <Button icon={Pencil} onClick={() => editDialog.open()}>
              Edit
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <EmployeeProfileCard
          employee={employee}
          onDownloadResume={downloadResume}
          downloadingResume={downloadingResume}
        />
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <AttendanceOverviewCard attendance={attendance} />
          <LeavesOverviewCard
            leaves={leaves}
            onDownloadDocument={onDownloadDocument}
            isDownloadingDocument={isDownloadingDocument}
          />
        </div>
      </div>

      <EmployeeFormModal open={editDialog.isOpen} onClose={editDialog.close} employee={employee} />
    </>
  );
}
