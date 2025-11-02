export interface Comment {
  id: string;
  road_id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
}

export interface CreateCommentInput {
  road_id: string;
  user_id: string;
  content: string;
}
