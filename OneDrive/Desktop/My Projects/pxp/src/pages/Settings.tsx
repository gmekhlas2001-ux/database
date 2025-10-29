import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Lock, Unlock, Search } from 'lucide-react';

interface FieldPermission {
  id: string;
  entity_type: 'student' | 'staff';
  field_name: string;
  field_label: string;
  is_editable_by_admin: boolean;
  is_visible_to_admin: boolean;
}

export function Settings() {
  const { profile } = useAuth();
  const [studentFields, setStudentFields] = useState<FieldPermission[]>([]);
  const [staffFields, setStaffFields] = useState<FieldPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFieldPermissions();
  }, []);

  async function loadFieldPermissions() {
    try {
      const { data, error } = await supabase
        .from('field_permissions')
        .select('*')
        .order('field_label');

      if (error) throw error;

      setStudentFields(data?.filter(f => f.entity_type === 'student') || []);
      setStaffFields(data?.filter(f => f.entity_type === 'staff') || []);
    } catch (error) {
      console.error('Error loading field permissions:', error);
      showToast('Failed to load field permissions', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggleVisibility(fieldId: string, currentValue: boolean) {
    const fields = activeTab === 'student' ? studentFields : staffFields;
    const setFields = activeTab === 'student' ? setStudentFields : setStaffFields;

    const updatedFields = fields.map(f =>
      f.id === fieldId ? { ...f, is_visible_to_admin: !currentValue } : f
    );
    setFields(updatedFields);

    try {
      const { error } = await supabase
        .from('field_permissions')
        .update({ is_visible_to_admin: !currentValue })
        .eq('id', fieldId);

      if (error) throw error;
      showToast('Field visibility updated', 'success');
    } catch (error) {
      console.error('Error updating visibility:', error);
      showToast('Failed to update field visibility', 'error');
      setFields(fields);
    }
  }

  async function handleToggleEditable(fieldId: string, currentValue: boolean) {
    const fields = activeTab === 'student' ? studentFields : staffFields;
    const setFields = activeTab === 'student' ? setStudentFields : setStaffFields;

    const updatedFields = fields.map(f =>
      f.id === fieldId ? { ...f, is_editable_by_admin: !currentValue } : f
    );
    setFields(updatedFields);

    try {
      const { error } = await supabase
        .from('field_permissions')
        .update({ is_editable_by_admin: !currentValue })
        .eq('id', fieldId);

      if (error) throw error;
      showToast('Field editability updated', 'success');
    } catch (error) {
      console.error('Error updating editability:', error);
      showToast('Failed to update field editability', 'error');
      setFields(fields);
    }
  }

  if (!profile?.is_super_admin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">Only super admins can access settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-slate-600">Loading settings...</div>
      </div>
    );
  }

  const currentFields = activeTab === 'student' ? studentFields : staffFields;
  const filteredFields = currentFields.filter(field =>
    field.field_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.field_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Field Permissions</h1>
            <p className="text-slate-600">Control which fields admins can view and edit</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('student')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'student'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Student Fields
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Staff Fields
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search fields by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Field Name</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Visible to Admins</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Editable by Admins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No fields found matching your search.
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{field.field_label}</div>
                    <div className="text-sm text-slate-500">{field.field_name}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleVisibility(field.id, field.is_visible_to_admin)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        field.is_visible_to_admin
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {field.is_visible_to_admin ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hidden
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleEditable(field.id, field.is_editable_by_admin)}
                      disabled={!field.is_visible_to_admin}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        field.is_editable_by_admin
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {field.is_editable_by_admin ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Editable
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Locked
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Visible:</strong> Admins can see this field when viewing or editing records</li>
            <li>• <strong>Hidden:</strong> This field will not be displayed to admins</li>
            <li>• <strong>Editable:</strong> Admins can modify this field (only if visible)</li>
            <li>• <strong>Locked:</strong> Admins can see but cannot edit this field</li>
          </ul>
        </div>

      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
