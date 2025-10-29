import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FieldPermission {
  field_name: string;
  is_visible_to_admin: boolean;
  is_editable_by_admin: boolean;
}

interface FieldPermissions {
  student: Record<string, FieldPermission>;
  staff: Record<string, FieldPermission>;
  loading: boolean;
}

export function useFieldPermissions(): FieldPermissions {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<{
    student: Record<string, FieldPermission>;
    staff: Record<string, FieldPermission>;
  }>({
    student: {},
    staff: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_super_admin) {
      setPermissions({
        student: {},
        staff: {},
      });
      setLoading(false);
      return;
    }

    loadPermissions();
  }, [profile]);

  async function loadPermissions() {
    try {
      const { data, error } = await supabase
        .from('field_permissions')
        .select('entity_type, field_name, is_visible_to_admin, is_editable_by_admin');

      if (error) throw error;

      const studentPerms: Record<string, FieldPermission> = {};
      const staffPerms: Record<string, FieldPermission> = {};

      data?.forEach((perm) => {
        const permission = {
          field_name: perm.field_name,
          is_visible_to_admin: perm.is_visible_to_admin,
          is_editable_by_admin: perm.is_editable_by_admin,
        };

        if (perm.entity_type === 'student') {
          studentPerms[perm.field_name] = permission;
        } else if (perm.entity_type === 'staff') {
          staffPerms[perm.field_name] = permission;
        }
      });

      setPermissions({
        student: studentPerms,
        staff: staffPerms,
      });
    } catch (error) {
      console.error('Error loading field permissions:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    ...permissions,
    loading,
  };
}

export function isFieldVisible(
  permissions: Record<string, FieldPermission>,
  fieldName: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  const perm = permissions[fieldName];
  return perm ? perm.is_visible_to_admin : true;
}

export function isFieldEditable(
  permissions: Record<string, FieldPermission>,
  fieldName: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  const perm = permissions[fieldName];
  return perm ? perm.is_editable_by_admin : true;
}
