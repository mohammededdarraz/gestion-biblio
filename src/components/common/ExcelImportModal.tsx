import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { ExcelImportRow, ExcelImportSummary } from '../../types';
import { parseBooksExcel, parseUsersExcel, generateBooksTemplate, generateUsersTemplate } from '../../services/excelService';
import { db } from '../../services/db';
import { useNotification } from '../../context/NotificationContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Trash2,
  Edit2,
  RefreshCw,
  Check,
  BookOpen,
  Users,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'books' | 'users';
  onImportSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'books',
  onImportSuccess,
}) => {
  const { addToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<'books' | 'users'>(defaultType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rows, setRows] = useState<ExcelImportRow[]>([]);
  const [summary, setSummary] = useState<ExcelImportSummary | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setImportType(defaultType);
      setSelectedFile(null);
      setRows([]);
      setSummary(null);
      setIsParsing(false);
      setIsImporting(false);
    }
  }, [isOpen, defaultType]);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      addToast('error', 'Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV.', 'Format non supporté');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      if (importType === 'books') {
        const existingIsbns = db.getBooks().map((b) => b.isbn.replace(/[\s\-]/g, ''));
        const result = await parseBooksExcel(file, existingIsbns);
        setRows(result.rows);
        setSummary(result.summary);
      } else {
        const existingEmails = db.getAuthorizedUsers().map((u) => u.email.toLowerCase());
        const result = await parseUsersExcel(file, existingEmails);
        setRows(result.rows);
        setSummary(result.summary);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la lecture du fichier Excel.', 'Erreur lecture');
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteRow = (index: number) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);

    const validRows = updated.filter((r) => r.isValid).length;
    const duplicateRows = updated.filter((r) => r.isDuplicate).length;
    setSummary({
      totalRows: updated.length,
      validRows,
      invalidRows: updated.length - validRows,
      duplicateRows,
      importedCount: 0,
    });
  };

  const handleConfirmImport = () => {
    const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);
    if (validRows.length === 0) {
      addToast('error', 'Aucune ligne valide à importer.', 'Import impossible');
      return;
    }

    setIsImporting(true);
    try {
      if (importType === 'books') {
        const count = db.importValidatedBooks(validRows.map((r) => r.data));
        addToast(
          'success',
          `${count} livre(s) ont été importé(s) dans le catalogue avec succès.`,
          'Import terminé'
        );
      } else {
        const count = db.importValidatedUsers(validRows.map((r) => r.data));
        addToast(
          'success',
          `${count} utilisateur(s) autorisé(s) ont été importé(s) avec succès.`,
          'Import terminé'
        );
      }
      onImportSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’importation.', 'Erreur import');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid && !r.isDuplicate).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importation de Données via Excel"
      subtitle="Chargez un fichier .xlsx ou .xls pour intégrer rapidement des livres ou des utilisateurs autorisés."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Type selector & template download */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setImportType('books');
                setSelectedFile(null);
                setRows([]);
                setSummary(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                importType === 'books'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalogue Livres</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportType('users');
                setSelectedFile(null);
                setRows([]);
                setSummary(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                importType === 'users'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Utilisateurs Autorisés</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (importType === 'books') {
                generateBooksTemplate();
              } else {
                generateUsersTemplate();
              }
              addToast('info', 'Fichier modèle Excel téléchargé sur votre poste.', 'Modèle prêt');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Télécharger Modèle Excel (.xlsx)</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Glissez-déposez votre fichier Excel ici
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ou cliquez pour parcourir vos fichiers (.xlsx, .xls, .csv)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File header bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setRows([]);
                  setSummary(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
              >
                Changer de fichier
              </button>
            </div>

            {/* Summary badges */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Lignes</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">{summary.totalRows}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Valides</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{validCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] uppercase font-semibold text-amber-600 block">Doublons</span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-300">{summary.duplicateRows}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] uppercase font-semibold text-rose-600 block">Invalides</span>
                  <span className="text-base font-bold text-rose-700 dark:text-rose-300">{summary.invalidRows}</span>
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-[10px] uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Ligne</th>
                    <th className="py-2 px-3">{importType === 'books' ? 'Titre / Auteur' : 'Email'}</th>
                    <th className="py-2 px-3">{importType === 'books' ? 'ISBN / Catégorie' : 'Nom & Rôle'}</th>
                    <th className="py-2 px-3">Statut & Validation</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.isDuplicate
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : !row.isValid
                          ? 'bg-rose-50/50 dark:bg-rose-950/20'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                        #{row.rowNumber}
                      </td>
                      <td className="py-2 px-3">
                        {importType === 'books' ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                              {row.data.title || '(Sans titre)'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {row.data.author || '(Sans auteur)'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                              {row.data.email || '(Sans email)'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {importType === 'books' ? (
                          <div>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 block">
                              {row.data.isbn || '—'}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {row.data.category} · {row.data.copiesCount} ex.
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 block">
                              {row.data.fullName}
                            </span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase font-medium">
                              {row.data.role}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> Doublon
                          </span>
                        ) : row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Valide
                          </span>
                        ) : (
                          <div className="text-[10px] text-rose-600 space-y-0.5">
                            {row.errors.map((err, eIdx) => (
                              <div key={eIdx} className="flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5 shrink-0" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={!selectedFile || validCount === 0 || isImporting}
            onClick={handleConfirmImport}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shadow-indigo-600/30 cursor-pointer"
          >
            {isImporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Importer {validCount} enregistrement(s)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
