export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type IssueSeverity = "low" | "medium" | "high";
export type IssueStatus = "open" | "fixed";
export type VaultCategory = "appliances" | "electronics" | "home_repair" | "vehicles";
export type VaultDocType = "warranty" | "house_document" | "repair_note" | "remodel_note";
export type ImagePhotoKind = "memory" | "person";
export type HouseProjectKind = "repair" | "remodel" | "general";
export type FamilyEventCategory = "general" | "meal" | "activity" | "appointment";
export type FamilyEventKind = "regular" | "important" | "birthday" | "school";
export type MemberColorToken =
  | "sky"
  | "orange"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "indigo";

export type VaultExtraFile = {
  path: string;
  name: string;
  mime: string | null;
};

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          nickname: string | null;
          year: number;
          make: string;
          model: string;
          color: string | null;
          vin: string | null;
          license_plate: string | null;
          current_mileage: number | null;
          mpg_avg: number | null;
          last_oil_change_date: string | null;
          last_oil_change_mileage: number | null;
          tires_installed_date: string | null;
          registration_expires: string | null;
          insurance_expires: string | null;
          photo_path: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nickname?: string | null;
          year: number;
          make: string;
          model: string;
          color?: string | null;
          vin?: string | null;
          license_plate?: string | null;
          current_mileage?: number | null;
          mpg_avg?: number | null;
          last_oil_change_date?: string | null;
          last_oil_change_mileage?: number | null;
          tires_installed_date?: string | null;
          registration_expires?: string | null;
          insurance_expires?: string | null;
          photo_path?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          year?: number;
          make?: string;
          model?: string;
          color?: string | null;
          vin?: string | null;
          license_plate?: string | null;
          current_mileage?: number | null;
          mpg_avg?: number | null;
          last_oil_change_date?: string | null;
          last_oil_change_mileage?: number | null;
          tires_installed_date?: string | null;
          registration_expires?: string | null;
          insurance_expires?: string | null;
          photo_path?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicle_issues: {
        Row: {
          id: string;
          vehicle_id: string;
          description: string;
          severity: IssueSeverity;
          status: IssueStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          description: string;
          severity?: IssueSeverity;
          status?: IssueStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          description?: string;
          severity?: IssueSeverity;
          status?: IssueStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_issues_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vault_documents: {
        Row: {
          id: string;
          doc_type: VaultDocType;
          title: string;
          category: VaultCategory | null;
          notes: string | null;
          details: string | null;
          cost: number | null;
          purchase_date: string | null;
          warranty_expires: string | null;
          project_id: string | null;
          project_title: string | null;
          file_path: string;
          file_name: string;
          file_mime: string | null;
          extra_files: VaultExtraFile[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_type?: VaultDocType;
          title: string;
          category?: VaultCategory | null;
          notes?: string | null;
          details?: string | null;
          cost?: number | null;
          purchase_date?: string | null;
          warranty_expires?: string | null;
          project_id?: string | null;
          project_title?: string | null;
          file_path: string;
          file_name: string;
          file_mime?: string | null;
          extra_files?: VaultExtraFile[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_type?: VaultDocType;
          title?: string;
          category?: VaultCategory | null;
          notes?: string | null;
          details?: string | null;
          cost?: number | null;
          purchase_date?: string | null;
          warranty_expires?: string | null;
          project_id?: string | null;
          project_title?: string | null;
          file_path?: string;
          file_name?: string;
          file_mime?: string | null;
          extra_files?: VaultExtraFile[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      image_vault_photos: {
        Row: {
          id: string;
          photo_kind: ImagePhotoKind;
          file_path: string;
          file_name: string;
          file_mime: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_kind: ImagePhotoKind;
          file_path: string;
          file_name: string;
          file_mime?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          photo_kind?: ImagePhotoKind;
          file_path?: string;
          file_name?: string;
          file_mime?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      house_projects: {
        Row: {
          id: string;
          title: string;
          kind: HouseProjectKind;
          details: string;
          cost: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          kind: HouseProjectKind;
          details?: string;
          cost?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: HouseProjectKind;
          details?: string;
          cost?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_calendar_events: {
        Row: {
          id: string;
          title: string;
          event_date: string;
          event_time: string | null;
          category: FamilyEventCategory;
          event_kind: FamilyEventKind;
          color_class: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          event_date: string;
          event_time?: string | null;
          category?: FamilyEventCategory;
          event_kind?: FamilyEventKind;
          color_class?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          event_date?: string;
          event_time?: string | null;
          category?: FamilyEventCategory;
          event_kind?: FamilyEventKind;
          color_class?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          display_name: string;
          color_token: MemberColorToken;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          color_token?: MemberColorToken;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          color_token?: MemberColorToken;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_event_members: {
        Row: {
          event_id: string;
          member_id: string;
        };
        Insert: {
          event_id: string;
          member_id: string;
        };
        Update: {
          event_id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_members_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "family_calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_event_members_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      chores: {
        Row: {
          id: string;
          title: string;
          token_value: number;
          assignee_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          token_value?: number;
          assignee_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          token_value?: number;
          assignee_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chores_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      token_ledger: {
        Row: {
          id: string;
          member_id: string;
          delta: number;
          reason: "chore_complete" | "reward_purchase" | "adjustment";
          ref_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          delta: number;
          reason: "chore_complete" | "reward_purchase" | "adjustment";
          ref_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          delta?: number;
          reason?: "chore_complete" | "reward_purchase" | "adjustment";
          ref_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "token_ledger_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      chore_completions: {
        Row: {
          id: string;
          chore_id: string;
          member_id: string;
          ledger_id: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          chore_id: string;
          member_id: string;
          ledger_id?: string | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          chore_id?: string;
          member_id?: string;
          ledger_id?: string | null;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chore_completions_chore_id_fkey";
            columns: ["chore_id"];
            isOneToOne: false;
            referencedRelation: "chores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chore_completions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          token_cost: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          token_cost: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          token_cost?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reward_redemptions: {
        Row: {
          id: string;
          reward_id: string;
          member_id: string;
          token_cost: number;
          status: "pending" | "fulfilled" | "cancelled";
          ledger_id: string | null;
          created_at: string;
          fulfilled_at: string | null;
        };
        Insert: {
          id?: string;
          reward_id: string;
          member_id: string;
          token_cost: number;
          status?: "pending" | "fulfilled" | "cancelled";
          ledger_id?: string | null;
          created_at?: string;
          fulfilled_at?: string | null;
        };
        Update: {
          id?: string;
          reward_id?: string;
          member_id?: string;
          token_cost?: number;
          status?: "pending" | "fulfilled" | "cancelled";
          ledger_id?: string | null;
          created_at?: string;
          fulfilled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey";
            columns: ["reward_id"];
            isOneToOne: false;
            referencedRelation: "rewards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_redemptions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      meals: {
        Row: {
          id: string;
          name: string;
          prep_time: string;
          cook_time: string;
          ingredients: string[];
          instructions: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          prep_time?: string;
          cook_time?: string;
          ingredients?: string[];
          instructions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prep_time?: string;
          cook_time?: string;
          ingredients?: string[];
          instructions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_likes: {
        Row: {
          meal_id: string;
          member_id: string;
        };
        Insert: {
          meal_id: string;
          member_id: string;
        };
        Update: {
          meal_id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_likes_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_likes_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "household_members";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plan_entries: {
        Row: {
          id: string;
          plan_date: string;
          slot: "breakfast" | "lunch" | "dinner";
          meal_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_date: string;
          slot: "breakfast" | "lunch" | "dinner";
          meal_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_date?: string;
          slot?: "breakfast" | "lunch" | "dinner";
          meal_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_entries_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      banking_accounts: {
        Row: {
          id: string;
          plaid_account_id: string;
          item_row_id: string;
          name: string;
          official_name: string | null;
          type: string;
          subtype: string | null;
          mask: string | null;
          current_balance: number | null;
          available_balance: number | null;
          iso_currency_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plaid_account_id: string;
          item_row_id: string;
          name: string;
          official_name?: string | null;
          type: string;
          subtype?: string | null;
          mask?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          iso_currency_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plaid_account_id?: string;
          item_row_id?: string;
          name?: string;
          official_name?: string | null;
          type?: string;
          subtype?: string | null;
          mask?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          iso_currency_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      banking_transactions: {
        Row: {
          id: string;
          plaid_transaction_id: string;
          account_id: string;
          amount: number;
          date: string;
          name: string;
          merchant_name: string | null;
          primary_category: string;
          pending: boolean;
          iso_currency_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plaid_transaction_id: string;
          account_id: string;
          amount: number;
          date: string;
          name: string;
          merchant_name?: string | null;
          primary_category?: string;
          pending?: boolean;
          iso_currency_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plaid_transaction_id?: string;
          account_id?: string;
          amount?: number;
          date?: string;
          name?: string;
          merchant_name?: string | null;
          primary_category?: string;
          pending?: boolean;
          iso_currency_code?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "banking_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "banking_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      banking_settings: {
        Row: {
          id: number;
          investments_amount: number;
          last_synced_at: string | null;
          connection_count: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          investments_amount?: number;
          last_synced_at?: string | null;
          connection_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          investments_amount?: number;
          last_synced_at?: string | null;
          connection_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PublicSchema = Database["public"];
export type Tables = PublicSchema["Tables"];
export type VehicleRow = Tables["vehicles"]["Row"];
export type VehicleInsert = Tables["vehicles"]["Insert"];
export type VehicleUpdate = Tables["vehicles"]["Update"];
export type VehicleIssueRow = Tables["vehicle_issues"]["Row"];
export type VehicleIssueInsert = Tables["vehicle_issues"]["Insert"];
export type VaultDocumentRow = Tables["vault_documents"]["Row"];
export type VaultDocumentInsert = Tables["vault_documents"]["Insert"];
export type VaultDocumentUpdate = Tables["vault_documents"]["Update"];
export type ImageVaultPhotoRow = Tables["image_vault_photos"]["Row"];
export type ImageVaultPhotoInsert = Tables["image_vault_photos"]["Insert"];
export type ImageVaultPhotoUpdate = Tables["image_vault_photos"]["Update"];
export type HouseProjectRow = Tables["house_projects"]["Row"];
export type HouseProjectInsert = Tables["house_projects"]["Insert"];
export type HouseProjectUpdate = Tables["house_projects"]["Update"];
export type FamilyCalendarEventRow = Tables["family_calendar_events"]["Row"];
export type FamilyCalendarEventInsert = Tables["family_calendar_events"]["Insert"];
export type FamilyCalendarEventUpdate = Tables["family_calendar_events"]["Update"];
export type HouseholdMemberRow = Tables["household_members"]["Row"];
export type HouseholdMemberInsert = Tables["household_members"]["Insert"];
export type HouseholdMemberUpdate = Tables["household_members"]["Update"];
export type ChoreRow = Tables["chores"]["Row"];
export type ChoreInsert = Tables["chores"]["Insert"];
export type ChoreUpdate = Tables["chores"]["Update"];
export type TokenLedgerRow = Tables["token_ledger"]["Row"];
export type TokenLedgerInsert = Tables["token_ledger"]["Insert"];
export type ChoreCompletionRow = Tables["chore_completions"]["Row"];
export type RewardRow = Tables["rewards"]["Row"];
export type RewardInsert = Tables["rewards"]["Insert"];
export type RewardUpdate = Tables["rewards"]["Update"];
export type RewardRedemptionRow = Tables["reward_redemptions"]["Row"];
export type MealRow = Tables["meals"]["Row"];
export type MealInsert = Tables["meals"]["Insert"];
export type MealUpdate = Tables["meals"]["Update"];
export type MealLikeRow = Tables["meal_likes"]["Row"];
export type MealPlanEntryRow = Tables["meal_plan_entries"]["Row"];
export type MealPlanEntryInsert = Tables["meal_plan_entries"]["Insert"];
export type BankingAccountRow = Tables["banking_accounts"]["Row"];
export type BankingTransactionRow = Tables["banking_transactions"]["Row"];
export type BankingSettingsRow = Tables["banking_settings"]["Row"];
export type BankingSettingsUpdate = Tables["banking_settings"]["Update"];
