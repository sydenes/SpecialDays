export type PagePhoto = {
  id: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
};

export const pagePhotosEntity = {
  table: "page_photos",
  columns: ["id", "page_id", "file_url", "thumbnail_url", "caption", "sort_order", "created_at"],
} as const;

export function mapPagePhotoRow(row: {
  id: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}): PagePhoto {
  return {
    id: row.id,
    fileUrl: row.fileUrl,
    thumbnailUrl: row.thumbnailUrl,
    caption: row.caption,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

