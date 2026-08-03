DROP FUNCTION IF EXISTS public.delete_prompt_analysis(uuid, text);

DROP POLICY IF EXISTS "Anyone can create analyses" ON public.prompt_analyses;
DROP POLICY IF EXISTS "Anyone can read analyses" ON public.prompt_analyses;

REVOKE ALL ON public.prompt_analyses FROM anon;
REVOKE ALL ON public.prompt_analyses FROM authenticated;
GRANT ALL ON public.prompt_analyses TO service_role;

ALTER TABLE public.prompt_analyses ENABLE ROW LEVEL SECURITY;