export interface UserGroup {
  id: number;
  name: string;
  description: string;
  parent?: UserGroup;
  created_at: string;
  updated_at: string;
  selected?: boolean;
} 