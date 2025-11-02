import type { Road } from './road';
import type { Like } from './like';

export interface Database {
  public: {
    Tables: {
      roads: {
        Row: Road;
        Insert: Omit<Road, 'id' | 'created_at'>;
        Update: Partial<Omit<Road, 'id' | 'created_at'>>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, 'id' | 'created_at'>;
        Update: Partial<Omit<Like, 'id' | 'created_at'>>;
      };
    };
  };
}
