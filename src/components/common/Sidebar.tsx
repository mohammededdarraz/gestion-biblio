import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowRightLeft,
  RotateCcw,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  Library,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export type NavTab =
  | 'dashboard'
  | 'books'
  | 'members'
  | 'loans'
  | 'returns'
  | 'overdue'
  | 'stats'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSwitchToClientMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onSwitchToClientMode,
}) => {
  const { user, logout, switchUser, isAdmin } = useAuth();
  const { notifications } = useNotification();

  const overdueCount = notifications.filter((n) => n.type === 'overdue').length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'books',
      label: 'Livres',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'members',
      label: 'Adhérents',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'loans',
      label: 'Emprunts',
      icon: <ArrowRightLeft className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'returns',
      label: 'Retours',
      icon: <RotateCcw className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'overdue',
      label: 'Retards',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      id: 'stats',
      label: 'Statistiques',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              BiblioTech
            </span>
            <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Gestion de Bibliothèque
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mode Client Quick Switch */}
        {onSwitchToClientMode && (
          <div className="px-3 pb-2 shrink-0">
            <button
              onClick={() => {
                onSwitchToClientMode();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
            >
              <div className="flex items-center gap-2">
                <Library className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Espace Lecteur / Client</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-500 uppercase">Voir →</span>
            </button>
          </div>
        )}

        {/* User Profile & Role Switcher */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Utilisateur'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                    <UserCheck className="w-3 h-3" />
                    Bibliothécaire
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick role toggle & logout */}
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={() => switchUser(isAdmin ? 'librarian' : 'admin')}
              className="flex-1 px-2 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors text-center truncate"
              title="Changer rapidement de rôle pour tester les droits"
            >
              Mode: {isAdmin ? 'Admin' : 'Biblio'}
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
