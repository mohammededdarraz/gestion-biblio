import React, { useState } from 'react';
import { Loan } from '../../types';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  User,
  Barcode,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface ReturnsViewProps {
  loans: Loan[];
  onConfirmReturn: (loanId: string, notes?: string) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ loans, onConfirmReturn }) => {
  const [search, setSearch] = useState('');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState('Bon état');
  const [returnNotes, setReturnNotes] = useState('');
  const [quickScanError, setQuickScanError] = useState('');

  // Active or Overdue loans only (those pending return)
  const activePendingLoans = loans.filter(
    (l) => l.status === 'active' || l.status === 'overdue'
  );

  const filteredLoans = activePendingLoans.filter((loan) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      loan.id.toLowerCase().includes(q) ||
      loan.bookTitle.toLowerCase().includes(q) ||
      loan.memberName.toLowerCase().includes(q) ||
      loan.bookIsbn.toLowerCase().includes(q)
    );
  });

  // Quick return by barcode / loan ID
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickScanError('');
    const term = quickScanInput.trim().toUpperCase();
    if (!term) return;

    const found = activePendingLoans.find(
      (l) =>
        l.id.toUpperCase() === term ||
        l.bookIsbn.replace(/[\s\-]/g, '').toUpperCase() === term.replace(/[\s\-]/g, '')
    );

    if (found) {
      setSelectedLoanToReturn(found);
      setQuickScanInput('');
    } else {
      setQuickScanError(`Aucun emprunt en cours trouvé pour « ${term} »`);
    }
  };

  const handleExecuteReturn = () => {
    if (!selectedLoanToReturn) return;
    const finalNote = returnNotes
      ? `État: ${returnCondition} - ${returnNotes}`
      : `État: ${returnCondition}`;
    onConfirmReturn(selectedLoanToReturn.id, finalNote);
    setSelectedLoanToReturn(null);
    setReturnNotes('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Gestion des Retours
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enregistrez les restitutions d'ouvrages, restaurez automatiquement les stocks en rayon et vérifiez les retards.
        </p>
      </div>

      {/* Quick Return Barcode / Fast Input Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Barcode className="w-4 h-4" />
            Retour Rapide par Code / ISBN
          </div>
          <h2 className="text-base font-bold text-white mb-2">
            Saisissez l'identifiant de l'emprunt ou le code ISBN du livre
          </h2>
          <form onSubmit={handleQuickScanSubmit} className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Ex: EMP-2026-001 ou 978-2-07-061275-8..."
              value={quickScanInput}
              onChange={(e) => {
                setQuickScanInput(e.target.value);
                setQuickScanError('');
              }}
              className="flex-1 px-4 py-2 text-xs md:text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl text-xs md:text-sm transition-colors shrink-0 shadow-sm"
            >
              Scanner & Restituer
            </button>
          </form>
          {quickScanError && (
            <p className="text-xs text-rose-300 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {quickScanError}
            </p>
          )}
        </div>
      </div>

      {/* Search Input for Pending Loans */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher parmi les emprunts à restituer (titre, adhérent, n° emprunt)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Active Loans Waiting for Return */}
      {filteredLoans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Aucun emprunt en attente de retour
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Aucun résultat pour cette recherche.'
              : 'Tous les livres empruntés ont été restitués ou aucun emprunt actif n’est enregistré.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">N° Emprunt</th>
                  <th className="py-3 px-4">Livre à rendre</th>
                  <th className="py-3 px-4">Adhérent</th>
                  <th className="py-3 px-4">Date de Prêt</th>
                  <th className="py-3 px-4">Échéance prévue</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action Restitution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLoans.map((loan) => {
                  const isOverdue = loan.status === 'overdue';

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400 text-xs">
                        {loan.id}
                      </td>

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

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {loan.memberName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {loan.memberId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {loan.loanDate}
                      </td>

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

                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            En retard
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            En cours
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLoanToReturn(loan)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs shadow-emerald-600/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Enregistrer le retour
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {selectedLoanToReturn && (
        <Modal
          isOpen={!!selectedLoanToReturn}
          onClose={() => setSelectedLoanToReturn(null)}
          title="Confirmer la Restitution de l'Ouvrage"
          subtitle={`Prêt ${selectedLoanToReturn.id} par ${selectedLoanToReturn.memberName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Livre restitué :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedLoanToReturn.bookTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adhérent :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedLoanToReturn.memberName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date de retour enregistrée :</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Aujourd'hui ({todayStr})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock du livre :</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  +1 exemplaire remis en rayon
                </span>
              </div>
            </div>

            {selectedLoanToReturn.status === 'overdue' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Cet emprunt est en retard (échéance passée le {selectedLoanToReturn.dueDate}). La restitution clôture le litige.
                </span>
              </div>
            )}

            {/* Book condition assessment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                État de l'exemplaire restitué
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Parfait état">Parfait état / Comme neuf</option>
                <option value="Bon état">Bon état général</option>
                <option value="Usure normale">Usure normale d'usage</option>
                <option value="Légèrement abîmé">Légèrement abîmé (page cornée / couverture)</option>
                <option value="Nécessite réparation">Nécessite réparation / reliure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Commentaires (optionnel)
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Remarques éventuelles sur l'état..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLoanToReturn(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteReturn}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider la restitution
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
