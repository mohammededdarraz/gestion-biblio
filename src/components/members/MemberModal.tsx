import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member, MemberStatus } from '../../types';
import { validateMember } from '../../services/validation';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<Member, 'id' | 'membershipDate'>, memberId?: string) => void;
  editingMember?: Member | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMember) {
      setFullName(editingMember.fullName);
      setEmail(editingMember.email);
      setPhone(editingMember.phone);
      setAddress(editingMember.address);
      setStatus(editingMember.status);
      setNotes(editingMember.notes || '');
      setErrors({});
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('active');
      setNotes('');
      setErrors({});
    }
  }, [editingMember, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status,
      notes: notes.trim(),
    };

    const validation = validateMember(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(payload, editingMember?.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMember ? "Modifier l'adhérent" : 'Inscrire un nouvel adhérent'}
      subtitle="Saisissez les coordonnées et informations administratives du lecteur."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom complet */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nom complet *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex: Camille Claudel"
            className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
              errors.fullName
                ? 'border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
          {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
        </div>

        {/* Email & Téléphone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="camille@email.fr"
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                errors.email
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Téléphone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 dark:text-white ${
                errors.phone
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Adresse postale
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: 12 Rue de la République, 75011 Paris"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Statut du compte
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="memberStatus"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Actif (autorisé à emprunter)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="memberStatus"
                checked={status === 'inactive'}
                onChange={() => setStatus('inactive')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-500">Inactif (cotisation suspendue)</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Observations
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Remarques éventuelles sur l'adhésion..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm shadow-indigo-600/30"
          >
            {editingMember ? 'Enregistrer les modifications' : "Créer l'adhérent"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
