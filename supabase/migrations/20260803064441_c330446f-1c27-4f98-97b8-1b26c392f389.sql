CREATE TABLE public.prompt_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  score INTEGER NOT NULL,
  complexity TEXT NOT NULL,
  model TEXT NOT NULL,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX prompt_analyses_session_created_idx ON public.prompt_analyses (session_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.prompt_analyses TO anon;
GRANT SELECT, INSERT, DELETE ON public.prompt_analyses TO authenticated;
GRANT ALL ON public.prompt_analyses TO service_role;

ALTER TABLE public.prompt_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read analyses" ON public.prompt_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can create analyses" ON public.prompt_analyses FOR INSERT WITH CHECK (char_length(session_id) BETWEEN 8 AND 64);
CREATE POLICY "Anyone can delete analyses" ON public.prompt_analyses FOR DELETE USING (true);