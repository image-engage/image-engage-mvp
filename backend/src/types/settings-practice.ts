/**
 * Represents the structure of a record in the 'practices' table.
 */
export interface Practice {
  id: string; // UUID
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  name: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  branding_colors: Record<string, any> | null; // Assuming JSONB for colors
  email: string | null;
  website_url: string | null;
  isonboarded: boolean;
  google_refresh_token: string | null;
  google_drive_folder_id: string | null;
}

/**
 * Data Transfer Object (DTO) for updating a practice's settings.
 * All fields are optional to allow for partial updates.
 *
 * This uses TypeScript's `Partial` utility type to derive from the main `Practice`
 * interface, ensuring that any field that can be in `Practice` can also be updated.
 * We then Omit fields that should not be directly updatable via this DTO.
 */
export type UpdatePracticeDto = Partial<
  Omit<
    Practice,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'google_refresh_token'
    | 'google_drive_folder_id'
  >
>;