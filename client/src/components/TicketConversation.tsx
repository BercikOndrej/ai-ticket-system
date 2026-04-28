import { SenderType } from "core/enums";
import { type TicketReply } from "@/types/ticket";
import { cn } from "@/lib/utils";

type Props = {
  readonly replies: readonly TicketReply[];
  readonly customerName: string;
};

export default function TicketConversation({ replies, customerName }: Props) {
  if (replies.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Conversation
      </p>
      {replies.map((reply) => {
        const isAgent = reply.senderType === SenderType.Agent;
        const name = isAgent ? (reply.author?.name ?? "Agent") : customerName;
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div key={reply.id} className={cn("flex gap-3", isAgent && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isAgent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {initials}
            </div>
            <div className={cn("flex max-w-[78%] flex-col gap-1", isAgent && "items-end")}>
              <div className={cn("flex items-baseline gap-2", isAgent && "flex-row-reverse")}>
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  isAgent
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted text-foreground",
                )}
              >
                <pre className="whitespace-pre-wrap font-sans">{reply.body}</pre>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
