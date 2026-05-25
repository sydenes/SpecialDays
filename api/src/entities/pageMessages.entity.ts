export type PageMessage = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  createdAt: Date;
};

export type PageMessageAdmin = PageMessage & {
  isApproved: boolean;
  approvedAt: Date | null;
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

export function mapPageMessageAdminRow(row: {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  isApproved: boolean;
  approvedAt: Date | null;
  createdAt: Date;
}): PageMessageAdmin {
  return {
    id: row.id,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    messageText: row.messageText,
    isApproved: row.isApproved,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
  };
}
