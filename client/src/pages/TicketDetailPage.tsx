import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TicketClassification, TicketStatus } from "core/enums";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { type TicketDetail } from "@/types/ticket";
import { type AssignableAgent } from "@/types/user";
import { classificationLabels } from "@/lib/ticket-helpers";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorAlert from "@/components/ErrorAlert";

const UNASSIGNED_VALUE = "unassigned" as const;
const UNASSIGNED_LABEL = "Unassigned" as const;
const TICKET_STATUSES = Object.values(TicketStatus) as TicketStatus[];
const TICKET_CLASSIFICATIONS = Object.values(TicketClassification) as TicketClassification[];

type TicketUpdatePatch = Pick<TicketDetail, "status" | "classification" | "assignedToAgentId">;

type TicketUpdateMutationInput = {
  patch: Partial<TicketUpdatePatch>;
  successMessage: string;
  errorMessage: string;
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: ticket,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => apiClient.get<TicketDetail>(`/api/tickets/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  const {
    data: assignableAgents = [],
    isPending: isAssignableAgentsPending,
    isError: isAssignableAgentsError,
  } = useQuery({
    queryKey: ["assignable-agents"],
    queryFn: () =>
      apiClient.get<AssignableAgent[]>("/api/users/assignable-agents").then((res) => res.data),
  });

  const ticketUpdateMutation = useMutation({
    mutationFn: ({ patch }: TicketUpdateMutationInput) =>
      apiClient
        .patch<TicketDetail>(`/api/tickets/${id}`, patch)
        .then((res) => res.data),
    onSuccess: (updatedTicket, variables) => {
      queryClient.setQueryData(["ticket", id], updatedTicket);
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(variables.successMessage);
    },
    onError: (_error, variables) => {
      toast.error(variables.errorMessage);
    },
  });

  const currentAssigneeValue = ticket?.assignedToAgent?.id ?? UNASSIGNED_VALUE;

  function getAssignedAgentName(value: string | null) {
    if (value === null || value === UNASSIGNED_VALUE) {
      return UNASSIGNED_LABEL;
    }

    return (
      assignableAgents.find((agent) => agent.id === value)?.name ??
      ticket?.assignedToAgent?.name ??
      value
    );
  }

  function handleAssignmentChange(value: string | null) {
    if (value === null) {
      return;
    }

    const nextAssignedToAgentId = value === UNASSIGNED_VALUE ? null : value;

    if (!id || !ticket || nextAssignedToAgentId === ticket.assignedToAgentId) {
      return;
    }

    ticketUpdateMutation.mutate({
      patch: { assignedToAgentId: nextAssignedToAgentId },
      successMessage: nextAssignedToAgentId === null ? "Ticket unassigned." : "Ticket assigned.",
      errorMessage: "Failed to update ticket assignment.",
    });
  }

  function handleStatusChange(value: string | null) {
    if (value === null || !id || !ticket) {
      return;
    }

    const nextStatus = value as TicketStatus;
    if (nextStatus === ticket.status) {
      return;
    }

    ticketUpdateMutation.mutate({
      patch: { status: nextStatus },
      successMessage: "Ticket status updated.",
      errorMessage: "Failed to update ticket status.",
    });
  }

  function handleClassificationChange(value: string | null) {
    if (value === null || !id || !ticket) {
      return;
    }

    const nextClassification = value as TicketClassification;
    if (nextClassification === ticket.classification) {
      return;
    }

    ticketUpdateMutation.mutate({
      patch: { classification: nextClassification },
      successMessage: "Ticket category updated.",
      errorMessage: "Failed to update ticket category.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Link to="/tickets" className={buttonVariants({ variant: "ghost" }) + " -ml-2"}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to tickets
      </Link>

      {isPending && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {isError && (
        <ErrorAlert
          title="Failed to load ticket"
          message="The ticket could not be loaded. It may not exist or an error occurred."
        />
      )}

      {ticket && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <dl className="text-sm text-muted-foreground">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <dt>From</dt>
                <dd className="text-foreground">
                  {ticket.fromName}{" "}
                  <span className="text-muted-foreground">&lt;{ticket.fromEmail}&gt;</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {ticket.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: ticket.bodyHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">{ticket.body}</pre>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside
              aria-label="Ticket controls"
              className="space-y-4 lg:sticky lg:top-6"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Ticket controls
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    className="w-full"
                    aria-label="Ticket status"
                    disabled={ticketUpdateMutation.isPending}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Category
                </p>
                <Select value={ticket.classification} onValueChange={handleClassificationChange}>
                  <SelectTrigger
                    className="w-full"
                    aria-label="Ticket category"
                    disabled={ticketUpdateMutation.isPending}
                  >
                    <SelectValue placeholder="Select a category">
                      {(value: string) =>
                        value
                          ? classificationLabels[value as TicketClassification]
                          : "Select a category"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CLASSIFICATIONS.map((classification) => (
                      <SelectItem key={classification} value={classification}>
                        {classificationLabels[classification]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Assigned to
                </p>
                <Select value={currentAssigneeValue} onValueChange={handleAssignmentChange}>
                  <SelectTrigger
                    className="w-full"
                    aria-label="Assign ticket"
                    disabled={
                      ticketUpdateMutation.isPending ||
                      isAssignableAgentsPending ||
                      isAssignableAgentsError
                    }
                  >
                    <SelectValue
                      placeholder={
                        isAssignableAgentsPending ? "Loading active agents..." : "Select an agent"
                      }
                    >
                      {(value: string) => getAssignedAgentName(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>{UNASSIGNED_LABEL}</SelectItem>
                    {assignableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.name}</span>
                          <span className="text-muted-foreground">{agent.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAssignableAgentsError && (
                  <p className="text-destructive text-xs">
                    Unable to load active agents for assignment.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Received
                </p>
                <p className="text-sm text-foreground">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
