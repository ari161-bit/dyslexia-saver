// Hand-written to match supabase/migrations/0001_schema.sql.
// Regenerate with `npx supabase gen types typescript` once the project is linked,
// then reconcile any drift with this file.

export type UserRole = "student" | "parent" | "teacher" | "school_admin";
export type MembershipStatus = "pending" | "approved" | "rejected";
export type ResourceStatus = "uploading" | "processing" | "ready" | "failed";
export type AdaptationType =
  | "accessible"
  | "explain"
  | "vocabulary"
  | "breakdown"
  | "audio"
  | "practice"
  | "revision";
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "reviewed";
export type HighlightMode = "none" | "paragraph" | "sentence" | "word";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          student_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          student_code?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      schools: {
        Row: { id: string; name: string; logo_url: string | null; created_at: string };
        Insert: { id?: string; name: string; logo_url?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
        Relationships: [];
      };
      school_members: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          role: UserRole;
          status: MembershipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          role: UserRole;
          status?: MembershipStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["school_members"]["Insert"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          teacher_id: string;
          name: string;
          grade: string | null;
          subject: string | null;
          join_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          teacher_id: string;
          name: string;
          grade?: string | null;
          subject?: string | null;
          join_code?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
        Relationships: [];
      };
      class_members: {
        Row: { id: string; class_id: string; student_id: string; created_at: string };
        Insert: { id?: string; class_id: string; student_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["class_members"]["Insert"]>;
        Relationships: [];
      };
      parent_student_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string | null;
          status: MembershipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          relationship?: string | null;
          status?: MembershipStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parent_student_links"]["Insert"]>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          owner_id: string;
          school_id: string | null;
          title: string;
          subject: string | null;
          grade: string | null;
          original_file_url: string | null;
          original_file_type: string | null;
          extracted_text: string | null;
          extracted_structure: unknown;
          status: ResourceStatus;
          is_seed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          school_id?: string | null;
          title: string;
          subject?: string | null;
          grade?: string | null;
          original_file_url?: string | null;
          original_file_type?: string | null;
          extracted_text?: string | null;
          extracted_structure?: unknown;
          status?: ResourceStatus;
          is_seed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
        Relationships: [];
      };
      resource_adaptations: {
        Row: {
          id: string;
          resource_id: string;
          type: AdaptationType;
          content: unknown;
          created_by: string;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          type: AdaptationType;
          content: unknown;
          created_by: string;
          approved?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resource_adaptations"]["Insert"]>;
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          resource_id: string | null;
          title: string;
          description: string | null;
          instructions: string | null;
          subject: string | null;
          accessibility_support: unknown;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id: string;
          resource_id?: string | null;
          title: string;
          description?: string | null;
          instructions?: string | null;
          subject?: string | null;
          accessibility_support?: unknown;
          due_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: unknown;
          status: SubmissionStatus;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          content?: unknown;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
        Relationships: [];
      };
      reading_preferences: {
        Row: {
          user_id: string;
          font_size: number;
          line_spacing: number;
          letter_spacing: number;
          word_spacing: number;
          content_width: string;
          alignment: string;
          background: string;
          reading_speed: number;
          highlight_mode: HighlightMode;
          dyslexia_font: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reading_preferences"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_preferences"]["Row"]>;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          content: string;
          position: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_id: string;
          content: string;
          position?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [];
      };
      progress_events: {
        Row: {
          id: string;
          student_id: string;
          resource_id: string | null;
          event_type: string;
          metadata: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          resource_id?: string | null;
          event_type: string;
          metadata?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["progress_events"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          attachment_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          attachment_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      schools_directory: {
        Args: Record<string, never>;
        Returns: { id: string; name: string }[];
      };
      my_profile_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      find_class_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      find_student_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      create_school_announcement: {
        Args: { p_school_id: string; p_title: string; p_body: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
