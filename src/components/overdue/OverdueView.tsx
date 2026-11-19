import React, { useState } from 'react';
import { Loan } from '../../types';
import {
  AlertTriangle,
  Mail,
  RotateCcw,
  Clock,
  User,
  BookOpen,
  Calendar,
  Send,
  Check,
  Search,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface OverdueViewProps {
  loans: Loan[];
  onReturnLoan: (loan: Loan) => void;
}

export const OverdueView: React.FC<OverdueViewProps> = ({ loans, onReturnLoan }) => {
  const { addToast } = useNotification();
  const [remindersSent, setRemindersSent] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = overdueLoans.filter((l) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.memberName.toLowerCase().includes(q)
    );
  });

  const getDelayDays = (dueDate: string) => {
    const diff = Math.abs(new Date(todayStr).getTime() - new Date(dueDate).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleSendReminder = (loan: Loan) => {
    setRemindersSent((prev) => ({ ...prev, [loan.id]: true }));
    addToast(
      'info',
      `Un courriel de relance a été envoyé avec succès à l'adhérent ${loan.memberName} pour "${loan.bookTitle}".`,
      'Rappel envoyé'
    );
  };

  const handleSendAllReminders = () => {
    const newMap = { ...remindersSent };
    overdueLoans.forEach((l) => {
      newMap[l.id] = true;
    });
    setRemindersSent(newMap);
    addToast(
      'success',
      `Relances envoyées à tous les adhérents en retard (${overdueLoans.length} rappels).`,
      'Relance groupée'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestion des Retards
            </h1>
            {overdueLoans.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {overdueLoans.length}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Suivi des emprunts ayant dépassé leur date limite de restitution et envoi des relances.
          </p>
        </div>

        {overdueLoans.length > 0 && (
          <button
            onClick={handleSendAllReminders}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-rose-600/30 w-fit"
          >
            <Send className="w-4 h-4" />
            Relancer tous les retardataires
          </button>
        )}
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 block font-medium">Total Prêts en Retard</span>
          <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {overdueLoans.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Nécessite intervention</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 block font-medium">Retard Moyen</span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {overdueLoans.length > 0
              ? Math.round(
                  overdueLoans.reduce((acc, l) => acc + getDelayDays(l.dueDate), 0) /
                    overdueLoans.length
                )
              : 0}{' '}
            jours
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Par emprunt impayé</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 block font-medium">Relances Expédiées</span>
          <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {Object.keys(remindersSent).length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Cette session</span>
        </div>
      </div>

      {/* Search Input */}
      {overdueLoans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par adhérent ou livre en retard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        </div>
      )}

      {/* List of overdue loans */}
      {overdueLoans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Félicitations ! Aucun emprunt en retard
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tous les adhérents ont restitué leurs livres dans les temps ou les délais courent encore.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400">Aucun résultat pour cette recherche.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loan) => {
            const delayDays = getDelayDays(loan.dueDate);
            const isSent = remindersSent[loan.id];

            return (
              <div
                key={loan.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {loan.bookTitle}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        +{delayDays} jour{delayDays > 1 ? 's' : ''} de retard
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>
                        Adhérent : <strong className="text-slate-700 dark:text-slate-300">{loan.memberName}</strong> ({loan.memberId})
                      </span>
                      <span>·</span>
                      <span>Échéance dépassée : <strong className="font-mono text-rose-600 dark:text-rose-400">{loan.dueDate}</strong></span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-400">N° {loan.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleSendReminder(loan)}
                    disabled={isSent}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isSent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Rappel envoyé
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        Envoyer un rappel
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onReturnLoan(loan)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shadow-emerald-600/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restituer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
