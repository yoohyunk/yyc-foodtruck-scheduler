-- Fix the employee deletion RLS policy
-- The current policy is incorrect - it checks if the employee being deleted is admin
-- It should check if the CURRENT USER is admin

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Only admin can delete employees" ON employees;

-- Create the correct policy
CREATE POLICY "Only admin can delete employees" ON employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
      AND e.is_available = true
      AND NOT e.is_pending
    )
  );

-- Also ensure the related table policies allow admin deletion
-- These should already exist from your RLS script, but verify:

-- Wage deletion
DROP POLICY IF EXISTS "Admin can delete wage" ON wage;
CREATE POLICY "Admin can delete wage" ON wage
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
    )
  );

-- Assignment deletion  
DROP POLICY IF EXISTS "Admin can delete assignments" ON assignments;
CREATE POLICY "Admin can delete assignments" ON assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
    )
  );

-- Truck assignment deletion
DROP POLICY IF EXISTS "Admin can delete truck_assignment" ON truck_assignment;
CREATE POLICY "Admin can delete truck_assignment" ON truck_assignment
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
    )
  );

-- Time off request deletion
DROP POLICY IF EXISTS "Only admin can delete time off request" ON time_off_request;
CREATE POLICY "Only admin can delete time off request" ON time_off_request
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
    )
  );

-- Address deletion (admin only)
DROP POLICY IF EXISTS "Allow delete for admin only" ON addresses;
CREATE POLICY "Allow delete for admin only" ON addresses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.employee_type = 'Admin'
    )
  );
