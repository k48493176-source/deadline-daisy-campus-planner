CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  major text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  instructor text,
  color text NOT NULL DEFAULT 'sage',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.courses, public.tasks TO anon, authenticated;
GRANT ALL ON public.users, public.courses, public.tasks TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read users" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo read courses" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo all tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.users (id, full_name, email, major) VALUES
('11111111-1111-1111-1111-111111111111','Maya Okafor','maya.okafor@university.edu','Computer Science');
INSERT INTO public.courses (id, user_id, code, name, instructor, color) VALUES
('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','CS 301','Data Structures & Algorithms','Dr. Elena Park','sage'),
('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','MATH 240','Linear Algebra','Prof. James Reyes','clay'),
('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','PSYC 110','Intro to Psychology','Dr. Aisha Bello','sky'),
('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','ENGL 205','Modern American Literature','Prof. Tom Whitaker','plum');
INSERT INTO public.tasks (course_id, title, description, due_date, priority, completed) VALUES
('a0000000-0000-0000-0000-000000000001','Binary search tree implementation','Insert, delete, and in-order traversal in Java.', now() + interval '2 days','high',false),
('a0000000-0000-0000-0000-000000000001','Problem set 5: graphs','BFS/DFS and Dijkstra exercises.', now() + interval '6 days','medium',false),
('a0000000-0000-0000-0000-000000000001','Quiz 3 review','', now() - interval '3 days','low',true),
('a0000000-0000-0000-0000-000000000002','Homework 7: eigenvalues','Sections 5.1–5.3, odd problems.', now() + interval '1 day','high',false),
('a0000000-0000-0000-0000-000000000002','Midterm exam','Chapters 1–5. Bring a calculator.', now() + interval '9 days','high',false),
('a0000000-0000-0000-0000-000000000003','Reading response: memory','Two pages on chapter 7.', now() - interval '1 day','medium',false),
('a0000000-0000-0000-0000-000000000003','Research participation hours','Complete 2 study credits.', now() + interval '14 days','low',false),
('a0000000-0000-0000-0000-000000000004','Essay draft: The Great Gatsby','1500 words on symbolism.', now() + interval '4 days','medium',false),
('a0000000-0000-0000-0000-000000000004','Discussion post week 6','', now() - interval '5 days','low',true);