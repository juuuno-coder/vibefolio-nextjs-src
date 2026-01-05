// lib/supabase/types.ts
// Supabase 데이터베이스 타입 정의 (Standardized, Case-Aware & Comprehensive)

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
        Row: { id: string; username: string | null; avatar_url: string | null; role: string | null; updated_at: string | null; };
        Insert: { id: string; username?: string | null; avatar_url?: string | null; role?: string | null; updated_at?: string | null; };
        Update: { id?: string; username?: string | null; avatar_url?: string | null; role?: string | null; updated_at?: string | null; };
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
        Row: { id: string; user_id: string; project_id: number; content: string; created_at: string; username: string; user_avatar_url: string; is_deleted: boolean; };
        Insert: { id?: string; user_id: string; project_id: number; content: string; created_at?: string; username: string; user_avatar_url: string; is_deleted?: boolean; };
        Update: { id?: string; user_id?: string; project_id?: number; content?: string; created_at?: string; username?: string; user_avatar_url?: string; is_deleted?: boolean; };
        Relationships: [];
      };
      comments: { // Alias for plural usage if any
        Row: { comment_id: number; user_id: string; project_id: number; content: string; created_at: string; updated_at: string; is_deleted: boolean; };
        Insert: { comment_id?: number; user_id: string; project_id: number; content: string; created_at?: string; updated_at?: string; is_deleted?: boolean; };
        Update: { comment_id?: number; user_id?: string; project_id?: number; content?: string; created_at?: string; updated_at?: string; is_deleted?: boolean; };
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
        Row: { id: number; title: string; subtitle: string | null; image_url: string; link_url: string | null; bg_color: string; text_color: string; is_active: boolean; display_order: number; created_at: string; };
        Insert: { id?: number; title: string; subtitle?: string | null; image_url: string; link_url?: string | null; bg_color?: string; text_color?: string; is_active?: boolean; display_order?: number; created_at?: string; };
        Update: { id?: number; title?: string; subtitle?: string | null; image_url?: string; link_url?: string | null; bg_color?: string; text_color?: string; is_active?: boolean; display_order?: number; created_at?: string; };
        Relationships: [];
      };
      notices: {
        Row: { id: number; title: string; content: string; is_important: boolean; is_visible: boolean; created_at: string; };
        Insert: { id?: number; title: string; content: string; is_important?: boolean; is_visible?: boolean; created_at?: string; };
        Update: { id?: number; title?: string; content?: string; is_important?: boolean; is_visible?: boolean; created_at?: string; };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; title: string; message: string; link: string | null; read: boolean; sender_id: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; type: string; title: string; message: string; link?: string | null; read?: boolean; sender_id?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; type?: string; title?: string; message?: string; link?: string | null; read?: boolean; sender_id?: string | null; created_at?: string; };
        Relationships: [];
      };
      popups: {
        Row: { id: number; title: string; image_url: string; link_url: string | null; is_visible: boolean; start_date: string | null; end_date: string | null; created_at: string; };
        Insert: { id?: number; title: string; image_url: string; link_url?: string | null; is_visible?: boolean; start_date?: string | null; end_date?: string | null; created_at?: string; };
        Update: { id?: number; title?: string; image_url?: string; link_url?: string | null; is_visible?: boolean; start_date?: string | null; end_date?: string | null; created_at?: string; };
        Relationships: [];
      };
      faqs: {
        Row: { id: number; question: string; answer: string; category: string | null; display_order: number; created_at: string; };
        Insert: { id?: number; question: string; answer: string; category?: string | null; display_order?: number; created_at?: string; };
        Update: { id?: number; question?: string; answer?: string; category?: string | null; display_order?: number; created_at?: string; };
        Relationships: [];
      };

      // --- PascalCase Tables (Used in some components) ---
      Category: {
        Row: { category_id: number; name: string; parent_id: number | null; };
        Insert: { category_id?: number; name: string; parent_id?: number | null; };
        Update: { category_id?: number; name?: string; parent_id?: number | null; };
        Relationships: [];
      };
      Project: {
        Row: { project_id: number; user_id: string; category_id: number; title: string; rendering_type: string | null; custom_data: string | null; thumbnail_url: string | null; content_text: string | null; views: number; created_at: string; updated_at: string; };
        Insert: { project_id?: number; user_id: string; category_id: number; title: string; rendering_type?: string | null; custom_data?: string | null; thumbnail_url?: string | null; content_text?: string | null; views?: number; created_at?: string; updated_at?: string; };
        Update: { project_id?: number; user_id?: string; category_id?: number; title?: string; rendering_type?: string | null; custom_data?: string | null; thumbnail_url?: string | null; content_text?: string | null; views?: number; created_at?: string; updated_at?: string; };
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
      Proposal: {
        Row: { proposal_id: number; user_id: string; title: string; content: string; status: string; created_at: string; updated_at: string; };
        Insert: { proposal_id?: number; user_id: string; title: string; content: string; status?: string; created_at?: string; updated_at?: string; };
        Update: { proposal_id?: number; user_id?: string; title?: string; content?: string; status?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      Follow: {
        Row: { follower_id: string; following_id: string; created_at: string; };
        Insert: { follower_id: string; following_id: string; created_at?: string; };
        Update: { follower_id?: string; following_id?: string; created_at?: string; };
        Relationships: [];
      };
      Wishlist: {
        Row: { user_id: string; project_id: number; created_at: string; };
        Insert: { user_id: string; project_id: number; created_at?: string; };
        Update: { user_id?: string; project_id?: number; created_at?: string; };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never; };
    Functions: { [_ in never]: never; };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
  };
};
