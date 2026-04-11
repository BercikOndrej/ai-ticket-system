import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { SortOrder, TicketSortBy } from "core/enums";
import apiClient from "@/lib/api-client";
import TicketsTable, { type Ticket } from "@/components/TicketsTable";

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: TicketSortBy.CreatedAt, desc: true }]);

  const sortBy: TicketSortBy = (sorting[0]?.id as TicketSortBy) ?? TicketSortBy.CreatedAt;
  const sortOrder: SortOrder = sorting[0]?.desc === false ? SortOrder.Asc : SortOrder.Desc;

  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ["tickets", { sortBy, sortOrder }],
    queryFn: () =>
      apiClient
        .get<Ticket[]>("/api/tickets", { params: { sortBy, sortOrder } })
        .then((res) => res.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <p className="text-muted-foreground mt-1">All support tickets submitted by customers.</p>

      <div className="mt-6">
        <TicketsTable
          tickets={tickets}
          isPending={isPending}
          isError={isError}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>
    </div>
  );
}
