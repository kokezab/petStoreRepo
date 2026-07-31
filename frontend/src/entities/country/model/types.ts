export interface Country {
  id: string;
  name: string;
  code: string;
  status: 'draft' | 'active' | 'done';
}
