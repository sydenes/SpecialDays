export type AttendanceStatus = "attending" | "not_attending" | "undecided";

export type PageMessage = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  attendanceStatus: AttendanceStatus | null;
  guestCount: number | null;
  declineReason: string | null;
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
    "attendance_status",
    "guest_count",
    "decline_reason",
    "is_approved",
    "approved_at",
    "created_at",
  ],
} as const;

type MessageRowBase = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  messageText: string;
  attendanceStatus?: AttendanceStatus | null;
  guestCount?: number | null;
  declineReason?: string | null;
  createdAt: Date;
};

function mapRsvpFields(row: MessageRowBase) {
  return {
    attendanceStatus: row.attendanceStatus ?? null,
    guestCount: typeof row.guestCount === "number" ? row.guestCount : null,
    declineReason: row.declineReason ?? null,
  };
}

export function mapPageMessageRow(row: MessageRowBase): PageMessage {
  return {
    id: row.id,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    messageText: row.messageText,
    ...mapRsvpFields(row),
    createdAt: row.createdAt,
  };
}

export function mapPageMessageAdminRow(
  row: MessageRowBase & {
    isApproved: boolean;
    approvedAt: Date | null;
  }
): PageMessageAdmin {
  return {
    ...mapPageMessageRow(row),
    isApproved: row.isApproved,
    approvedAt: row.approvedAt,
  };
}
