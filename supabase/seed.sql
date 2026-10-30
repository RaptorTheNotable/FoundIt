-- ==============================================================================
-- FoundIt: Smart Campus Lost & Found Platform
-- Seed Data: Campus Locations
-- ==============================================================================

INSERT INTO public.campus_locations (id, name, slug, building_code, is_active)
VALUES
  ('central-library', 'Central Library (1st & 2nd Floor)', 'central-library', 'LIB-01', true),
  ('auditorium-complex', 'Main Auditorium Complex', 'auditorium-complex', 'AUD-01', true),
  ('engineering-block-a', 'Engineering Block A (Labs & Classrooms)', 'engineering-block-a', 'ENG-A', true),
  ('engineering-block-b', 'Engineering Block B (Workshops)', 'engineering-block-b', 'ENG-B', true),
  ('student-center', 'Student Center & Food Court', 'student-center', 'SAC-01', true),
  ('sports-arena', 'Sports Arena & Gymnasium', 'sports-arena', 'SPT-01', true),
  ('science-complex', 'Science & Research Complex', 'science-complex', 'SCI-01', true),
  ('administrative-block', 'Administrative Block', 'administrative-block', 'ADM-01', true),
  ('hostel-block-boys', 'Hostel Quadrangle (Boys)', 'hostel-block-boys', 'HST-B', true),
  ('hostel-block-girls', 'Hostel Quadrangle (Girls)', 'hostel-block-girls', 'HST-G', true),
  ('campus-shuttle-stops', 'North & South Shuttle Terminals', 'campus-shuttle-stops', 'TRN-01', true)
ON CONFLICT (id) DO NOTHING;

