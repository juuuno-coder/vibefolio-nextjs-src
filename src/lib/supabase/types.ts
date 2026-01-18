// lib/supabase/types.ts
// Supabase 데이터베이스 타입 정의 (Standardized & Accurate Version 3)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // --- Lowercase Tables ---
      users: {
        Row: {
          id: string;
          email: string;
          nickname: string | null;
          profile_image_url: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
          role: string;
        };
        Insert: { id: string; email: string; nickname?: string | null; profile_image_url?: string | null; cover_image_url?: string | null; created_at?: string; updated_at?: string; role?: string; };
        Update: { id?: string; email?: string; nickname?: string | null; profile_image_url?: string | null; cover_image_url?: string | null; created_at?: string; updated_at?: string; role?: string; };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          role: string | null;
          bio: string | null;
          cover_image_url: string | null;
          updated_at: string | null;
          points: number;
        };
        Insert: { id: string; username?: string | null; avatar_url?: string | null; role?: string | null; bio?: string | null; cover_image_url?: string | null; updated_at?: string | null; points?: number; };
        Update: { id?: string; username?: string | null; avatar_url?: string | null; role?: string | null; bio?: string | null; cover_image_url?: string | null; updated_at?: string | null; points?: number; };
        Relationships: [{ foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"]; }];
      };
      like: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      bookmark: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      comment: {
        Row: {
          id: string;
          user_id: string;
          project_id: number;
          content: string;
          created_at: string;
          username: string;
          user_avatar_url: string;
          is_deleted: boolean;
        };
        Insert: { id?: string; user_id: string; project_id: number; content: string; created_at?: string; username: string; user_avatar_url: string; is_deleted?: boolean; };
        Update: { id?: string; user_id?: string; project_id?: number; content?: string; created_at?: string; username?: string; user_avatar_url?: string; is_deleted?: boolean; };
        Relationships: [];
      };
      view: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      inquiries: {
        Row: { id: number; project_id: number; creator_id: string; user_id: string; message: string; created_at: string; status: string; };
        Insert: { id?: number; project_id: number; creator_id: string; user_id: string; message: string; created_at?: string; status?: string; };
        Update: { id?: number; project_id?: number; creator_id?: string; user_id?: string; message?: string; created_at?: string; status?: string; };
        Relationships: [];
      };
      banners: {
        Row: {
          id: number;
          title: string;
          subtitle: string | null;
          image_url: string;
          link_url: string | null;
          bg_color: string;
          text_color: string;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: { id?: number; title: string; subtitle?: string | null; image_url: string; link_url?: string | null; bg_color?: string; text_color?: string; is_active?: boolean; display_order?: number; created_at?: string; };
        Update: { id?: number; title?: string; subtitle?: string | null; image_url?: string; link_url?: string | null; bg_color?: string; text_color?: string; is_active?: boolean; display_order?: number; created_at?: string; };
        Relationships: [];
      };
      notices: {
        Row: { id: number; title: string; content: string; is_important: boolean; is_visible: boolean; created_at: string; version: string | null; category: string; tags: string[] | null; };
        Insert: { id?: number; title: string; content: string; is_important?: boolean; is_visible?: boolean; created_at?: string; version?: string | null; category?: string; tags?: string[] | null; };
        Update: { id?: number; title?: string; content?: string; is_important?: boolean; is_visible?: boolean; created_at?: string; version?: string | null; category?: string; tags?: string[] | null; };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; title: string; message: string; link: string | null; read: boolean; sender_id: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; type: string; title: string; message: string; link?: string | null; read?: boolean; sender_id?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; type?: string; title?: string; message?: string; link?: string | null; read?: boolean; sender_id?: string | null; created_at?: string; };
        Relationships: [];
      };
      popups: {
        Row: {
          id: number;
          title: string;
          content: string | null;
          image_url: string | null;
          link_url: string | null;
          link_text: string;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: { id?: number; title: string; content?: string | null; image_url?: string | null; link_url?: string | null; link_text?: string; is_active?: boolean; start_date?: string | null; end_date?: string | null; display_order?: number; created_at?: string; };
        Update: { id?: number; title?: string; content?: string | null; image_url?: string | null; link_url?: string | null; link_text?: string; is_active?: boolean; start_date?: string | null; end_date?: string | null; display_order?: number; created_at?: string; };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: number;
          question: string;
          answer: string;
          category: string;
          order_index: number;
          is_visible: boolean;
          created_at: string;
        };
        Insert: { id?: number; question: string; answer: string; category: string; order_index?: number; is_visible?: boolean; created_at?: string; };
        Update: { id?: number; question?: string; answer?: string; category?: string; order_index?: number; is_visible?: boolean; created_at?: string; };
        Relationships: [];
      };
      recruit_items: {
        Row: {
          id: number;
          title: string;
          description: string;
          type: string;
          date: string;
          location: string | null;
          prize: string | null;
          salary: string | null;
          company: string | null;
          employment_type: string | null;
          link: string | null;
          thumbnail: string | null;
          is_approved: boolean;
          is_active: boolean;
          views_count: number;
          show_as_banner: boolean;
          banner_priority: number;
          created_at: string;
          updated_at: string;
          crawled_at: string | null;
        };
        Insert: { 
          id?: number; 
          title: string; 
          description: string; 
          type: string; 
          date: string; 
          location?: string | null; 
          prize?: string | null; 
          salary?: string | null; 
          company?: string | null; 
          employment_type?: string | null; 
          link?: string | null; 
          thumbnail?: string | null; 
          is_approved?: boolean;
          is_active?: boolean; 
          views_count?: number;
          show_as_banner?: boolean;
          banner_priority?: number;
          created_at?: string;
          updated_at?: string;
          crawled_at?: string | null;
        };
        Update: { 
          id?: number; 
          title?: string; 
          description?: string; 
          type?: string; 
          date?: string; 
          location?: string | null; 
          prize?: string | null; 
          salary?: string | null; 
          company?: string | null; 
          employment_type?: string | null; 
          link?: string | null; 
          thumbnail?: string | null; 
          is_approved?: boolean;
          is_active?: boolean; 
          views_count?: number;
          show_as_banner?: boolean;
          banner_priority?: number;
          created_at?: string;
          updated_at?: string;
          crawled_at?: string | null;
        };
        Relationships: [];
      };

      project_categories: {
        Row: {
          project_id: number;
          category_id: number;
          category_type: string;
          created_at: string;
        };
        Insert: { project_id: number; category_id: number; category_type?: string; created_at?: string; };
        Update: { project_id?: number; category_id?: number; category_type?: string; created_at?: string; };
        Relationships: [];
      };
      project_versions: {
        Row: {
          version_id: number;
          project_id: number;
          version_tag: string;
          version_name: string | null;
          changelog: string | null;
          release_type: string | null;
          snapshot_data: Json | null;
          released_at: string;
          created_at: string;
        };
        Insert: { version_id?: number; project_id: number; version_tag: string; version_name?: string | null; changelog?: string | null; release_type?: string | null; snapshot_data?: Json | null; released_at?: string; created_at?: string; };
        Update: { version_id?: number; project_id?: number; version_tag?: string; version_name?: string | null; changelog?: string | null; release_type?: string | null; snapshot_data?: Json | null; released_at?: string; created_at?: string; };
        Relationships: [];
      };
      api_keys: {
        Row: {
          key_id: number;
          user_id: string;
          api_key: string;
          key_name: string | null;
          key_prefix: string | null;
          scopes: string[] | null;
          rate_limit_per_minute: number;
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { key_id?: number; user_id: string; api_key: string; key_name?: string | null; key_prefix?: string | null; scopes?: string[] | null; rate_limit_per_minute?: number; is_active?: boolean; last_used_at?: string | null; expires_at?: string | null; created_at?: string; updated_at?: string; };
        Update: { key_id?: number; user_id?: string; api_key?: string; key_name?: string | null; key_prefix?: string | null; scopes?: string[] | null; rate_limit_per_minute?: number; is_active?: boolean; last_used_at?: string | null; expires_at?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };

      // --- PascalCase Tables (Used in many components) ---
      Category: {
        Row: { category_id: number; name: string; parent_id: number | null; };
        Insert: { category_id?: number; name: string; parent_id?: number | null; };
        Update: { category_id?: number; name?: string; parent_id?: number | null; };
        Relationships: [];
      };
      Project: {
        Row: {
          project_id: number;
          user_id: string;
          category_id: number;
          title: string;
          rendering_type: string | null;
          custom_data: string | null;
          thumbnail_url: string | null;
          content_text: string | null;
          views: number;
          likes_count: number;
          views_count: number;
          created_at: string;
          updated_at: string;
          allow_michelin_rating: boolean;
          allow_stickers: boolean;
          allow_secret_comments: boolean;
          description: string | null;
          visibility: string;
        };
        Insert: { project_id?: number; user_id: string; category_id: number; title: string; rendering_type?: string | null; custom_data?: string | null; thumbnail_url?: string | null; content_text?: string | null; views?: number; likes_count?: number; views_count?: number; created_at?: string; updated_at?: string; allow_michelin_rating?: boolean; allow_stickers?: boolean; allow_secret_comments?: boolean; description?: string | null; visibility?: string; };
        Update: { project_id?: number; user_id?: string; category_id?: number; title?: string; rendering_type?: string | null; custom_data?: string | null; thumbnail_url?: string | null; content_text?: string | null; views?: number; likes_count?: number; views_count?: number; created_at?: string; updated_at?: string; allow_michelin_rating?: boolean; allow_stickers?: boolean; allow_secret_comments?: boolean; description?: string | null; visibility?: string; };
        Relationships: [];
      };
      Collection: {
        Row: { collection_id: string; user_id: string; name: string; description: string | null; created_at: string; };
        Insert: { collection_id?: string; user_id: string; name: string; description?: string | null; created_at?: string; };
        Update: { collection_id?: string; user_id?: string; name?: string; description?: string | null; created_at?: string; };
        Relationships: [];
      };
      CollectionItem: {
        Row: { collection_id: string; project_id: number; added_at: string; };
        Insert: { collection_id: string; project_id: number; added_at?: string; };
        Update: { collection_id?: string; project_id?: number; added_at?: string; };
        Relationships: [];
      };
      Comment: {
        Row: {
          comment_id: number;
          user_id: string;
          project_id: number;
          content: string;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          // Joined fields sometimes expected
          username?: string;
          user_avatar_url?: string;
        };
        Insert: { comment_id?: number; user_id: string; project_id: number; content: string; created_at?: string; updated_at?: string; is_deleted?: boolean; username?: string; user_avatar_url?: string; };
        Update: { comment_id?: number; user_id?: string; project_id?: number; content?: string; created_at?: string; updated_at?: string; is_deleted?: boolean; username?: string; user_avatar_url?: string; };
        Relationships: [];
      };
      Like: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      Bookmark: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      Wishlist: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
      Proposal: {
        Row: {
          proposal_id: string;
          sender_id: string;
          receiver_id: string;
          title: string;
          content: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { proposal_id?: string; sender_id: string; receiver_id: string; title: string; content: string; status?: string; created_at?: string; updated_at?: string; };
        Update: { proposal_id?: string; sender_id?: string; receiver_id?: string; title?: string; content?: string; status?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      Follow: {
        Row: { follower_id: string; following_id: string; created_at: string; };
        Insert: { follower_id: string; following_id: string; created_at?: string; };
        Update: { follower_id?: string; following_id?: string; created_at?: string; };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never; };
    Functions: {
      generate_api_key: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
  };
};
