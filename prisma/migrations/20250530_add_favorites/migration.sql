-- Create the favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_session_id UUID NOT NULL REFERENCES public.vote_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, vote_session_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own favorites
CREATE POLICY "Users can read their own favorites" ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);