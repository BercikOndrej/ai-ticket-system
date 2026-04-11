import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import TicketsTable, { type Ticket } from "@/components/TicketsTable";

export default function TicketsPage() {
  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => apiClient.get<Ticket[]>("/api/tickets").then((res) => res.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <p className="text-muted-foreground mt-1">All support tickets submitted by customers.</p>

      <div className="mt-6">
        <TicketsTable tickets={tickets} isPending={isPending} isError={isError} />
      </div>
    </div>
  );
}
