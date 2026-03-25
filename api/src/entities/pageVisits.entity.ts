export const pageVisitsEntity = {
  table: "page_visits",
  columns: ["id", "page_id", "ip_address", "user_agent", "referrer", "visited_at"],
} as const;

