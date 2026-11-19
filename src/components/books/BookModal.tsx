import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Book } from '../../types';
import { validateBook } from '../../services/validation';
import { fetchBookMetadata } from '../../services/bookApi';
import { Sparkles, Image, Check, AlertCircle, Search, RefreshCw } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'createdAt' | 'status'>, bookId?: string) => void;
  editingBook?: Book | null;
}

const DEFAULT_CATEGORIES = [
  'Littérature classique',
  'Littérature française',
  'Science-Fiction',
  'Histoire & Sciences',
  'Bande Dessinée',
  'Jeunesse',
  'Philosophie',
  'Policier & Thriller',
  'Arts & Essais',
];

const PRESET_COVERS = [
  { label: 'Le Petit Prince', url: '/src/assets/images/book_cover_petit_prince_1791278440029.jpg' },
  { label: 'Les Misérables', url: '/src/assets/images/book_cover_miserables_1791278449637.jpg' },
  { label: 'Classique Bleu', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dystopie Sombre', url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80' },
  { label: 'Aventure Désert', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80' },
];

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBook,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [publisher, setPublisher] = useState('');
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [totalQuantity, setTotalQuantity] = useState<number>(3);
  const [availableQuantity, setAvailableQuantity] = useState<number>(3);
  const [location, setLocation] = useState('Rayon A-01');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [fetchFeedback, setFetchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setIsbn(editingBook.isbn);
      setCategory(editingBook.category);
      setPublisher(editingBook.publisher || '');
      setPublicationYear(editingBook.publicationYear || 2020);
      setTotalQuantity(editingBook.totalQuantity);
      setAvailableQuantity(editingBook.availableQuantity);
      setLocation(editingBook.location || editingBook.shelfLocation || 'Rayon A-01');
      setCoverUrl(editingBook.coverUrl || editingBook.coverImage || '');
      setDescription(editingBook.description || '');
      setErrors({});
      setFetchFeedback(null);
    } else {
      // Defaults for a new book
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setPublisher('');
      setPublicationYear(new Date().getFullYear());
      setTotalQuantity(3);
      setAvailableQuantity(3);
      setLocation('Rayon A-01');
      setCoverUrl(PRESET_COVERS[0].url);
      setDescription('');
      setErrors({});
      setFetchFeedback(null);
    }
  }, [editingBook, isOpen]);

  // Handle automatic metadata fetching by ISBN via Google Books / Open Library API
  const handleAutoFetchMetadata = async () => {
    const cleanIsbn = isbn.replace(/[\s\-]/g, '').trim();
    if (!cleanIsbn) {
      setFetchFeedback({
        type: 'error',
        message: 'Veuillez d’abord renseigner un code ISBN pour lancer la recherche automatique.',
      });
      return;
    }

    setIsFetchingMetadata(true);
    setFetchFeedback(null);

    try {
      const meta = await fetchBookMetadata(cleanIsbn);
      if (meta) {
        if (meta.title) setTitle(meta.title);
        if (meta.authors && meta.authors.length > 0) setAuthor(meta.authors.join(', '));
        if (meta.publisher) setPublisher(meta.publisher);
        if (meta.publishedDate) {
          const yearNum = parseInt(meta.publishedDate.split('-')[0], 10);
          if (!isNaN(yearNum)) setPublicationYear(yearNum);
        }
        if (meta.description) setDescription(meta.description);
        if (meta.thumbnail) setCoverUrl(meta.thumbnail);
        if (meta.categories && meta.categories.length > 0) {
          const matched = DEFAULT_CATEGORIES.find((c) =>
            meta.categories?.some((mc) => mc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(mc.toLowerCase()))
          );
          if (matched) setCategory(matched);
        }

        setFetchFeedback({
          type: 'success',
          message: 'Informations récupérées avec succès depuis Google Books / Open Library ! Vous pouvez les ajuster ci-dessous.',
        });
      } else {
        setFetchFeedback({
          type: 'error',
          message: 'Aucune métadonnée trouvée pour cet ISBN. Vous pouvez saisir les informations manuellement.',
        });
      }
    } catch {
      setFetchFeedback({
        type: 'error',
        message: 'Erreur lors de la communication avec le service de métadonnées.',
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleTotalQuantityChange = (val: number) => {
    setTotalQuantity(val);
    if (!editingBook) {
      setAvailableQuantity(val);
    } else if (availableQuantity > val) {
      setAvailableQuantity(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bookPayload: any = {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category: category.trim(),
      publisher: publisher.trim() || 'Éditions Générales',
      publicationYear: Number(publicationYear),
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(availableQuantity),
      totalCopies: Number(totalQuantity),
      availableCopies: Number(availableQuantity),
      shelfLocation: location.trim() || 'Rayon Principal',
      location: location.trim() || 'Rayon Principal',
      coverImage: coverUrl.trim() || PRESET_COVERS[0].url,
      coverUrl: coverUrl.trim() || PRESET_COVERS[0].url,
      description: description.trim(),
    };

    const validation = validateBook(bookPayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(bookPayload, editingBook?.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBook ? 'Modifier le livre' : 'Ajouter un nouveau livre'}
      subtitle="Remplissez les détails du livre pour mettre à jour le catalogue de la bibliothèque."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ISBN & Auto-Fetch Button (Requirement 3) */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
          <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
            Recherche Automatique par ISBN (Google Books & Open Library)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => {
                  setIsbn(e.target.value);
                  setFetchFeedback(null);
                }}
                placeholder="Ex: 9782070612758 ou 978-2-07-061275-8"
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-xl font-mono text-slate-900 dark:text-white ${
                  errors.isbn
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleAutoFetchMetadata}
              disabled={isFetchingMetadata || !isbn.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs shadow-indigo-600/30"
            >
              {isFetchingMetadata ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isFetchingMetadata ? 'Recherche...' : 'Remplir auto via ISBN'}</span>
            </button>
          </div>

          {errors.isbn && <p className="text-[11px] text-rose-500">{errors.isbn}</p>}

          {fetchFeedback && (
            <div
              className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                fetchFeedback.type === 'success'
                  ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {fetchFeedback.type === 'success' ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              )}
              <span>{fetchFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Titre & Auteur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Titre du livre *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Le Petit Prince"
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                errors.title
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Auteur *
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ex: Antoine de Saint-Exupéry"
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                errors.author
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {errors.author && <p className="text-[11px] text-rose-500 mt-1">{errors.author}</p>}
          </div>
        </div>

        {/* Catégorie & Éditeur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catégorie *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Éditeur
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Ex: Gallimard"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Année, Quantités & Emplacement */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Année de publication
            </label>
            <input
              type="number"
              min="1000"
              max={new Date().getFullYear() + 2}
              value={publicationYear}
              onChange={(e) => setPublicationYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
            {errors.publicationYear && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.publicationYear}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre d'exemplaires (Total)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={totalQuantity}
              onChange={(e) => handleTotalQuantityChange(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Emplacement en rayon
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Rayon B-04"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Image de couverture */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Image de couverture (URL ou choix prédéfini)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... ou choisir ci-dessous"
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 shrink-0">Suggestions :</span>
            {PRESET_COVERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCoverUrl(preset.url)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  coverUrl === preset.url
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description & Résumé de l'ouvrage
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Court résumé de l'intrigue ou du contenu pédagogique..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{editingBook ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
