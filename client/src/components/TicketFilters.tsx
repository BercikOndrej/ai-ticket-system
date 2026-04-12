import { TicketStatus, TicketClassification } from "core/enums";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const classificationLabels: Record<TicketClassification, string> = {
  [TicketClassification.GeneralQuestion]: "General question",
  [TicketClassification.TechnicalQuestion]: "Technical question",
  [TicketClassification.Request]: "Request",
  [TicketClassification.Refund]: "Refund",
};

interface TicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TicketStatus | undefined;
  onStatusChange: (value: TicketStatus | undefined) => void;
  classification: TicketClassification | undefined;
  onClassificationChange: (value: TicketClassification | undefined) => void;
}

export default function TicketFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  classification,
  onClassificationChange,
}: TicketFiltersProps) {
  return (
    <div className="flex gap-3">
      <Input
        className="w-64"
        placeholder="Search by subject…"
        aria-label="Search by subject"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Select
        value={status ?? "all"}
        onValueChange={(value) =>
          onStatusChange(value === "all" ? undefined : (value as TicketStatus))
        }
      >
        <SelectTrigger className="w-40" aria-label="Status filter">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.values(TicketStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={classification ?? "all"}
        onValueChange={(value) =>
          onClassificationChange(value === "all" ? undefined : (value as TicketClassification))
        }
      >
        <SelectTrigger className="w-52" aria-label="Classification filter">
          <SelectValue placeholder="All classifications" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All classifications</SelectItem>
          {Object.values(TicketClassification).map((c) => (
            <SelectItem key={c} value={c}>
              {classificationLabels[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
