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
export type BankingAccountRow = Tables["banking_accounts"]["Row"];
export type BankingTransactionRow = Tables["banking_transactions"]["Row"];
export type BankingSettingsRow = Tables["banking_settings"]["Row"];
export type BankingSettingsUpdate = Tables["banking_settings"]["Update"];
