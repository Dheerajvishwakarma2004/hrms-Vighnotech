import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/** "View all →" link used in section headers. */
function ViewAllLink({ to, label = 'View all' }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      {label}
      <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * Dashboard card: title row with an optional "View all" link, a body and an optional footer.
 * @param {{ to: string, label?: string }} [link] header link to the full page
 * @param {boolean} [flush] removes body padding (for edge-to-edge lists)
 */
export default function DashboardSection({ title, subtitle, link, flush = false, footer, className, children }) {
  return (
    <Card as="section" className={cn('flex min-w-0 flex-col', className)}>
      <CardHeader title={title} subtitle={subtitle} actions={link && <ViewAllLink {...link} />} />
      {flush ? <div className="flex-1">{children}</div> : <CardBody className="flex-1">{children}</CardBody>}
      {footer && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5 sm:text-sm">{footer}</div>
      )}
    </Card>
  );
}
