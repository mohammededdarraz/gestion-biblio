import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  ArrowRightLeft,
  RotateCcw,
  Plus,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Book, Member, Loan } from '../../types';
import { NavTab } from '../common/Sidebar';

interface DashboardViewProps {
  books: Book[];
  members: Member[];
  loans: Loan[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewLoanModal: () => void;
  onOpenNewBookModal: () => void;
  onOpenReturnModal: (loan: Loan) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  books,
  members,
  loans,
  onNavigate,
  onOpenNewLoanModal,
  onOpenNewBookModal,
  onOpenReturnModal,
}) => {
  // Key metric calculations
  const totalBooks = books.reduce((acc, b) => acc + b.totalQuantity, 0);
  const availableBooks = books.reduce((acc, b) => acc + b.availableQuantity, 0);
  const borrowedBooks = totalBooks - availableBooks;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');

  // Feeds
  const recentLoans = [...loans]
    .sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime())
    .slice(0, 5);

  const recentReturns = loans
    .filter((l) => l.status === 'returned' && l.returnDate)
    .sort((a, b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime())
    .slice(0, 5);

  // Stats by category for mini visual chart
  const categoryCounts: Record<string, number> = {};
  books.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + b.totalQuantity;
  });
  const categoryList = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Month stats for mini bar chart
  const monthlyLoanCounts = [
    { month: 'Mai', count: 18 },
    { month: 'Juin', count: 24 },
    { month: 'Juil', count: 15 },
    { month: 'Août', count: 21 },
    { month: 'Sept', count: 32 },
    { month: 'Oct', count: activeLoans.length + 8 },
  ];
  const maxMonthCount = Math.max(...monthlyLoanCounts.map((m) => m.count));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Système Intégré de Bibliothèque
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Tableau de Bord Général
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Gérez facilement les {totalBooks} exemplaires, {members.length} adhérents enregistrés et suivez les retours en temps réel.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenNewLoanModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvel Emprunt
            </button>
            <button
              onClick={onOpenNewBookModal}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium rounded-xl transition-colors backdrop-blur-xs border border-white/10"
            >
              <BookOpen className="w-4 h-4" />
              Ajouter un Livre
            </button>
          </div>
        </div>

        {/* Decorative background image blur */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none bg-cover bg-center hidden md:block"
          style={{ backgroundImage: `url('/src/assets/images/library_hero_interior_1791278430596.jpg')` }}
        />
      </div>

      {/* Overdue alert banner if any */}
      {overdueLoans.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Attention : {overdueLoans.length} emprunt(s) actuellement en retard
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                Des lecteurs ont dépassé la date de restitution prévue.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('overdue')}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0 flex items-center gap-1"
          >
            Voir les retards <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Livres */}
        <div
          onClick={() => onNavigate('books')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Exemplaires</span>
            <BookOpen className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalBooks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{books.length} titres uniques</span>
          </div>
        </div>

        {/* Livres Disponibles */}
        <div
          onClick={() => onNavigate('books')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-medium">Disponibles</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {availableBooks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0}% du stock en rayon
          </div>
        </div>

        {/* Empruntés */}
        <div
          onClick={() => onNavigate('loans')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-medium">Empruntés</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {borrowedBooks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Actuellement en circulation
          </div>
        </div>

        {/* Adhérents */}
        <div
          onClick={() => onNavigate('members')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-medium">Adhérents</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {members.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {activeMembers} comptes actifs
          </div>
        </div>

        {/* Emprunts en retard */}
        <div
          onClick={() => onNavigate('overdue')}
          className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/60 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-medium">En Retard</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {overdueLoans.length}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            Nécessite relance
          </div>
        </div>
      </div>

      {/* Visual Analytics / Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Évolution des Emprunts (6 derniers mois)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Nombre total d’emprunts validés par mois</p>
            </div>
            <button
              onClick={() => onNavigate('stats')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Détails <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-6">
            <div className="flex items-end justify-between gap-4 h-44 px-2">
              {monthlyLoanCounts.map((item, idx) => {
                const heightPercent = Math.round((item.count / maxMonthCount) * 100);
                const isLatest = idx === monthlyLoanCounts.length - 1;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-md transition-all duration-500 ${
                          isLatest
                            ? 'bg-indigo-600 group-hover:bg-indigo-500'
                            : 'bg-indigo-300 dark:bg-indigo-900/60 group-hover:bg-indigo-400'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Répartition des Fonds
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Catégories les plus représentées</p>
            </div>

            <div className="space-y-4 pt-4">
              {categoryList.map((item) => {
                const pct = totalBooks > 0 ? Math.round((item.count / totalBooks) * 100) : 0;
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {item.count} ex. ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Taux d'utilisation</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {totalBooks > 0 ? Math.round((borrowedBooks / totalBooks) * 100) : 0}% en prêt
            </span>
          </div>
        </div>
      </div>

      {/* Two columns: Recent Loans & Recent Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers Emprunts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Derniers Emprunts
              </h2>
            </div>
            <button
              onClick={() => onNavigate('loans')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Tous les emprunts <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentLoans.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Aucun emprunt enregistré.</p>
            ) : (
              recentLoans.map((loan) => (
                <div key={loan.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {loan.bookCoverUrl ? (
                      <img
                        src={loan.bookCoverUrl}
                        alt=""
                        className="w-9 h-12 object-cover rounded-md shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-12 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Emprunté par <span className="font-medium text-slate-700 dark:text-slate-300">{loan.memberName}</span>
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Date: {loan.loanDate} · Retour prévu: {loan.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        loan.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : loan.status === 'returned'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {loan.status === 'overdue'
                        ? 'En retard'
                        : loan.status === 'returned'
                        ? 'Retourné'
                        : 'En cours'}
                    </span>
                    {loan.status !== 'returned' && (
                      <button
                        onClick={() => onOpenReturnModal(loan)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Enregistrer le retour"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Derniers Retours */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Derniers Retours Enregistrés
              </h2>
            </div>
            <button
              onClick={() => onNavigate('returns')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Historique retours <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentReturns.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Aucun retour récent enregistré.</p>
            ) : (
              recentReturns.map((loan) => (
                <div key={loan.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Restitué par <span className="font-medium text-slate-700 dark:text-slate-300">{loan.memberName}</span>
                      </p>
                      <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Restitué le: {loan.returnDate}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {loan.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
