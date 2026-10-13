import { UserRoundSearch } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/constants';
import { formatRelative } from '@/lib/date';
import { withQuery } from '@/lib/query';
import DashboardSection from './DashboardSection';
import PersonListItem, { PersonList } from './PersonListItem';

/** Latest candidates; each row opens the candidate list searched by that candidate's email. */
export default function RecentCandidatesCard({ candidates }) {
  return (
    <DashboardSection
      title="Recent candidates"
      subtitle="The newest people added to your hiring list"
      link={{ to: ROUTES.candidates }}
      flush
    >
      {candidates.length > 0 ? (
        <PersonList label="Recent candidates">
          {candidates.map((candidate) => (
            <PersonListItem
              key={candidate._id}
              name={candidate.fullName}
              subtitle={[candidate.position, candidate.department].filter(Boolean).join(' · ')}
              to={withQuery(ROUTES.candidates, { search: candidate.email })}
              trailing={
                <>
                  <StatusBadge status={candidate.status} />
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {formatRelative(candidate.createdAt)}
                  </span>
                </>
              }
            />
          ))}
        </PersonList>
      ) : (
        <EmptyState
          compact
          icon={UserRoundSearch}
          title="No candidates yet"
          description="People you add as candidates will show up here."
        />
      )}
    </DashboardSection>
  );
}
