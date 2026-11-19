import React, { useState } from 'react';
import { Book, Member, Loan, Reservation, LibrarySettings } from '../../types';
import { db } from '../../services/db';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Library,
  BookOpen,
  ArrowRightLeft,
  BookmarkCheck,
  CreditCard,
  Info,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  MapPin,
  Calendar,
  User,
  Shield,
  Sun,
  Moon,
  ChevronRight,
  Eye,
  Check,
  X,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { Modal } from '../common/Modal';

type ClientTab = 'catalogue' | 'loans' | 'reservations' | 'card' | 'info';

interface ClientPortalViewProps {
  books: Book[];
  loans: Loan[];
  members: Member[];
  settings: LibrarySettings;
  currentMember: Member;
  onSelectMember: (member: Member) => void;
  onSwitchToAdmin: () => void;
  onRefreshData: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  books,
  loans,
  members,
  settings,
  currentMember,
  onSelectMember,
  onSwitchToAdmin,
  onRefreshData,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState<ClientTab>('catalogue');
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);

  // Member's loans & reservations
  const memberLoans = loans.filter((l) => l.memberId === currentMember.id);
  const activeLoans = memberLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const pastLoans = memberLoans.filter((l) => l.status === 'returned');
  const memberReservations = db.getReservationsByMember(currentMember.id);

  // Categories
  const categories = Array.from(new Set(books.map((b) => b.category))).filter(Boolean);

  // Filter catalogue
  const filteredBooks = books.filter((b) => {
    const q = catalogueSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q);

    const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchAvail = !availabilityOnly || b.availableQuantity > 0;

    return matchSearch && matchCategory && matchAvail;
  });

  // Action: Prolonger mon prêt
  const handleRenewMyLoan = (loanId: string) => {
    try {
      const renewed = db.renewLoan(loanId, settings.renewalDurationDays || 14);
      addToast(
        'success',
        `Votre prêt a été prolongé jusqu'au ${renewed.dueDate}.`,
        'Prolongation confirmée'
      );
      onRefreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Impossible de prolonger ce prêt.', 'Erreur');
    }
  };

  // Action: Réserver un livre
  const handleReserveBook = (book: Book) => {
    try {
      db.createReservation(currentMember.id, book.id);
      addToast(
        'success',
        `Votre réservation pour « ${book.title} » est enregistrée.`,
        'Réservation validée'
      );
      setSelectedBookDetail(null);
      onRefreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la réservation.', 'Attention');
    }
  };

  // Action: Annuler réservation
  const handleCancelReservation = (resId: string) => {
    try {
      db.cancelReservation(resId);
      addToast('info', 'Réservation annulée.', 'Réservation retirée');
      onRefreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur.', 'Erreur');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysLeft = (dueDate: string) => {
    const today = new Date(todayStr);
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Bar for Client Portal */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Client Mode Pill */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                  BiblioTech
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Portail Public & Espace Lecteur
                </span>
              </div>
            </div>

            {/* Switch to Admin button (compact on mobile) */}
            <button
              onClick={onSwitchToAdmin}
              className="sm:hidden px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin</span>
            </button>
          </div>

          {/* Member Profile Switcher & Actions */}
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
            {/* Active Member Selection */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-slate-500 text-[11px] hidden md:inline">Lecteur :</span>
              <select
                value={currentMember.id}
                onChange={(e) => {
                  const m = members.find((x) => x.id === e.target.value);
                  if (m) onSelectMember(m);
                }}
                className="bg-transparent font-semibold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer text-xs"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                    {m.fullName} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le thème"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Switch back to Manager / Admin */}
            <button
              onClick={onSwitchToAdmin}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Retourner à l'interface de gestion administrative"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Espace Gestionnaire</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Ribbon for Reader */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white py-6 px-4 md:px-8 border-b border-indigo-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Bienvenue sur votre Espace Adhérent
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Carte Active</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
              Bonjour, {currentMember.fullName}
            </h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Consultez le catalogue de la bibliothèque, suivez vos emprunts en cours, prolongez vos dates de restitution et réservez des ouvrages en quelques clics.
            </p>
          </div>

          {/* Quick Reader Badges */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <span className="text-[10px] text-indigo-200 block">Mes Prêts Actifs</span>
              <span className="text-lg font-bold font-mono text-white">
                {activeLoans.length} / {settings.maxBooksPerUser || (settings as any).maxBooksPerMember || 5}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <span className="text-[10px] text-indigo-200 block">Réservations</span>
              <span className="text-lg font-bold font-mono text-white">
                {memberReservations.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Reader */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 sticky top-15 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2">
          {[
            { id: 'catalogue', label: 'Catalogue des Livres', icon: <BookOpen className="w-4 h-4" /> },
            {
              id: 'loans',
              label: 'Mes Emprunts',
              icon: <ArrowRightLeft className="w-4 h-4" />,
              badge: activeLoans.length > 0 ? activeLoans.length : undefined,
            },
            {
              id: 'reservations',
              label: 'Mes Réservations',
              icon: <BookmarkCheck className="w-4 h-4" />,
              badge: memberReservations.length > 0 ? memberReservations.length : undefined,
            },
            { id: 'card', label: 'Ma Carte de Lecteur', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'info', label: 'Horaires & Guide', icon: <Info className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ClientTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* TAB 1: CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div className="space-y-6">
            {/* Filter bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, auteur, genre ou ISBN..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="w-full md:w-56">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="all">Tous les genres</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={availabilityOnly}
                  onChange={(e) => setAvailabilityOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium whitespace-nowrap">Disponibles immédiatement</span>
              </label>
            </div>

            {/* Books Grid for Clients */}
            {filteredBooks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold">Aucun ouvrage trouvé</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Essayez un autre mot-clé ou réinitialisez vos filtres.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableQuantity > 0;
                  const isReservedByMe = memberReservations.some((r) => r.bookId === book.id);

                  return (
                    <div
                      key={book.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col group"
                    >
                      {/* Book Cover */}
                      <div className="relative h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen className="w-10 h-10" />
                          </div>
                        )}

                        {/* Availability Pill */}
                        <div className="absolute top-3 right-3">
                          {isAvailable ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Disponible ({book.availableQuantity})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-600 text-white shadow-sm">
                              En prêt
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {book.category}
                          </span>
                          <h3
                            onClick={() => setSelectedBookDetail(book)}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-1 mt-0.5"
                          >
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {book.author} · {book.publicationYear}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed italic">
                            « {book.description || 'Ouvrage disponible au catalogue.'} »
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            {book.location || 'Rayon principal'}
                          </span>
                          <span className="font-mono text-[11px]">
                            ISBN: {book.isbn.slice(0, 10)}...
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedBookDetail(book)}
                            className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            Détails
                          </button>

                          {isReservedByMe ? (
                            <span className="py-2 px-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Réservé
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReserveBook(book)}
                              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                isAvailable
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              }`}
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              {isAvailable ? 'Réserver' : 'Mettre de côté'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MES EMPRUNTS */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Mes Livres en Cours d'Emprunt ({activeLoans.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consultez les dates limites de restitution et prolongez vos prêts avant l'échéance.
                </p>
              </div>
            </div>

            {activeLoans.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Vous n'avez aucun livre à retourner actuellement !
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tous vos ouvrages précédents ont été restitués en temps et en heure. Explorez le catalogue pour trouver votre prochaine lecture.
                </p>
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Découvrir le catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const daysLeft = getDaysLeft(loan.dueDate);
                  const isOverdue = loan.status === 'overdue' || daysLeft < 0;

                  return (
                    <div
                      key={loan.id}
                      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isOverdue
                          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {loan.bookCoverUrl ? (
                          <img
                            src={loan.bookCoverUrl}
                            alt=""
                            className="w-12 h-16 object-cover rounded-lg shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-slate-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {loan.bookTitle}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ISBN: {loan.bookIsbn} · Emprunté le {loan.loanDate}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : daysLeft <= 3
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isOverdue
                                ? `En retard de ${Math.abs(daysLeft)} jour(s)`
                                : daysLeft === 0
                                ? "À rendre aujourd'hui"
                                : `Plus que ${daysLeft} jour(s)`}
                            </span>
                            <span className="text-xs text-slate-400">
                              (Date limite : <strong className="font-mono">{loan.dueDate}</strong>)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                        <button
                          onClick={() => handleRenewMyLoan(loan.id)}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Prolonger de 14j
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Past Returns History */}
            {pastLoans.length > 0 && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Historique de mes retours passés ({pastLoans.length})
                </h3>
                <div className="space-y-2">
                  {pastLoans.slice(0, 5).map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {l.bookTitle}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">
                        Restitué le {l.returnDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MES RÉSERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Mes Réservations en Cours ({memberReservations.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez l'état de préparation de vos livres réservés pour retrait à l'accueil.
              </p>
            </div>

            {memberReservations.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookmarkCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold">Aucune réservation en cours</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Vous pouvez réserver des ouvrages directement depuis le catalogue pour les mettre de côté.
                </p>
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Parcourir le catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {memberReservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {res.bookCoverUrl ? (
                        <img
                          src={res.bookCoverUrl}
                          alt=""
                          className="w-10 h-14 object-cover rounded-md shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {res.bookTitle}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              res.status === 'ready'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {res.status === 'ready' ? 'Prêt à être retiré' : 'En attente de retour'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Réservé le {res.reservationDate} · Réf {res.id}
                        </p>
                        {res.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">{res.notes}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelReservation(res.id)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      Annuler la réservation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MA CARTE DE LECTEUR */}
        {activeTab === 'card' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">
                Ma Carte d'Adhérent Dématérialisée
              </h2>
              <p className="text-xs text-slate-500 text-center mt-0.5">
                Présentez ce code lors de vos passages aux bornes automatiques ou au comptoir d'accueil.
              </p>
            </div>

            {/* Realistic Digital Membership Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
              {/* Background watermark icon */}
              <Library className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-56">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      BT
                    </div>
                    <div>
                      <span className="font-bold text-sm tracking-wide block">BIBLIOTECH</span>
                      <span className="text-[10px] text-indigo-300">CARTE DE LECTEUR OFFICIELLE</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ADHERENT ACTIF
                  </span>
                </div>

                {/* Member Info */}
                <div className="space-y-1">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {currentMember.fullName}
                  </p>
                  <p className="text-xs text-indigo-200 flex items-center gap-2">
                    <span>N° {currentMember.id}</span>
                    <span>·</span>
                    <span>Inscrit le {currentMember.membershipDate}</span>
                  </p>
                </div>

                {/* Simulated Barcode */}
                <div className="pt-2 border-t border-white/10 flex items-end justify-between">
                  <div>
                    {/* CSS Barcode pattern */}
                    <div className="flex items-end gap-[2px] h-7 bg-white/90 p-1 rounded-sm w-44">
                      {[4, 2, 5, 1, 3, 2, 4, 1, 5, 3, 2, 4, 1, 3, 5, 2, 4, 1, 3].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h * 4 + 8}px` }}
                          className={`w-[2px] bg-slate-900 ${i % 3 === 0 ? 'w-[3px]' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-indigo-200 mt-1 block">
                      *{currentMember.id.replace('-', '')}*
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-indigo-300 block">Quota d'emprunt</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {activeLoans.length}/{settings.maxBooksPerUser || (settings as any).maxBooksPerMember || 5} livres
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Member Details list */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email enregistré :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMember.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Téléphone :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMember.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Adresse :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMember.address || 'Non renseignée'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HORAIRES & INFOS */}
        {activeTab === 'info' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Informations Pratiques & Règlement des Prêts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tout ce qu'il faut savoir pour profiter pleinement des services de votre bibliothèque.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-indigo-600 font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  Horaires d'Ouverture
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="font-medium">Mardi - Vendredi :</span>
                    <span className="font-mono">10h00 - 19h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Samedi :</span>
                    <span className="font-mono">10h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dimanche - Lundi :</span>
                    <span>Fermé au public</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-indigo-600 font-bold text-sm">
                  <Building className="w-4 h-4" />
                  Localisation & Contact
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {settings.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {settings.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {settings.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Règles */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Conditions de Prêt & Prolongation
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed">
                <li>
                  Chaque adhérent peut emprunter jusqu'à <strong>{settings.maxBooksPerUser || (settings as any).maxBooksPerMember || 5} livres</strong> simultanément.
                </li>
                <li>
                  La durée initiale de prêt est de <strong>{settings.defaultBorrowDurationDays || (settings as any).defaultLoanDurationDays || 21} jours</strong>.
                </li>
                <li>
                  Une prolongation de <strong>{settings.renewalDurationDays} jours</strong> est autorisée en ligne avant la date limite.
                </li>
                <li>
                  En cas de retard, merci de rapporter les exemplaires dès que possible afin de libérer l'accès aux autres lecteurs.
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Book Detail Modal in Client View */}
      {selectedBookDetail && (
        <Modal
          isOpen={!!selectedBookDetail}
          onClose={() => setSelectedBookDetail(null)}
          title={selectedBookDetail.title}
          subtitle={`Par ${selectedBookDetail.author} · ${selectedBookDetail.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-28 h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 mx-auto sm:mx-0 shadow-sm">
                {selectedBookDetail.coverUrl ? (
                  <img
                    src={selectedBookDetail.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold ${
                      selectedBookDetail.availableQuantity > 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {selectedBookDetail.availableQuantity > 0
                      ? `En rayon (${selectedBookDetail.availableQuantity} disponible)`
                      : 'Actuellement en prêt'}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  « {selectedBookDetail.description || 'Ouvrage du fonds documentaire.'} »
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Emplacement</span>
                    <span className="font-semibold">{selectedBookDetail.location}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Éditeur</span>
                    <span className="font-semibold">{selectedBookDetail.publisher} ({selectedBookDetail.publicationYear})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleReserveBook(selectedBookDetail)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                {selectedBookDetail.availableQuantity > 0
                  ? 'Réserver pour retrait'
                  : 'Mettre en réservation pour le prochain retour'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
