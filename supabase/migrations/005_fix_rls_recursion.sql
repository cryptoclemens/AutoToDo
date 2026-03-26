-- ===================================================
-- Fix: Self-referential RLS recursion on workspace_members
-- Migration: 005_fix_rls_recursion.sql
--
-- The original "workspace_members_read" policy used a subquery
-- on workspace_members itself, causing infinite recursion.
-- Fix: allow users to read only their own membership rows.
-- Multi-member queries use the service_role client.
-- ===================================================

DROP POLICY IF EXISTS "workspace_members_read" ON workspace_members;

CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());
