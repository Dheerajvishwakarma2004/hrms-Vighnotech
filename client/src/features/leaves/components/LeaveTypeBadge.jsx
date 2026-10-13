import Badge from "@/components/ui/Badge";
import { getHashColor } from "@/lib/colors";

/** Leave type pill. Colors are derived from the type name, so new types from the API need no code change. */
export default function LeaveTypeBadge({ type, className }) {
  if (!type) return null;
  return (
    <Badge color={getHashColor(type)} className={className}>
      {type}
    </Badge>
  );
}
