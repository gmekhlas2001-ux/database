import { useState, useEffect } from 'react';
import { Building2, CheckCircle, XCircle, Eye, Mail, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PendingOrganization {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  password_hash: string;
  phone: string | null;
  address: string | null;
  requested_at: string;
  notes: string | null;
}

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export function PXPAdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganization | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!profile?.is_pxp_admin) {
      navigate('/dashboard');
      return;
    }

    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [pendingRes, orgsRes] = await Promise.all([
        supabase
          .from('organization_pending_approvals')
          .select('*')
          .order('requested_at', { ascending: false }),
        supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (pendingRes.error) throw pendingRes.error;
      if (orgsRes.error) throw orgsRes.error;

      setPendingOrgs(pendingRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(org: PendingOrganization) {
    setApproving(true);
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: org.email,
        password: org.password_hash,
        options: {
          data: {
            full_name: `${org.name} Admin`,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('User creation failed');

      const seoTitle = `${org.name} - School Management System`;
      const seoDescription = `Comprehensive school management platform for ${org.name}, managing students, staff, classrooms, library, and more.`;
      const seoKeywords = `${org.name}, school management, education, student management, classroom management`;

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: org.name,
          subdomain: org.subdomain,
          email: org.email,
          status: 'active',
          seo_title: seoTitle,
          seo_description: seoDescription,
          seo_keywords: seoKeywords,
          approved_at: new Date().toISOString(),
          approved_by: profile?.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: newOrg.id,
          role_id: 'admin',
          is_super_admin: true,
          status: 'approved',
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: deleteError } = await supabase
        .from('organization_pending_approvals')
        .delete()
        .eq('id', org.id);

      if (deleteError) throw deleteError;

      alert(`Organization "${org.name}" has been approved successfully!`);
      setSelectedOrg(null);
      loadData();
    } catch (error: any) {
      alert('Error approving organization: ' + error.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(org: PendingOrganization) {
    if (!confirm(`Are you sure you want to reject "${org.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('organization_pending_approvals')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      alert(`Organization "${org.name}" has been rejected.`);
      setSelectedOrg(null);
      loadData();
    } catch (error: any) {
      alert('Error rejecting organization: ' + error.message);
    }
  }

  if (!profile?.is_pxp_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">PXP Admin Dashboard</h1>
              <p className="text-slate-600">Manage organization registrations and approvals</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {pendingOrgs.length}
            </div>
            <div className="text-sm text-slate-600">Pending Approvals</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {organizations.filter(o => o.status === 'active').length}
            </div>
            <div className="text-sm text-slate-600">Active Organizations</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {organizations.length}
            </div>
            <div className="text-sm text-slate-600">Total Organizations</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Approvals</h2>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : pendingOrgs.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                No pending approvals
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{org.name}</h3>
                        <p className="text-sm text-slate-600 font-mono">
                          {org.subdomain}.pxpmanagement.es
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{org.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(org.requested_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(org)}
                        disabled={approving}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(org)}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">All Organizations</h2>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="bg-white rounded-xl border border-slate-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{org.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          org.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {org.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-mono mb-2">
                      {org.subdomain}.pxpmanagement.es
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{org.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedOrg && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Organization Details</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <p className="text-slate-900 font-semibold">{selectedOrg.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                  <p className="text-slate-900 font-mono">{selectedOrg.subdomain}.pxpmanagement.es</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <p className="text-slate-900">{selectedOrg.email}</p>
                </div>

                {selectedOrg.phone && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <p className="text-slate-900">{selectedOrg.phone}</p>
                  </div>
                )}

                {selectedOrg.address && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <p className="text-slate-900">{selectedOrg.address}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requested</label>
                  <p className="text-slate-900">{new Date(selectedOrg.requested_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(selectedOrg)}
                  disabled={approving}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve Organization'}
                </button>
                <button
                  onClick={() => handleReject(selectedOrg)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
