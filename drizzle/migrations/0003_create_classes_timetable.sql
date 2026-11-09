CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT classes_end_after_start CHECK (end_time > start_time)
);
CREATE INDEX classes_course_id_idx ON public.classes(course_id);
REVOKE ALL ON public.classes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own classes read" ON public.classes FOR SELECT TO authenticated USING (public.owns_course(course_id));
CREATE POLICY "own classes insert" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.owns_course(course_id));
CREATE POLICY "own classes update" ON public.classes FOR UPDATE TO authenticated USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));
CREATE POLICY "own classes delete" ON public.classes FOR DELETE TO authenticated USING (public.owns_course(course_id));