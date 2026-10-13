ALTER TABLE public.users ADD COLUMN auth_user_id uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.owns_course(_course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c JOIN public.users u ON u.id = c.user_id
    WHERE c.id = _course_id AND u.auth_user_id = auth.uid() AND auth.uid() IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users SET auth_user_id = NEW.id
   WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL;
  IF NOT FOUND THEN
    INSERT INTO public.users (full_name, email, auth_user_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email, NEW.id)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "demo read users" ON public.users;
DROP POLICY IF EXISTS "demo read courses" ON public.courses;
DROP POLICY IF EXISTS "demo all tasks" ON public.tasks;

REVOKE ALL ON public.users, public.courses, public.tasks FROM anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses, public.tasks TO authenticated;
GRANT ALL ON public.users, public.courses, public.tasks TO service_role;

CREATE POLICY "own profile read" ON public.users FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "own profile update" ON public.users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "own courses read" ON public.courses FOR SELECT TO authenticated USING (user_id = public.current_app_user_id());
CREATE POLICY "own courses insert" ON public.courses FOR INSERT TO authenticated WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY "own courses update" ON public.courses FOR UPDATE TO authenticated
  USING (user_id = public.current_app_user_id()) WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY "own courses delete" ON public.courses FOR DELETE TO authenticated USING (user_id = public.current_app_user_id());

CREATE POLICY "own tasks read" ON public.tasks FOR SELECT TO authenticated USING (public.owns_course(course_id));
CREATE POLICY "own tasks insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.owns_course(course_id));
CREATE POLICY "own tasks update" ON public.tasks FOR UPDATE TO authenticated
  USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));
CREATE POLICY "own tasks delete" ON public.tasks FOR DELETE TO authenticated USING (public.owns_course(course_id));