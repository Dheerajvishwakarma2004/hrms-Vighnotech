import {
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  FileDown,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  StickyNote,
  UserRoundCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatBytes } from '@/lib/formData';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatPhone } from '@/lib/phone';
import StatusBadge from '@/components/ui/StatusBadge';

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

function formatExperience(years = 0) {
  if (!years) return 'Fresher';
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** Full employee profile: identity, badges, contact + job details, notes and resume. */
export default function EmployeeProfileCard({ employee, onDownloadResume, downloadingResume = false, className }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-col items-center gap-3 border-b border-slate-100 bg-gradient-to-b from-primary-50/70 to-white px-5 pb-5 pt-6 text-center">
        <Avatar name={employee.fullName} size="xl" />
        <div className="min-w-0 max-w-full">
          <h3 className="break-words text-lg font-semibold text-slate-900">{employee.fullName}</h3>
          <p className="text-sm text-slate-500">{employee.position}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <StatusBadge status={employee.status} />
          <Badge color="primary">{employee.role}</Badge>
          <Badge color="blue">{employee.employmentType}</Badge>
          {employee.fromCandidate && (
            <Badge color="purple" className="gap-1">
              <UserRoundCheck aria-hidden="true" className="h-3 w-3" />
              Converted from candidate
            </Badge>
          )}
        </div>
      </div>

      <dl className="divide-y divide-slate-100 px-5">
        <DetailRow icon={Mail} label="Email">
          <a href={`mailto:${employee.email}`} className="text-primary-600 hover:underline">
            {employee.email}
          </a>
        </DetailRow>
        <DetailRow icon={Phone} label="Phone">
          <a href={`tel:${employee.phone}`} className="hover:text-primary-600 hover:underline">
            {formatPhone(employee.phone)}
          </a>
        </DetailRow>
        <DetailRow icon={Building2} label="Department">
          {employee.department}
        </DetailRow>
        <DetailRow icon={ShieldCheck} label="Role">
          {employee.role}
        </DetailRow>
        <DetailRow icon={Briefcase} label="Experience">
          {formatExperience(employee.experience)}
        </DetailRow>
        <DetailRow icon={CalendarDays} label="Date of joining">
          {formatDate(employee.dateOfJoining)}
        </DetailRow>
        <DetailRow icon={Clock} label="Record created">
          {formatDateTime(employee.createdAt)}
        </DetailRow>
        {employee.notes && (
          <DetailRow icon={StickyNote} label="Notes">
            <span className="whitespace-pre-line">{employee.notes}</span>
          </DetailRow>
        )}
      </dl>

      <div className="border-t border-slate-100 p-5">
        <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">Resume</h4>
        {employee.resume ? (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <FileText aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800" title={employee.resume.filename}>
                {employee.resume.filename}
              </p>
              <p className="text-xs text-slate-500">{formatBytes(employee.resume.size)}</p>
            </div>
            <Button
              variant="soft"
              size="sm"
              icon={FileDown}
              iconOnly
              loading={downloadingResume}
              onClick={onDownloadResume}
            >
              Download resume
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No resume on file.</p>
        )}
      </div>
    </Card>
  );
}
