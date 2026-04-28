import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import apiClient from "@/lib/api-client";
import { type TicketDetail } from "@/types/ticket";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ErrorAlert from "@/components/ErrorAlert";
import TicketDetailSkeleton from "@/components/TicketDetailSkeleton";
import TicketControls from "@/components/TicketControls";
import TicketConversation from "@/components/TicketConversation";
import TicketReplyForm from "@/components/TicketReplyForm";

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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Link to="/tickets" className={buttonVariants({ variant: "ghost" }) + " -ml-2"}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to tickets
      </Link>

      {isPending && <TicketDetailSkeleton />}

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

              <TicketConversation replies={ticket.replies} customerName={ticket.fromName} />

              <TicketReplyForm ticketId={String(ticket.id)} />
            </div>

            <TicketControls ticketId={String(ticket.id)} ticket={ticket} />
          </div>
        </>
      )}
    </div>
  );
}
