import React, { useState } from 'react';
import { Book, Loan } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  ArrowRightLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { canDeleteBook } from '../../services/validation';
import { useNotification } from '../../context/NotificationContext';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { FileSpreadsheet } from 'lucide-react';

interface BooksViewProps {
  books: Book[];
  loans: Loan[];
  onOpenAddModal: () => void;
  onEditBook: (book: Book) => void;
  onViewBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onBorrowBook: (book: Book) => void;
  onRefreshData?: () => void;
}

export const BooksView: React.FC<BooksViewProps> = ({
  books,
  loans,
  onOpenAddModal,
  onEditBook,
  onViewBook,
  onDeleteBook,
  onBorrowBook,
  onRefreshData,
}) => {
  const { addToast } = useNotification();
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(books.map((b) => b.category))).filter(Boolean);

  // Filtered books
  const filteredBooks = books.filter((book) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q) ||
      (book.location && book.location.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' || book.category === selectedCategory;

    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && book.availableQuantity > 0) ||
      (availabilityFilter === 'borrowed' &&
        book.availableQuantity > 0 &&
        book.availableQuantity < book.totalQuantity) ||
      (availabilityFilter === 'unavailable' && book.availableQuantity === 0);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleDeleteClick = (book: Book) => {
    const check = canDeleteBook(book.id, loans);
    if (!check.allowed) {
      addToast('error', check.reason || 'Ce livre ne peut pas être supprimé.', 'Suppression refusée');
      return;
    }
    setBookToDelete(book);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      onDeleteBook(bookToDelete.id);
      setBookToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestion du Catalogue des Livres
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {books.length} titres enregistrés · {filteredBooks.length} affichés
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-emerald-600/30 cursor-pointer"
            title="Importer des livres en masse depuis un fichier Excel (.xlsx, .xls)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importer Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Livre</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, ISBN ou rayon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="w-full md:w-48">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponible en rayon</option>
              <option value="borrowed">Partiellement emprunté</option>
              <option value="unavailable">Indisponible (Épuisé)</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vue Tableau"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Table or Grid */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Aucun livre ne correspond aux critères
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Modifiez vos filtres ou effectuez une autre recherche pour trouver des ouvrages.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Livre & Auteur</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Emplacement</th>
                  <th className="py-3 px-4 text-center">Disponibilité</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableQuantity > 0;
                  const isFullyBorrowed = book.availableQuantity === 0;

                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Livre & Auteur */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt=""
                              className="w-8 h-11 object-cover rounded shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span
                              onClick={() => onViewBook(book)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer block truncate max-w-xs"
                            >
                              {book.title}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-xs">
                              {book.author} · {book.publicationYear}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {book.category}
                      </td>

                      {/* ISBN */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {book.isbn}
                      </td>

                      {/* Emplacement */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {book.location || 'Rayon principal'}
                        </span>
                      </td>

                      {/* Disponibilité stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {book.availableQuantity}
                        </span>
                        <span className="text-slate-400 text-xs"> / {book.totalQuantity}</span>
                      </td>

                      {/* Statut Badge */}
                      <td className="py-3.5 px-4">
                        {isFullyBorrowed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Indisponible
                          </span>
                        ) : book.availableQuantity < book.totalQuantity ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Emprunté
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Disponible
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAvailable && (
                            <button
                              onClick={() => onBorrowBook(book)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                              title="Emprunter ce livre"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onViewBook(book)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Voir la fiche détaillée"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditBook(book)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(book)}
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
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableQuantity > 0;
            const isFullyBorrowed = book.availableQuantity === 0;

            return (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col group"
              >
                {/* Cover & header */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                  {/* Status overlay badge */}
                  <div className="absolute top-3 right-3">
                    {isFullyBorrowed ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-600 text-white shadow-sm">
                        Indisponible
                      </span>
                    ) : book.availableQuantity < book.totalQuantity ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow-sm">
                        {book.availableQuantity} dispo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600 text-white shadow-sm">
                        Disponible ({book.availableQuantity})
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      {book.category}
                    </span>
                    <h3
                      onClick={() => onViewBook(book)}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-1 mt-0.5"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {book.author}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {book.location || 'Rayon principal'}
                    </span>
                    <span className="font-mono text-[11px]">
                      {book.availableQuantity}/{book.totalQuantity} ex.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewBook(book)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditBook(book)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isAvailable && (
                      <button
                        onClick={() => onBorrowBook(book)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Emprunter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Supprimer cet ouvrage ?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement «{' '}
              <strong>{bookToDelete.title}</strong> » ({bookToDelete.isbn}) ? Cette action est
              irréversible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
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
        defaultType="books"
        onImportSuccess={() => {
          onRefreshData?.();
        }}
      />
    </div>
  );
};
