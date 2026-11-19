import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/db';
import {
  Library,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface LoginViewProps {
  onEnterClientMode?: () => void;
  onLoginSuccessRole?: (role: 'admin' | 'librarian' | 'reader') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onEnterClientMode, onLoginSuccessRole }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Google OAuth modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.success) {
      setError(res.error || 'Identifiants invalides.');
    } else {
      const u = db.getCurrentUser();
      if (u && onLoginSuccessRole) {
        onLoginSuccessRole(u.role);
      }
    }
  };

  const handleQuickLoginAdmin = () => {
    setEmail('admin');
    setPassword('admin123');
    const res = login('admin', 'admin123');
    if (res.success) {
      onLoginSuccessRole?.('admin');
    }
  };

  const handleGoogleSignIn = (googleEmailToUse: string, googleName: string) => {
    setGoogleError('');
    const authResult = db.authenticateGoogleUser(googleEmailToUse, googleName);
    if (!authResult.success) {
      // Exact error message required:
      // "Accès refusé. Votre compte n'est pas autorisé à accéder à la bibliothèque universitaire."
      setGoogleError(
        authResult.error ||
          "Accès refusé. Votre compte n'est pas autorisé à accéder à la bibliothèque universitaire."
      );
      return;
    }

    setIsGoogleModalOpen(false);
    // Role-based routing
    if (authResult.user?.role === 'reader') {
      onLoginSuccessRole?.('reader');
      onEnterClientMode?.();
    } else {
      onLoginSuccessRole?.(authResult.user?.role || 'admin');
    }
  };

  const demoGoogleAccounts = [
    {
      name: 'Mohammed Eddarraz',
      email: 'mohammed.eddarraz3@usmba.ac.ma',
      role: 'reader' as const,
      roleLabel: 'Étudiant Vérifié — Ingénierie Logicielle (2A)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      badge: 'Email Universitaire Validé',
    },
    {
      name: 'Sophie Valois',
      email: 'admin@smartlibrary.fr',
      role: 'admin' as const,
      roleLabel: 'Administratrice Principale (Gestion)',
      avatar: '/src/assets/images/avatar_librarian_admin_1791278460849.jpg',
      badge: 'Accès Total Administrateur',
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white text-center">
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center mx-auto mb-3 shadow-md ring-4 ring-white/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Smart Library</h1>
          <p className="text-xs text-indigo-200 font-medium mt-1">
            Bibliothèque Universitaire Privée
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] text-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Filière Ingénierie Logicielle — 2ème année</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Notice: Restricted Access */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Accès strictement restreint aux étudiants autorisés de la promotion et au personnel administratif.
            </span>
          </div>

          {/* Google OAuth Button (Primary method for students) */}
          <div>
            <button
              type="button"
              onClick={() => {
                setGoogleError('');
                setIsGoogleModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuer avec Google (OAuth Étudiant / Personnel)</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                  ou connexion administrateur
                </span>
              </div>
            </div>
          </div>

          {/* Standard Login Form for Admin / Dev */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identifiant ou adresse email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-xs shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Administrator Demo Credentials Box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Compte Administrateur (Démo locale)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/60 font-mono font-bold">
                  DEV ONLY
                </span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                Identifiant : <code className="font-mono font-bold bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded">admin</code> · Mot de passe : <code className="font-mono font-bold bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded">admin123</code>
              </p>
              <button
                type="button"
                onClick={handleQuickLoginAdmin}
                className="mt-2 w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Connexion Rapide Administrateur (1 clic)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[9px] text-amber-600/80 dark:text-amber-400/70 mt-1.5 leading-tight">
                * Note de sécurité : ces identifiants sont strictement limités au mode démonstration local. En production, hachage renforcé et vérification de rôle serveur requis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Authentication Dialog Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Connexion Google Sign-In (OAuth)"
        subtitle="Vérification stricte de l'autorisation universitaire pour les étudiants de la promotion Ingénierie Logicielle (2A)."
        maxWidth="md"
      >
        <div className="space-y-4">
          {googleError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{googleError}</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                  Seuls les étudiants dont le courriel officiel a été importé et validé par l'administrateur via Excel peuvent accéder à l'application.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Comptes pré-autorisés et validés :
          </p>

          <div className="space-y-2">
            {demoGoogleAccounts.map((acc, idx) => (
              <div
                key={idx}
                onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={acc.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {acc.email}
                    </p>
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block mt-0.5">
                      {acc.roleLabel}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>

          {/* Test Custom Google Email for Authorization Check */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tester une autre adresse Google (Vérification en temps réel) :
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="prenom.nom@gmail.com ou etudiant@usmba.ac.ma"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!customGoogleEmail.trim()) return;
                  handleGoogleSignIn(customGoogleEmail.trim(), customGoogleEmail.split('@')[0]);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              >
                Vérifier
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Si l'adresse saisie n'a pas été importée et validée via Excel par l'administrateur, le message <span className="font-semibold text-rose-600 dark:text-rose-400">"Accès refusé. Votre compte n'est pas autorisé à accéder à la bibliothèque universitaire."</span> sera affiché.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
