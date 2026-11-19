import React from 'react';
import { Modal } from '../common/Modal';
import { Book, Loan, PhysicalCopy } from '../../types';
import { db } from '../../services/db';
import {
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  Barcode,
  Building,
  User,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  onBorrowBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  loans,
  onBorrowBook,
  onEditBook,
}) => {
  if (!book) return null;

  const bookLoans = loans.filter((l) => l.bookId === book.id);
  const activeLoans = bookLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const copies: PhysicalCopy[] = db.getCopiesByBook(book.id);

  const availableQuantity = book.availableQuantity ?? book.availableCopies ?? 0;
  const totalQuantity = book.totalQuantity ?? book.totalCopies ?? copies.length;
  const isAvailable = availableQuantity > 0;
  const allBorrowed = totalQuantity > 0 && availableQuantity === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={book.title}
      subtitle={`Par ${book.author} · ${book.category}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Top Details & Cover Layout */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800 shrink-0 mx-auto sm:mx-0 border border-slate-200 dark:border-slate-700">
            {book.coverUrl || book.coverImage ? (
              <img
                src={book.coverUrl || book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mb-2" />
                <span className="text-xs">Aucune couverture</span>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="flex-1 space-y-4">
            {/* Status indicator (Requirement 5: Green / Red / Gray) */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : allBorrowed
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Disponible en rayon ({availableQuantity} sur {totalQuantity} ex.)
                  </>
                ) : allBorrowed ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Tous les exemplaires sont empruntés (Ouvrage en souffrance)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    Aucun exemplaire actif disponible
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              « {book.description || 'Aucune description disponible pour cet ouvrage.'} »
            </p>

            {/* Metadata list */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ISBN</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {book.isbn}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Localisation</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  {book.location || book.shelfLocation || 'Rayon principal'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Éditeur & Année</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {book.publisher || 'N/A'} ({book.publicationYear})
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Identifiant interne</span>
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  {book.id}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-3">
              {isAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    onBorrowBook(book);
                    onClose();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shadow-indigo-600/30 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Enregistrer un emprunt</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onEditBook(book);
                  onClose();
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Modifier la fiche
              </button>
            </div>
          </div>
        </div>

        {/* Physical Copies Section (Requirement 3: Each copy has unique ID, barcode, condition & status) */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Exemplaires Physiques Enregistrés ({copies.length})
          </h4>

          {copies.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
              Aucun exemplaire physique rattaché.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {copies.map((copy) => (
                <div
                  key={copy.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {copy.id}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-slate-400" />
                        {copy.barcode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>État : <strong>{copy.condition}</strong></span>
                      <span>·</span>
                      <span>{copy.shelfLocation}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      copy.status === 'available'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : copy.status === 'borrowed'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {copy.status === 'available'
                      ? 'En rayon'
                      : copy.status === 'borrowed'
                      ? 'Emprunté'
                      : copy.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active loans table for this book */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Emprunts Actifs en cours ({activeLoans.length})
          </h4>

          {activeLoans.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
              Tous les exemplaires de cet ouvrage sont actuellement disponibles en rayon.
            </p>
          ) : (
            <div className="space-y-2">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {loan.memberName || loan.userName}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">({loan.id})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Retour prévu : <strong className="font-mono">{loan.dueDate || loan.expectedReturnDate}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        loan.status === 'overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {loan.status === 'overdue' ? 'En retard' : 'En cours'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
