import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, LayoutDashboard, Users, UserCheck, Building2, GraduationCap, Library, FileText, Bell, LogOut, Menu, X, CheckCircle, CircleUser as UserCircle, Award, TrendingUp, Settings, Languages } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'librarian', 'student'] },
    { path: '/approvals', labelKey: 'nav.approvals', icon: CheckCircle, roles: ['admin'] },
    { path: '/staff', labelKey: 'nav.staff', icon: UserCheck, roles: ['admin'] },
    { path: '/students', labelKey: 'nav.students', icon: Users, roles: ['admin'] },
    { path: '/branches', labelKey: 'nav.branches', icon: Building2, roles: ['admin'] },
    { path: '/classrooms', labelKey: 'nav.classrooms', icon: GraduationCap, roles: ['admin', 'teacher', 'student'] },
    { path: '/exams', labelKey: 'nav.exams', icon: Award, roles: ['admin', 'teacher'] },
    { path: '/grades', labelKey: 'nav.grades', icon: TrendingUp, roles: ['student'] },
    { path: '/libraries/books', labelKey: 'nav.library', icon: Library, roles: ['admin', 'teacher', 'librarian', 'student'] },
    { path: '/reports', labelKey: 'nav.reports', icon: FileText, roles: ['admin'] },
    { path: '/settings', labelKey: 'nav.settings', icon: Settings, roles: ['admin'], superAdminOnly: true },
    { path: '/profile', labelKey: 'nav.profile', icon: UserCircle, roles: ['admin', 'teacher', 'librarian', 'student'] },
  ];

  const visibleNavItems = navItems.filter((item) => {
    const hasRole = item.roles.includes(profile?.role_id || '');
    if (item.superAdminOnly) {
      return hasRole && profile?.is_super_admin === true;
    }
    return hasRole;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo-ponts-per-la-pau-web.png" alt="Ponts per la Pau" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-900">PXP</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <img src="/logo-ponts-per-la-pau-web.png" alt="Ponts per la Pau" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="font-bold text-slate-900">PXP</h1>
                <p className="text-xs text-slate-500">Ponts per la Pau</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role_id}</p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="mt-4 relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Languages className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">
                    {language === 'en' && 'English'}
                    {language === 'es' && 'Español'}
                    {language === 'ca' && 'Català'}
                  </span>
                </div>
              </button>
              {showLangMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg ${language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLanguage('es'); setShowLangMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${language === 'es' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => { setLanguage('ca'); setShowLangMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors last:rounded-b-lg ${language === 'ca' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                  >
                    Català
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="pt-20 lg:pt-0 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
