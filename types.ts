/**
 * Supabase data contract placeholder.
 * Replace table/view/function shapes as schema is defined.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never> & {
      // Example:
      // projects: {
      //   Row: {
      //     id: string;
      //     name: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     name: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     name?: string;
      //     created_at?: string;
      //   };
      //   Relationships: [];
      // };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PublicSchema = Database["public"];
export type Tables = PublicSchema["Tables"];
