import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { movementTone } from "../constants";
import type { Movement } from "../schemas";
import { MovementTypeBadge } from "./movement-type-badge";

type MovementsTableProps = {
  movements?: Movement[];
  loading: boolean;
};

export function MovementsTable({ movements, loading }: MovementsTableProps) {
  return (
    <Table aria-busy={loading}>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-44 pl-4">Date</TableHead>
          <TableHead>Movement Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="pr-4">Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 4 }, (_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-3 w-10" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-3 w-40" />
              </TableCell>
            </TableRow>
          ))}
        {movements?.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="pl-4">
              <div className="flex flex-col">
                <span>{formatDate(movement.created_at)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(movement.created_at)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <MovementTypeBadge type={movement.type} />
            </TableCell>
            <TableCell
              className={cn("text-right font-semibold tabular-nums", movementTone[movement.type])}
            >
              {movement.type === "in" ? "+" : "−"}
              {formatNumber(movement.qty)}
            </TableCell>
            <TableCell className="max-w-80 truncate pr-4 text-muted-foreground">
              {movement.note ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
