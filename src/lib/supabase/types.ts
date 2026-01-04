// lib/supabase/types.ts
// Supabase 데이터베이스 타입 정의

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          email: string;
          nickname: string | null;
          profile_image_url: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
          role: string;
        };
        Insert: {
          id: string; // UUID
          email: string;
          nickname?: string | null;
          profile_image_url?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string;
        };
        Update: {
          id?: string; // UUID
          email?: string;
          nickname?: string | null;
          profile_image_url?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string;
        };
      };
      Category: {
        Row: {
          category_id: number;
          name: string;
          parent_id: number | null;
        };
        Insert: {
          category_id?: number;
          name: string;
          parent_id?: number | null;
        };
        Update: {
          category_id?: number;
          name?: string;
          parent_id?: number | null;
        };
      };
      Project: {
        Row: {
          project_id: number;
          user_id: string; // UUID
          category_id: number;
          title: string;
          rendering_type: string | null;
          custom_data: string | null;
          thumbnail_url: string | null;
          content_text: string | null;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id?: number;
          user_id: string; // UUID
          category_id: number;
          title: string;
          rendering_type?: string | null;
          custom_data?: string | null;
          thumbnail_url?: string | null;
          content_text?: string | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: number;
          user_id?: string; // UUID
          category_id?: number;
          title?: string;
          rendering_type?: string | null;
          custom_data?: string | null;
          thumbnail_url?: string | null;
          content_text?: string | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      Like: {
        Row: {
          user_id: string; // UUID
          project_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string; // UUID
          project_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string; // UUID
          project_id?: number;
          created_at?: string;
        };
      };
      Wishlist: {
        Row: {
          user_id: string; // UUID
          project_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string; // UUID
          project_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string; // UUID
          project_id?: number;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          comment_id: number;
          user_id: string; // UUID
          project_id: number;
          content: string;
          parent_comment_id: number | null;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
        };
        Insert: {
          comment_id?: number;
          user_id: string; // UUID
          project_id: number;
          content: string;
          parent_comment_id?: number | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
        };
        Update: {
          comment_id?: number;
          user_id?: string; // UUID
          project_id?: number;
          content?: string;
          parent_comment_id?: number | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
        };
      };
      Proposal: {
        Row: {
          proposal_id: number;
          user_id: string; // UUID
          title: string;
          content: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          proposal_id?: number;
          user_id: string; // UUID
          title: string;
          content: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          proposal_id?: number;
          user_id?: string; // UUID
          title?: string;
          content?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      OutsourcingRequest: {
        Row: {
          request_id: number;
          user_id: string; // UUID
          title: string;
          budget: string | null;
          required_duration: string | null;
          required_skills: string | null;
          details: string | null;
          is_complete: boolean;
          created_at: string;
          category_id: number | null;
        };
        Insert: {
          request_id?: number;
          user_id: string; // UUID
          title: string;
          budget?: string | null;
          required_duration?: string | null;
          required_skills?: string | null;
          details?: string | null;
          is_complete?: boolean;
          created_at?: string;
          category_id?: number | null;
        };
        Update: {
          request_id?: number;
          user_id?: string; // UUID
          title?: string;
          budget?: string | null;
          required_duration?: string | null;
          required_skills?: string | null;
          details?: string | null;
          is_complete?: boolean;
          created_at?: string;
          category_id?: number | null;
        };
      };
      JobPosting: {
        Row: {
          posting_id: number;
          user_id: string; // UUID
          company_name: string | null;
          location: string | null;
          title: string;
          job_type: string | null;
          required_skills: string | null;
          description: string | null;
          deadline: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          category_id: number | null;
        };
        Insert: {
          posting_id?: number;
          user_id: string; // UUID
          company_name?: string | null;
          location?: string | null;
          title: string;
          job_type?: string | null;
          required_skills?: string | null;
          description?: string | null;
          deadline?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          category_id?: number | null;
        };
        Update: {
          posting_id?: number;
          user_id?: string; // UUID
          company_name?: string | null;
          location?: string | null;
          title?: string;
          job_type?: string | null;
          required_skills?: string | null;
          description?: string | null;
          deadline?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          category_id?: number | null;
        };
      };
      Banner: {
        Row: {
          banner_id: number;
          page_type: string;
          title: string;
          image_url: string;
          link_url: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          banner_id?: number;
          page_type?: string;
          title: string;
          image_url: string;
          link_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          banner_id?: number;
          page_type?: string;
          title?: string;
          image_url?: string;
          link_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      Collection: {
        Row: {
          collection_id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          collection_id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          collection_id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      CollectionItem: {
        Row: {
          collection_id: string;
          project_id: number;
          added_at: string;
        };
        Insert: {
          collection_id: string;
          project_id: number;
          added_at?: string;
        };
        Update: {
          collection_id?: string;
          project_id?: number;
          added_at?: string;
        };
      };
      Follow: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
