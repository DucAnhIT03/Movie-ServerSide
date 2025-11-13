export interface MovieEntity {
  id: number;
  title: string;
  descriptions: string | null;
  author: string | null;
  image: string | null;
  trailer: string | null;
  type: '2D' | '3D';
  duration: number;
  release_date: Date;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

