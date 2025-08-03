// Type definitions for AI models table in Supabase

export interface AIModelRow {
  id: string;
  model_path: string;
  name: string;
  provider: string;
  category: string | null;
  is_active: boolean;
  capabilities: string[] | null;
  strengths: string[] | null;
  cost_per_comparison: number | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      ai_models: {
        Row: AIModelRow;
        Insert: Omit<AIModelRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AIModelRow, 'id' | 'created_at'>>;
      };
      // ... other tables
    };
    Views: {
      active_ai_models: {
        Row: Omit<AIModelRow, 'created_at' | 'updated_at' | 'is_active'>;
      };
    };
    Functions: {
      get_blind_test_pair: {
        Args: {
          p_strategy?: 'SMART' | 'UNDERDOG' | 'TITANS' | 'OPEN_SOURCE';
        };
        Returns: {
          model1: AIModelRow;
          model2: AIModelRow;
        };
      };
    };
  };
}