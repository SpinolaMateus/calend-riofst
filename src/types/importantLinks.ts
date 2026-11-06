export interface ImportantLinkCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string;
  categoryName: string;
  color?: string;
  isPinned?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}
