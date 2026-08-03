DROP POLICY "Anyone can delete analyses" ON public.prompt_analyses;
REVOKE DELETE ON public.prompt_analyses FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_prompt_analysis(_id UUID, _session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted INTEGER;
BEGIN
  DELETE FROM public.prompt_analyses
  WHERE id = _id AND session_id = _session_id;
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_prompt_analysis(UUID, TEXT) TO anon, authenticated, service_role;