export type PageMessage = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  createdAt: Date;
};

export const pageMessagesEntity = {
  table: "page_messages",
  columns: [
    "id",
    "page_id",
    "author_name",
    "author_email",
    "message_text",
    "is_approved",
    "approved_at",
    "created_at",
  ],
} as const;

export function mapPageMessageRow(row: {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  createdAt: Date;
}): PageMessage {
  return {
    id: row.id,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    messageText: row.messageText,
    createdAt: row.createdAt,
  };
}

