import { useSelector } from 'react-redux';
import PageHeader from '@/components/layout/PageHeader';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { pluralize } from '@/lib/format';
import { getFirstName, getGreeting } from '../utils/greeting';

/** One plain-language line on what needs attention; falls back while stats are still loading. */
function attentionLine(pendingLeaves) {
  if (pendingLeaves === undefined) return 'Here is a quick look at how your team is doing today.';
  if (pendingLeaves === 0) return 'Nothing needs your attention right now. Enjoy the calm.';
  return `${pluralize(pendingLeaves, 'leave request')} ${pendingLeaves === 1 ? 'is' : 'are'} waiting for your review.`;
}

/** Personalised page header: time-of-day greeting with the HR's first name and what needs attention. */
export default function DashboardGreeting({ pendingLeaves, actions }) {
  const user = useSelector(selectCurrentUser);
  const firstName = getFirstName(user?.fullName);

  return (
    <PageHeader
      title={firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
      subtitle={attentionLine(pendingLeaves)}
      actions={actions}
    />
  );
}
