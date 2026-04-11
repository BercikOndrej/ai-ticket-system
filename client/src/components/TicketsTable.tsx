import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TicketStatus, TicketClassification, TicketSortBy, SortOrder } from "core/enums";
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
  status: TicketStatus;
  classification: TicketClassification | null;
  createdAt: string;
};

interface TicketsTableProps {
  tickets: Ticket[];
  isPending: boolean;
  isError: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

const classificationLabels: Record<TicketClassification, string> = {
  [TicketClassification.GeneralQuestion]: "General question",
  [TicketClassification.TechnicalQuestion]: "Technical question",
  [TicketClassification.Request]: "Request",
  [TicketClassification.Refund]: "Refund",
};

const statusVariant: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  [TicketStatus.Open]: "default",
  [TicketStatus.Resolved]: "secondary",
  [TicketStatus.Closed]: "outline",
};

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor((row) => row.id, {
    id: TicketSortBy.Id,
    header: "#",
    cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.subject, {
    id: TicketSortBy.Subject,
    header: "Subject",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.fromName, {
    id: TicketSortBy.FromName,
    header: "From",
    cell: (info) => (
      <div>
        <div>{info.getValue()}</div>
        <div className="text-xs text-muted-foreground">{info.row.original.fromEmail}</div>
      </div>
    ),
  }),
  columnHelper.accessor((row) => row.status, {
    id: TicketSortBy.Status,
    header: "Status",
    cell: (info) => (
      <Badge variant={statusVariant[info.getValue()] ?? "secondary"}>{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor((row) => row.classification, {
    id: TicketSortBy.Classification,
    header: "Classification",
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <Badge variant="secondary">{classificationLabels[value]}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  }),
  columnHelper.accessor((row) => row.createdAt, {
    id: TicketSortBy.CreatedAt,
    header: "Received",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

function SortIcon({ isSorted }: { isSorted: false | SortOrder }) {
  if (isSorted === SortOrder.Asc) return <ArrowUp className="ml-1 inline h-3.5 w-3.5" />;
  if (isSorted === SortOrder.Desc) return <ArrowDown className="ml-1 inline h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
}

export default function TicketsTable({
  tickets,
  isPending,
  isError,
  sorting,
  onSortingChange,
}: TicketsTableProps) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                <SortIcon isSorted={header.column.getIsSorted()} />
              </TableHead>
            ))}
          </TableRow>
        ))}
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
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
