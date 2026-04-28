import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { type TicketDetail } from "@/types/ticket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  readonly ticketId: string;
};

export default function TicketReplyForm({ ticketId }: Props) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userName = session?.user.name ?? "Agent";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mutation = useMutation({
    mutationFn: (replyBody: string) =>
      apiClient
        .post<TicketDetail>(`/api/tickets/${ticketId}/replies`, { body: replyBody })
        .then((res) => res.data),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticket", ticketId], updatedTicket);
      setBody("");
      toast.success("Reply sent.");
    },
    onError: () => {
      toast.error("Failed to send reply.");
    },
  });

  return (
    <div className="mt-6">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {userInitials}
          </div>
          <span className="text-sm text-muted-foreground">
            Reply as <span className="font-medium text-foreground">{userName}</span>
          </span>
        </div>
        <CardContent className="p-0">
          <Textarea
            placeholder="Write a reply to the customer..."
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={mutation.isPending}
            className="resize-none rounded-none border-0 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">{body.length} / 10000</span>
            <Button
              size="sm"
              onClick={() => mutation.mutate(body)}
              disabled={body.trim().length === 0 || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="mr-2 h-4 w-4" />
              )}
              Send reply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
