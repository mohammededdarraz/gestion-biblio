import React, { useState } from 'react';
import { Loan } from '../../types';
import {
  ArrowRightLeft,
  Plus,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BookOpen,
  User,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface LoansViewProps {
  loans: Loan[];
  onOpenNewLoanModal: () => void;
  onReturnLoan: (loan: Loan) => void;
  onRenewLoan: (loanId: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  onOpenNewLoanModal,
  onReturnLoan,
  onRenewLoan,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<Loan | null>(null);

  const filteredLoans = loans.filter((loan) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      loan.id.toLowerCase().includes(q) ||
      loan.bookTitle.toLowerCase().includes(q) ||
      loan.memberName.toLowerCase().includes(q) ||
      loan.bookIsbn.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion des Emprunts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loans.length} emprunts au total ·{' '}
            {loans.filter((l) => l.status === 'active').length} en cours ·{' '}
            {loans.filter((l) => l.status === 'overdue').length} en retard
          </p>
        </div>

        <button
          onClick={onOpenNewLoanModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-indigo-600/30 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nouvel Emprunt
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par n° emprunt (EMP-2026-001), titre de livre ou adhérent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'En cours' },
            { id: 'overdue', label: 'En retard' },
            { id: 'returned', label: 'Retournés' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      {filteredLoans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ArrowRightLeft className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Aucun emprunt trouvé
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aucun enregistrement ne correspond à vos filtres actuels.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">N° Emprunt</th>
                  <th className="py-3 px-4">Livre</th>
                  <th className="py-3 px-4">Adhérent</th>
                  <th className="py-3 px-4">Date Prêt</th>
                  <th className="py-3 px-4">Date Retour Prévue</th>
                  <th className="py-3 px-4">Date Restitution</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLoans.map((loan) => {
                  const isOverdue = loan.status === 'overdue';
                  const isReturned = loan.status === 'returned';

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400 text-xs">
                        {loan.id}
                      </td>

                      {/* Livre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {loan.bookCoverUrl ? (
                            <img
                              src={loan.bookCoverUrl}
                              alt=""
                              className="w-7 h-10 object-cover rounded shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-xs">
                              {loan.bookTitle}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {loan.bookIsbn}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Adhérent */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {loan.memberName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {loan.memberId}
                        </span>
                      </td>

                      {/* Date d'emprunt */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {loan.loanDate}
                      </td>

                      {/* Date de retour prévue */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span
                          className={
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {loan.dueDate}
                        </span>
                      </td>

                      {/* Date réelle */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {loan.returnDate || '—'}
                      </td>

                      {/* Statut Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isReturned
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              En retard
                            </>
                          ) : isReturned ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Retourné
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-indigo-500" />
                              En cours
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isReturned && (
                            <>
                              <button
                                onClick={() => onReturnLoan(loan)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Enregistrer le retour"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Retour</span>
                              </button>
                              <button
                                onClick={() => onRenewLoan(loan.id)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Prolonger de 14 jours"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedLoanForDetail(loan)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loan Detail Popover Modal */}
      {selectedLoanForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedLoanForDetail.id}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Détails du prêt
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoanForDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Ouvrage emprunté
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                  {selectedLoanForDetail.bookTitle}
                </p>
                <p className="font-mono text-slate-500 mt-0.5">
                  ISBN: {selectedLoanForDetail.bookIsbn}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Adhérent emprunteur
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                  {selectedLoanForDetail.memberName}
                </p>
                <p className="font-mono text-slate-500 mt-0.5">
                  Identifiant : {selectedLoanForDetail.memberId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Date d'emprunt</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLoanForDetail.loanDate}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Date limite retour</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedLoanForDetail.dueDate}
                  </span>
                </div>
              </div>

              {selectedLoanForDetail.returnDate && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                  <span className="text-[10px] uppercase font-bold block">
                    Restitution effectuée
                  </span>
                  <span className="font-mono font-semibold">
                    Le {selectedLoanForDetail.returnDate}
                  </span>
                </div>
              )}

              {selectedLoanForDetail.notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 block text-[10px]">Remarques</span>
                  <span>{selectedLoanForDetail.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLoanForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
