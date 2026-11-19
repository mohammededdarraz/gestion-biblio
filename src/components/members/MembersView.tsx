import React, { useState } from 'react';
import { Member, Loan } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { canDeleteMember } from '../../services/validation';
import { useNotification } from '../../context/NotificationContext';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { FileSpreadsheet } from 'lucide-react';

interface MembersViewProps {
  members: Member[];
  loans: Loan[];
  onOpenAddModal: () => void;
  onEditMember: (member: Member) => void;
  onViewMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onNewLoanForMember: (member: Member) => void;
  onRefreshData?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  loans,
  onOpenAddModal,
  onEditMember,
  onViewMember,
  onDeleteMember,
  onNewLoanForMember,
  onRefreshData,
}) => {
  const { addToast } = useNotification();
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.id.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (member: Member) => {
    const check = canDeleteMember(member.id, loans);
    if (!check.allowed) {
      addToast('error', check.reason || 'Cet adhérent ne peut pas être supprimé.', 'Suppression refusée');
      return;
    }
    setMemberToDelete(member);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      onDeleteMember(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion des Adhérents
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {members.length} inscrits · {members.filter((m) => m.status === 'active').length} actifs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-emerald-600/30 cursor-pointer"
            title="Importer des adhérents ou emails autorisés via Excel (.xlsx, .xls)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importer Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrire un Adhérent</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone ou ID (ADH-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif uniquement</option>
            <option value="inactive">Inactif uniquement</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Aucun adhérent trouvé
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aucun adhérent ne correspond à votre recherche. Modifiez vos filtres ou ajoutez une inscription.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Adhérent</th>
                  <th className="py-3 px-4">Coordonnées</th>
                  <th className="py-3 px-4">Date d'inscription</th>
                  <th className="py-3 px-4 text-center">Emprunts en cours</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredMembers.map((member) => {
                  const activeLoansCount = loans.filter(
                    (l) =>
                      l.memberId === member.id &&
                      (l.status === 'active' || l.status === 'overdue')
                  ).length;
                  const hasOverdue = loans.some(
                    (l) => l.memberId === member.id && l.status === 'overdue'
                  );

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Adhérent */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            <span
                              onClick={() => onViewMember(member)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer block"
                            >
                              {member.fullName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {member.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coordonnées */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {member.email}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {member.phone}
                          </p>
                        </div>
                      </td>

                      {/* Date d'inscription */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {member.membershipDate}
                      </td>

                      {/* Emprunts en cours */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded-full text-xs ${
                            hasOverdue
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : activeLoansCount > 0
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {activeLoansCount}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {member.status === 'active' ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              Actif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-slate-400" />
                              Inactif
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {member.status === 'active' && (
                            <button
                              onClick={() => onNewLoanForMember(member)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                              title="Nouvel emprunt pour cet adhérent"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onViewMember(member)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Historique et fiche adhérent"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditMember(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Delete confirmation dialog */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Supprimer cet adhérent ?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement «{' '}
              <strong>{memberToDelete.fullName}</strong> » ({memberToDelete.id}) ? Cette action est
              irréversible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultType="users"
        onImportSuccess={() => {
          onRefreshData?.();
        }}
      />
    </div>
  );
};
