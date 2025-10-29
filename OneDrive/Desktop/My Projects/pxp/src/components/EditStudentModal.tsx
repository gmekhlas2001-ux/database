import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFieldPermissions, isFieldVisible, isFieldEditable } from '../hooks/useFieldPermissions';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  branches: any[];
}

export function EditStudentModal({ isOpen, onClose, onSubmit, formData, setFormData, branches }: EditStudentModalProps) {
  const { profile } = useAuth();
  const { student: studentPermissions } = useFieldPermissions();
  const isSuperAdmin = profile?.is_super_admin || false;

  if (!isOpen) return null;

  const canSee = (fieldName: string) => isFieldVisible(studentPermissions, fieldName, isSuperAdmin);
  const canEdit = (fieldName: string) => isFieldEditable(studentPermissions, fieldName, isSuperAdmin);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-slate-900">Edit Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {canSee('first_name') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  disabled={!canEdit('first_name')}
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('last_name') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  disabled={!canEdit('last_name')}
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('full_name') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit('full_name')}
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('father_name') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Father Name</label>
                <input
                  type="text"
                  disabled={!canEdit('father_name')}
                  value={formData.father_name || ''}
                  onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('email') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  disabled={!canEdit('email')}
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('national_id') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">National ID</label>
                <input
                  type="text"
                  disabled={!canEdit('national_id')}
                  value={formData.national_id || ''}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('passport_number') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Passport Number</label>
                <input
                  type="text"
                  disabled={!canEdit('passport_number')}
                  value={formData.passport_number || ''}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('phone') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  disabled={!canEdit('phone')}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('parent_phone') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Parent Phone</label>
                <input
                  type="tel"
                  disabled={!canEdit('parent_phone')}
                  value={formData.parent_phone || ''}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('age') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input
                  type="number"
                  disabled={!canEdit('age')}
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('gender') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  disabled={!canEdit('gender')}
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {canSee('dob') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  disabled={!canEdit('dob')}
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('education_level') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Education Level</label>
                <select
                  disabled={!canEdit('education_level')}
                  value={formData.education_level || ''}
                  onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Education Level</option>
                  <option value="Elementary School">Elementary School</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                  <option value="University">University</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {canSee('branch_id') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                <select
                  disabled={!canEdit('branch_id')}
                  value={formData.branch_id || ''}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}

            {canSee('date_joined') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Joined</label>
                <input
                  type="date"
                  disabled={!canEdit('date_joined')}
                  value={formData.date_joined || ''}
                  onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('date_left') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Left</label>
                <input
                  type="date"
                  disabled={!canEdit('date_left')}
                  value={formData.date_left || ''}
                  onChange={(e) => setFormData({ ...formData, date_left: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {canSee('status') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  disabled={!canEdit('status')}
                  value={formData.status || 'approved'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {canSee('address') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <textarea
                rows={2}
                disabled={!canEdit('address')}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {canSee('short_bio') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Short Bio</label>
              <textarea
                rows={2}
                disabled={!canEdit('short_bio')}
                value={formData.short_bio || ''}
                onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {canSee('notes') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                rows={2}
                disabled={!canEdit('notes')}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-200 -mx-6 -mb-6 px-6 py-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
