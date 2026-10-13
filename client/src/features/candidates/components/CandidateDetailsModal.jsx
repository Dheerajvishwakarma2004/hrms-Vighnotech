import { Download, FileText, Pencil } from 'lucide-react';
import { formatDateTime } from '@/lib/date';
import { formatBytes } from '@/lib/formData';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPhone } from '@/lib/phone';
import { formatExperience } from '../constants';

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-800">{children}</dd>
    </div>
  );
}

/**
 * Read-only candidate profile.
 * @param {object} candidate
 * @param {() => void} onClose
 * @param {() => void} onEdit
 * @param {() => void} onDownloadResume
 * @param {boolean} [downloading]
 */
export default function CandidateDetailsModal({ candidate, onClose, onEdit, onDownloadResume, downloading = false }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Candidate details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="soft" icon={Pencil} onClick={onEdit}>
            Edit
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar name={candidate.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{candidate.fullName}</h3>
          <a href={`mailto:${candidate.email}`} className="block truncate text-sm text-primary-600 hover:underline">
            {candidate.email}
          </a>
        </div>
        <StatusBadge status={candidate.status} size="md" />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
        <DetailItem label="Phone">{formatPhone(candidate.phone)}</DetailItem>
        <DetailItem label="Position">{candidate.position}</DetailItem>
        <DetailItem label="Department">{candidate.department}</DetailItem>
        <DetailItem label="Experience">{formatExperience(candidate.experience)}</DetailItem>
        <DetailItem label="Added on">{formatDateTime(candidate.createdAt)}</DetailItem>
        <DetailItem label="Last updated">{formatDateTime(candidate.updatedAt)}</DetailItem>
        <div className="min-[400px]:col-span-2">
          <DetailItem label="Notes">
            {candidate.notes ? (
              <span className="whitespace-pre-line">{candidate.notes}</span>
            ) : (
              <span className="text-slate-400">No notes</span>
            )}
          </DetailItem>
        </div>
      </dl>

      {candidate.resume && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <FileText aria-hidden="true" className="h-8 w-8 shrink-0 text-primary-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800" title={candidate.resume.filename}>
              {candidate.resume.filename}
            </p>
            <p className="text-xs text-slate-500">PDF · {formatBytes(candidate.resume.size)}</p>
          </div>
          <Button variant="secondary" size="sm" icon={Download} loading={downloading} onClick={onDownloadResume}>
            Download
          </Button>
        </div>
      )}
    </Modal>
  );
}
