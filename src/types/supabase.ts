export type ProjectRow = {
  project_id: number;
  views: number;
  // add other fields as needed
};

export type CommentRow = {
  comment_id: number;
  user_id: string;
  // add other fields as needed
};

export type CategoryRow = {
  id: number;
  icon: string; // icon name matching keys in iconMap
  label: string;
  value: string; // slug used in URLs
};
