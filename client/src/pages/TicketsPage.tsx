import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type PaginationState } from "@tanstack/react-table";
import { TicketSortBy, SortOrder, type TicketSortingState } from "core/enums";
import apiClient from "@/lib/api-client";
import TicketsTable, { type Ticket } from "@/components/TicketsTable";
import TicketFilters, { type TicketFiltersState } from "@/components/TicketFilters";

export default function TicketsPage() {
  const [sorting, setSorting] = useState<TicketSortingState>({
    sortBy: TicketSortBy.CreatedAt,
    sortOrder: SortOrder.Desc,
  });
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<TicketFiltersState>({});

  function handleSortingChange(newSorting: TicketSortingState) {
    setSorting(newSorting);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  function handleFiltersChange(patch: Partial<TicketFiltersState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const { data, isPending, isError } = useQuery({
    queryKey: ["tickets", { sorting, filters, pagination }],
    queryFn: () =>
      apiClient
        .get<{ data: Ticket[]; total: number }>("/api/tickets", {
          params: {
            ...sorting,
            ...filters,
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
          },
        })
        .then((res) => res.data),
  });

  const tickets = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <p className="text-muted-foreground mt-1">All support tickets submitted by customers.</p>

      <div className="mt-4">
        <TicketFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-4">
        <TicketsTable
          tickets={tickets}
          isPending={isPending}
          isError={isError}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
          total={total}
        />
      </div>
    </div>
  );
}
