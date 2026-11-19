import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Book, Member } from '../../types';
import {
  Search,
  User,
  BookOpen,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  X,
  ArrowRight,
} from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  books: Book[];
  preselectedMember?: Member | null;
  preselectedBook?: Book | null;
  defaultDurationDays?: number;
  onSubmit: (memberId: string, bookIds: string[], durationDays: number, notes?: string) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  members,
  books,
  preselectedMember,
  preselectedBook,
  defaultDurationDays = 21,
  onSubmit,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState<number>(defaultDurationDays);
  const [notes, setNotes] = useState<string>('');

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(preselectedMember ? preselectedMember.id : '');
      setSelectedBookIds(preselectedBook && preselectedBook.availableQuantity > 0 ? [preselectedBook.id] : []);
      setDurationDays(defaultDurationDays);
      setNotes('');
      setMemberSearch('');
      setBookSearch('');
      setErrorMsg('');
    }
  }, [isOpen, preselectedMember, preselectedBook, defaultDurationDays]);

  const activeMembers = members.filter((m) => m.status === 'active');
  const availableBooks = books.filter((b) => b.availableQuantity > 0);

  const filteredMembers = activeMembers.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    return !q || m.fullName.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const filteredBooks = availableBooks.filter((b) => {
    const q = bookSearch.trim().toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q);
  });

  const toggleBookSelection = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedBooksList = books.filter((b) => selectedBookIds.includes(b.id));

  // Compute calculated due date
  const today = new Date();
  const calculatedDueDate = new Date();
  calculatedDueDate.setDate(today.getDate() + durationDays);
  const dueDateStr = calculatedDueDate.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMemberId) {
      setErrorMsg('Veuillez sélectionner un adhérent.');
      return;
    }
    if (selectedBookIds.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins un livre disponible.');
      return;
    }

    // Double check availability
    for (const b of selectedBooksList) {
      if (b.availableQuantity <= 0) {
        setErrorMsg(`Le livre "${b.title}" n'est plus disponible en stock.`);
        return;
      }
    }

    onSubmit(selectedMemberId, selectedBookIds, durationDays, notes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un Nouvel Emprunt"
      subtitle="Sélectionnez l'adhérent emprunteur, un ou plusieurs ouvrages en stock et fixez la date d'échéance."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. SÉLECTION ADHÉRENT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              1. Sélectionner l'Adhérent *
            </label>
            {selectedMember && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Adhérent sélectionné
              </span>
            )}
          </div>

          {selectedMember ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedMember.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedMember.id} · {selectedMember.email} · {selectedMember.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberId('')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline p-1"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un adhérent actif par nom ou numéro..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50">
                {filteredMembers.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">
                    Aucun adhérent actif trouvé.
                  </p>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.fullName}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">({m.id})</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">{m.phone}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. SÉLECTION LIVRES (MULTI-SELECTION) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              2. Sélectionner le ou les Livres ({selectedBookIds.length} sélectionné(s)) *
            </label>
            <span className="text-[11px] text-slate-400">
              Seuls les livres en stock sont affichés
            </span>
          </div>

          {/* Selected books chips */}
          {selectedBooksList.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              {selectedBooksList.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs shadow-2xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {book.title}
                  </span>
                  <span className="text-slate-400 text-[10px]">({book.availableQuantity} dispo)</span>
                  <button
                    type="button"
                    onClick={() => toggleBookSelection(book.id)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Books search & picker */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer les livres par titre, auteur ou ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50">
              {filteredBooks.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">
                  Aucun livre disponible ne correspond à cette recherche.
                </p>
              ) : (
                filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => toggleBookSelection(book.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {book.author} · {book.category} · {book.location}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          {book.availableQuantity} dispo
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 3. DURÉE DU PRÊT & DATES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Durée de l'emprunt
            </label>
            <div className="flex gap-2">
              {[14, 21, 28].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    durationDays === days
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {days} jours
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date de restitution calculée
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dueDateStr}</span>
              <span className="text-slate-400 text-[10px] ml-auto font-normal">
                (au plus tard)
              </span>
            </div>
          </div>
        </div>

        {/* Notes optionnelles */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Consignes particulières (optionnel)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Emprunt pour projet universitaire, état impeccable..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selectedBookIds.length > 0 &&
              `Le stock de ${selectedBookIds.length} ouvrage(s) sera automatiquement décrémenté.`}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedMemberId || selectedBookIds.length === 0}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Valider l'emprunt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
