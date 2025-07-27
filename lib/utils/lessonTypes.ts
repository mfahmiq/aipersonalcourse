export type LessonSection =
  | { type: "markdown"; data: string }
  | { type: "image"; data: { url: string; caption?: string } }
  | { type: "video"; data: { url: string; caption?: string } };

export interface LessonJSON {
  id: string;
  title: string;
  description?: string;
  sections: LessonSection[];
  created_at: string;
  updated_at: string;
} 