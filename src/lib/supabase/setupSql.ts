// The setup script shown in Settings is the exact file in the repo root.
//
// Previous versions kept a second copy inline here, which drifted from the real
// script and left the in-app instructions describing policies that no longer
// matched what shipped. One source of truth avoids repeating that.
import setupSql from '../../../supabase-setup.sql?raw';

/** The full Supabase setup script, including RLS policies and migration notes. */
export const SETUP_SQL: string = setupSql;
