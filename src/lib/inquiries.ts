// src/lib/inquiries.ts
import { supabase } from "./supabase";
import { PostgrestError } from "@supabase/supabase-js";

export interface Inquiry {
  id: number;
  project_id: string;
  creator_id: string;
  user_id: string;
  message: string;
  created_at: string;
  status: "pending" | "answered";
  projects: {
    title: string;
    users: {
      username: string;
    };
  };
}

/**
 * Get all inquiries for a specific user.
 */
export async function getUserInquiries(userId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(`
      id,
      project_id,
      creator_id,
      user_id,
      message,
      created_at,
      status,
      projects (
        title,
        users (
          username
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inquiries:", error);
    return [];
  }
  return data as Inquiry[];
}

/**
 * Add an inquiry for a project.
 */
export async function addInquiry(
  projectId: string,
  creatorId: string,
  userId: string,
  message: string
): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      project_id: projectId,
      creator_id: creatorId,
      user_id: userId,
      message,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding inquiry:", error);
    return null;
  }
  return data as Inquiry;
}

/**
 * Delete an inquiry.
 */
export async function deleteInquiry(inquiryId: number, userId: string): Promise<{ data: null; error: PostgrestError | null }> {
  let query = supabase.from("inquiries").delete().eq("id", inquiryId);
  // If userId is provided, it's a user deleting their own. Otherwise, it's an admin.
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { error } = await query;

  return { data: null, error };
}

/**
 * (Admin) Get all inquiries.
 */
export async function getAllInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(`
      id,
      project_id,
      creator_id,
      user_id,
      message,
      created_at,
      status,
      projects (
        title,
        users (
          username
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all inquiries:", error);
    return [];
  }
  return data as Inquiry[];
}

/**
 * (Admin) Update inquiry status.
 */
export async function updateInquiryStatus(
  inquiryId: number,
  status: "pending" | "answered"
): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating inquiry status:", error);
    return null;
  }
  return data as Inquiry;
}
