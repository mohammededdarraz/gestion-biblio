import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  PlusCircle,
  X,
  BookOpen,
  User,
  ArrowRightLeft,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { NavTab } from './Sidebar';
import { db } from '../../services/db';
import { Book, Member, Loan } from '../../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenNewLoanModal: () => void;
  onSelectBook?: (book: Book) => void;
  onSelectMember?: (member: Member) => void;
  onSelectLoan?: (loan: Loan) => void;
  onSwitchToClientMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onNavigate,
  onOpenNewLoanModal,
  onSelectBook,
  onSelectMember,
  onSwitchToClientMode,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering
  const q = searchQuery.trim().toLowerCase();
  const books = q.length >= 2 ? db.getBooks().filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const members = q.length >= 2 ? db.getMembers().filter(
    (m) =>
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q)
  ).slice(0, 3) : [];

  const loans = q.length >= 2 ? db.getLoans().filter(
    (l) =>
      l.id.toLowerCase().includes(q) ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.memberName.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const hasSearchResults = books.length > 0 || members.length > 0 || loans.length > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile burger + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Recherche globale (livre, auteur, ISBN, adhérent, emprunt)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 max-h-96 overflow-y-auto">
              {!hasSearchResults ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucun résultat trouvé pour « {searchQuery} »
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Livres */}
                  {books.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" /> Livres ({books.length})
                      </div>
                      <div className="space-y-0.5">
                        {books.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              onNavigate('books');
                              onSelectBook?.(b);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {b.title}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500">·</span>
                              <span className="text-slate-500 dark:text-slate-400 truncate">
                                {b.author}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 ml-2 shrink-0">
                              {b.availableQuantity}/{b.totalQuantity} dispo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adhérents */}
                  {members.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Adhérents ({members.length})
                      </div>
                      <div className="space-y-0.5">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              onNavigate('members');
                              onSelectMember?.(m);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs"
                          >
                            <div className="truncate">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {m.fullName}
                              </span>
                              <span className="text-slate-400 ml-2 text-[11px]">{m.email}</span>
                            </div>
                            <span
                              className={`text-[10px] font-medium shrink-0 ml-2 ${
                                m.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {m.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emprunts */}
                  {loans.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3" /> Emprunts ({loans.length})
                      </div>
                      <div className="space-y-0.5">
                        {loans.map((l) => (
                          <div
                            key={l.id}
                            onClick={() => {
                              onNavigate(l.status === 'overdue' ? 'overdue' : 'loans');
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs"
                          >
                            <div className="truncate">
                              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mr-2">
                                {l.id}
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {l.bookTitle}
                              </span>
                              <span className="text-slate-400 ml-1">({l.memberName})</span>
                            </div>
                            <span
                              className={`text-[10px] font-medium shrink-0 ml-2 ${
                                l.status === 'overdue'
                                  ? 'text-rose-600'
                                  : l.status === 'returned'
                                  ? 'text-slate-400'
                                  : 'text-amber-600'
                              }`}
                            >
                              {l.status === 'overdue'
                                ? 'En retard'
                                : l.status === 'returned'
                                ? 'Retourné'
                                : 'En cours'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick actions, notifications, theme toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Primary Action Button */}
        <button
          onClick={onOpenNewLoanModal}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-medium transition-colors shadow-xs shadow-indigo-600/30 whitespace-nowrap cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvel Emprunt</span>
          <span className="sm:hidden">Emprunt</span>
        </button>

        {/* Switch to Client Mode Button */}
        {onSwitchToClientMode && (
          <button
            onClick={onSwitchToClientMode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs md:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title="Basculer vers l'espace public adhérent / lecteur"
          >
            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Mode Client</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Voir les notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    Notifications & Alertes
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Aucune alerte pour le moment. Tout est en ordre !
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.linkTab) onNavigate(notif.linkTab as NavTab);
                        setIsNotifOpen(false);
                      }}
                      className={`py-3 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors ${
                        !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            notif.type === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : notif.type === 'due_soon'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
