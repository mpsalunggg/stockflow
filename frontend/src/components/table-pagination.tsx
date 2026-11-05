import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const limitOptions = [5, 10, 25];
const maxPageButtons = 5;

type TablePaginationProps = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function TablePagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const first = Math.max(
    1,
    Math.min(page - Math.floor(maxPageButtons / 2), pageCount - maxPageButtons + 1),
  );
  const pages = Array.from(
    { length: Math.min(maxPageButtons, pageCount) },
    (_, i) => first + i,
  );
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span id="rows-per-page">Rows per page</span>
        <Select
          value={limit}
          onValueChange={(value) => value && onLimitChange(value)}
        >
          <SelectTrigger size="sm" aria-labelledby="rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="border-l pl-3 tabular-nums">
          {total === 0 ? "0 results" : `${start}–${end} of ${total}`}
        </span>
      </div>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {pages.map((n) => (
          <Button
            key={n}
            variant={n === page ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPageChange(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
