import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TicketClassification } from "core/enums";
import apiClient from "@/lib/api-client";
import { type TicketDetail } from "@/types/ticket";
import { classificationLabels, statusVariant } from "@/lib/ticket-helpers";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorAlert from "@/components/ErrorAlert";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: ticket,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => apiClient.get<TicketDetail>(`/api/tickets/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
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
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
                <dt className="text-muted-foreground">From</dt>
                <dd>
                  {ticket.fromName}{" "}
                  <span className="text-muted-foreground">&lt;{ticket.fromEmail}&gt;</span>
                </dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                </dd>

                <dt className="text-muted-foreground">Classification</dt>
                <dd>
                  {ticket.classification ? (
                    <Badge variant="secondary">
                      {classificationLabels[ticket.classification as TicketClassification]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>

                <dt className="text-muted-foreground">Assigned to</dt>
                <dd className="text-muted-foreground">
                  {ticket.assignedToAgentId ?? "Unassigned"}
                </dd>

                <dt className="text-muted-foreground">Received</dt>
                <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
              </dl>
            </CardContent>
          </Card>

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
        </>
      )}
    </div>
  );
}
