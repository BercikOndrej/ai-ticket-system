import { TicketStatus, TicketClassification } from "core/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export type Ticket = {
  id: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: string;
  classification: string | null;
  createdAt: string;
};

interface TicketsTableProps {
  tickets: Ticket[];
  isPending: boolean;
  isError: boolean;
}

const classificationLabels: Record<string, string> = {
  [TicketClassification.GeneralQuestion]: "General question",
  [TicketClassification.TechnicalQuestion]: "Technical question",
  [TicketClassification.Request]: "Request",
  [TicketClassification.Refund]: "Refund",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  [TicketStatus.Open]: "default",
  [TicketStatus.Resolved]: "secondary",
  [TicketStatus.Closed]: "outline",
};

export default function TicketsTable({ tickets, isPending, isError }: TicketsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="w-16">#</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Classification</TableHead>
          <TableHead>Received</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        {isError && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-destructive">
              Failed to load tickets.
            </TableCell>
          </TableRow>
        )}
        {!isPending && !isError && tickets.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No tickets found.
            </TableCell>
          </TableRow>
        )}
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="text-muted-foreground">{ticket.id}</TableCell>
            <TableCell className="font-medium">{ticket.subject}</TableCell>
            <TableCell>
              <div>{ticket.fromName}</div>
              <div className="text-xs text-muted-foreground">{ticket.fromEmail}</div>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[ticket.status] ?? "secondary"}>{ticket.status}</Badge>
            </TableCell>
            <TableCell>
              {ticket.classification ? (
                <Badge variant="secondary">
                  {classificationLabels[ticket.classification] ?? ticket.classification}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
