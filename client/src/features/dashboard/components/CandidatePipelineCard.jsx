import { UserRoundSearch } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import { getStatusFillClass } from '../utils/chart';
import { withQuery } from '@/lib/query';
import BarList from './BarList';
import DashboardSection from './DashboardSection';

/** Candidates per status (order and labels come from the API), each bar opening the filtered candidate list. */
export default function CandidatePipelineCard({ candidates }) {
  const statuses = Object.entries(candidates.byStatus);
  const items = statuses.map(([status, count]) => {
    const dot = getStatusFillClass(status);
    return {
      key: status,
      label: status,
      value: count,
      to: withQuery(ROUTES.candidates, { status }),
      barClassName: dot,
      dotClassName: dot,
    };
  });

  return (
    <DashboardSection
      title="Hiring progress"
      subtitle={`${pluralize(candidates.total, 'candidate')} at ${pluralize(statuses.length, 'stage')}`}
      link={{ to: ROUTES.candidates }}
    >
      {candidates.total > 0 ? (
        <BarList label="Candidates by status" items={items} total={candidates.total} />
      ) : (
        <EmptyState
          compact
          icon={UserRoundSearch}
          title="No candidates yet"
          description="Once you add candidates, you will see how far along each one is."
        />
      )}
    </DashboardSection>
  );
}
