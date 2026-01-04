-- Create pinned_tasks table for recurring daily tasks
CREATE TABLE IF NOT EXISTS pinned_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE pinned_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own pinned tasks
DROP POLICY IF EXISTS "Users can manage their own pinned tasks" ON pinned_tasks;
CREATE POLICY "Users can manage their own pinned tasks"
ON pinned_tasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
