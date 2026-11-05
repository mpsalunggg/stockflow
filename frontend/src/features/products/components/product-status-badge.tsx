import { Badge } from "@/components/ui/badge";

export function ProductStatusBadge({ active }: { active: boolean }) {
  if (!active) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  return (
    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      Active
    </Badge>
  );
}
