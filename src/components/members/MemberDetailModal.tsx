import React from 'react';
import { Modal } from '../common/Modal';
import { Member, Loan } from '../../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  onNewLoanForMember: (member: Member) => void;
  onReturnLoan: (loan: Loan) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  loans,
  onNewLoanForMember,
  onReturnLoan,
}) => {
  if (!member) return null;

  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const activeLoans = memberLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const returnedLoans = memberLoans.filter((l) => l.status === 'returned');
  const overdueLoans = memberLoans.filter((l) => l.status === 'overdue');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member.fullName}
      subtitle={`Identifiant adhérent : ${member.id}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Profile Card & Info */}
        <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-lg shrink-0">
            {member.fullName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {member.fullName}
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  member.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {member.status === 'active' ? 'Adhérent actif' : 'Adhérent inactif'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {member.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {member.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Inscrit le {member.membershipDate}
              </span>
            </div>

            {member.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {member.address}
              </p>
            )}
          </div>

          {member.status === 'active' && (
            <button
              onClick={() => {
                onNewLoanForMember(member);
                onClose();
              }}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs shadow-indigo-600/30"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Nouvel emprunt
            </button>
          )}
        </div>

        {/* Stats Pill Counters */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Emprunts en cours
            </span>
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {activeLoans.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              En retard
            </span>
            <span
              className={`text-xl font-bold font-mono ${
                overdueLoans.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {overdueLoans.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total historique
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {memberLoans.length}
            </span>
          </div>
        </div>

        {/* Emprunts en cours de l'adhérent */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Emprunts en cours ({activeLoans.length})
          </h4>

          {activeLoans.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
              Aucun emprunt en cours pour cet adhérent.
            </p>
          ) : (
            <div className="space-y-2">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Emprunté le {loan.loanDate} · Retour avant le {loan.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        loan.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {loan.status === 'overdue' ? 'En retard' : 'En cours'}
                    </span>
                    <button
                      onClick={() => {
                        onReturnLoan(loan);
                        onClose();
                      }}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retourner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique des retours passés */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Historique des retours passés ({returnedLoans.length})
          </h4>

          {returnedLoans.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
              Aucun retour passé enregistré.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {returnedLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="truncate">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {loan.bookTitle}
                    </span>
                    <span className="text-slate-400 ml-2 font-mono text-[11px]">
                      (Restitué le {loan.returnDate})
                    </span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                    Retourné
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
