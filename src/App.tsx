/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { db } from './services/db';
import { Book, Member, Loan, LibrarySettings } from './types';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { BooksView } from './components/books/BooksView';
import { BookModal } from './components/books/BookModal';
import { BookDetailModal } from './components/books/BookDetailModal';
import { MembersView } from './components/members/MembersView';
import { MemberModal } from './components/members/MemberModal';
import { MemberDetailModal } from './components/members/MemberDetailModal';
import { LoansView } from './components/loans/LoansView';
import { NewLoanModal } from './components/loans/NewLoanModal';
import { ReturnsView } from './components/returns/ReturnsView';
import { OverdueView } from './components/overdue/OverdueView';
import { StatsView } from './components/stats/StatsView';
import { SettingsView } from './components/settings/SettingsView';
import { ClientPortalView } from './components/client/ClientPortalView';

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { addToast, refreshNotifications } = useNotification();

  // Mode: 'admin' (Gestionnaire) or 'client' (Espace Lecteur / Public)
  const [appMode, setAppMode] = useState<'admin' | 'client'>(() => {
    return (localStorage.getItem('bibliotech_app_mode') as 'admin' | 'client') || 'admin';
  });

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data
  const [books, setBooks] = useState<Book[]>(() => db.getBooks());
  const [members, setMembers] = useState<Member[]>(() => db.getMembers());
  const [loans, setLoans] = useState<Loan[]>(() => db.getLoans());
  const [settings, setSettings] = useState<LibrarySettings>(() => db.getSettings());

  // Selected client member for Client Mode
  const [currentClientMember, setCurrentClientMember] = useState<Member>(() => {
    const list = db.getMembers();
    const savedId = localStorage.getItem('bibliotech_client_member_id');
    const found = list.find((m) => m.id === savedId);
    return found || list[0];
  });

  const handleSelectClientMember = (m: Member) => {
    setCurrentClientMember(m);
    localStorage.setItem('bibliotech_client_member_id', m.id);
  };

  const handleSwitchMode = (mode: 'admin' | 'client') => {
    setAppMode(mode);
    localStorage.setItem('bibliotech_app_mode', mode);
  };

  // Reload data from DB
  const reloadData = useCallback(() => {
    db.refreshLoanStatuses();
    setBooks(db.getBooks());
    setMembers(db.getMembers());
    setLoans(db.getLoans());
    setSettings(db.getSettings());
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Modals state
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [preselectedMemberForLoan, setPreselectedMemberForLoan] = useState<Member | null>(null);
  const [preselectedBookForLoan, setPreselectedBookForLoan] = useState<Book | null>(null);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isBookDetailOpen, setIsBookDetailOpen] = useState(false);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Return modal handler from anywhere
  const [loanToReturnDirectly, setLoanToReturnDirectly] = useState<Loan | null>(null);

  // Handlers - Books
  const handleSaveBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'status'>, bookId?: string) => {
    try {
      if (bookId) {
        db.updateBook(bookId, bookData);
        addToast('success', `L'ouvrage "${bookData.title}" a été modifié.`, 'Livre mis à jour');
      } else {
        const created = db.createBook(bookData);
        addToast('success', `L'ouvrage "${created.title}" a été ajouté au catalogue.`, 'Nouveau livre');
      }
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’enregistrement du livre.', 'Erreur');
    }
  };

  const handleDeleteBook = (bookId: string) => {
    try {
      const res = db.deleteBook(bookId);
      addToast('success', res.message, 'Livre supprimé');
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Impossible de supprimer ce livre.', 'Erreur suppression');
    }
  };

  // Handlers - Members
  const handleSaveMember = (
    memberData: Omit<Member, 'id' | 'membershipDate'>,
    memberId?: string
  ) => {
    try {
      if (memberId) {
        db.updateMember(memberId, memberData);
        addToast('success', `La fiche de ${memberData.fullName} a été modifiée.`, 'Adhérent mis à jour');
      } else {
        const created = db.createMember(memberData);
        addToast('success', `L'adhérent ${created.fullName} (${created.id}) a été inscrit.`, 'Nouvel adhérent');
      }
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’enregistrement de l’adhérent.', 'Erreur');
    }
  };

  const handleDeleteMember = (memberId: string) => {
    try {
      const res = db.deleteMember(memberId);
      addToast('success', res.message, 'Adhérent supprimé');
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Impossible de supprimer cet adhérent.', 'Erreur suppression');
    }
  };

  // Handlers - Loans
  const handleCreateLoan = (
    memberId: string,
    bookIds: string[],
    durationDays: number,
    notes?: string
  ) => {
    try {
      const created = db.createLoansForMember(memberId, bookIds, durationDays, notes);
      addToast(
        'success',
        `${created.length} ouvrage(s) emprunté(s) avec succès. Stock(s) mis à jour.`,
        'Emprunt enregistré'
      );
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de l’enregistrement de l’emprunt.', 'Erreur');
    }
  };

  const handleReturnLoan = (loanId: string, notes?: string) => {
    try {
      const returned = db.returnLoan(loanId, notes);
      addToast(
        'success',
        `Le livre "${returned.bookTitle}" a été restitué. Stock réapprovisionné.`,
        'Retour enregistré'
      );
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la restitution.', 'Erreur');
    }
  };

  const handleRenewLoan = (loanId: string) => {
    try {
      const renewed = db.renewLoan(loanId, settings.renewalDurationDays || 14);
      addToast(
        'success',
        `L'emprunt a été prolongé jusqu'au ${renewed.dueDate}.`,
        'Prolongation accordée'
      );
      reloadData();
    } catch (err: any) {
      addToast('error', err.message || 'Impossible de prolonger cet emprunt.', 'Erreur');
    }
  };

  // Quick Action Bridges
  const openNewLoanWithBook = (book: Book) => {
    setPreselectedBookForLoan(book);
    setPreselectedMemberForLoan(null);
    setIsNewLoanOpen(true);
  };

  const openNewLoanWithMember = (member: Member) => {
    setPreselectedMemberForLoan(member);
    setPreselectedBookForLoan(null);
    setIsNewLoanOpen(true);
  };

  // Client Mode render
  if (appMode === 'client') {
    return (
      <>
        <ToastContainer />
        <ClientPortalView
          books={books}
          loans={loans}
          members={members}
          settings={settings}
          currentMember={currentClientMember}
          onSelectMember={handleSelectClientMember}
          onSwitchToAdmin={() => handleSwitchMode('admin')}
          onRefreshData={reloadData}
        />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onEnterClientMode={() => handleSwitchMode('client')}
        onLoginSuccessRole={(role) => {
          if (role === 'reader') {
            handleSwitchMode('client');
          } else {
            handleSwitchMode('admin');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* Toast Manager */}
      <ToastContainer />

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSwitchToClientMode={() => handleSwitchMode('client')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNavigate={setCurrentTab}
          onOpenNewLoanModal={() => {
            setPreselectedMemberForLoan(null);
            setPreselectedBookForLoan(null);
            setIsNewLoanOpen(true);
          }}
          onSelectBook={(b) => {
            setViewingBook(b);
            setIsBookDetailOpen(true);
          }}
          onSelectMember={(m) => {
            setViewingMember(m);
            setIsMemberDetailOpen(true);
          }}
          onSwitchToClientMode={() => handleSwitchMode('client')}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              books={books}
              members={members}
              loans={loans}
              onNavigate={setCurrentTab}
              onOpenNewLoanModal={() => {
                setPreselectedMemberForLoan(null);
                setPreselectedBookForLoan(null);
                setIsNewLoanOpen(true);
              }}
              onOpenNewBookModal={() => {
                setEditingBook(null);
                setIsBookModalOpen(true);
              }}
              onOpenReturnModal={(loan) => handleReturnLoan(loan.id)}
            />
          )}

          {currentTab === 'books' && (
            <BooksView
              books={books}
              loans={loans}
              onOpenAddModal={() => {
                setEditingBook(null);
                setIsBookModalOpen(true);
              }}
              onEditBook={(book) => {
                setEditingBook(book);
                setIsBookModalOpen(true);
              }}
              onViewBook={(book) => {
                setViewingBook(book);
                setIsBookDetailOpen(true);
              }}
              onDeleteBook={handleDeleteBook}
              onBorrowBook={openNewLoanWithBook}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'members' && (
            <MembersView
              members={members}
              loans={loans}
              onOpenAddModal={() => {
                setEditingMember(null);
                setIsMemberModalOpen(true);
              }}
              onEditMember={(member) => {
                setEditingMember(member);
                setIsMemberModalOpen(true);
              }}
              onViewMember={(member) => {
                setViewingMember(member);
                setIsMemberDetailOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
              onNewLoanForMember={openNewLoanWithMember}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'loans' && (
            <LoansView
              loans={loans}
              onOpenNewLoanModal={() => {
                setPreselectedMemberForLoan(null);
                setPreselectedBookForLoan(null);
                setIsNewLoanOpen(true);
              }}
              onReturnLoan={(loan) => handleReturnLoan(loan.id)}
              onRenewLoan={handleRenewLoan}
            />
          )}

          {currentTab === 'returns' && (
            <ReturnsView
              loans={loans}
              onConfirmReturn={handleReturnLoan}
            />
          )}

          {currentTab === 'overdue' && (
            <OverdueView
              loans={loans}
              onReturnLoan={(loan) => handleReturnLoan(loan.id)}
            />
          )}

          {currentTab === 'stats' && (
            <StatsView books={books} members={members} loans={loans} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(s) => {
                db.setSettings(s);
                setSettings(s);
              }}
              onResetDemoData={() => {
                db.resetToDemo();
                reloadData();
                addToast('info', 'Données de démonstration réinitialisées avec succès.', 'Réinitialisation');
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. New Loan Modal */}
      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => {
          setIsNewLoanOpen(false);
          setPreselectedMemberForLoan(null);
          setPreselectedBookForLoan(null);
        }}
        members={members}
        books={books}
        preselectedMember={preselectedMemberForLoan}
        preselectedBook={preselectedBookForLoan}
        defaultDurationDays={settings.defaultBorrowDurationDays || settings.defaultLoanDurationDays || 21}
        onSubmit={handleCreateLoan}
      />

      {/* 2. Book Add/Edit Modal */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingBook(null);
        }}
        onSave={handleSaveBook}
        editingBook={editingBook}
      />

      {/* 3. Book Detail Modal */}
      <BookDetailModal
        book={viewingBook}
        isOpen={isBookDetailOpen}
        onClose={() => {
          setIsBookDetailOpen(false);
          setViewingBook(null);
        }}
        loans={loans}
        onBorrowBook={openNewLoanWithBook}
        onEditBook={(book) => {
          setEditingBook(book);
          setIsBookModalOpen(true);
        }}
      />

      {/* 4. Member Add/Edit Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        editingMember={editingMember}
      />

      {/* 5. Member Detail Modal */}
      <MemberDetailModal
        member={viewingMember}
        isOpen={isMemberDetailOpen}
        onClose={() => {
          setIsMemberDetailOpen(false);
          setViewingMember(null);
        }}
        loans={loans}
        onNewLoanForMember={openNewLoanWithMember}
        onReturnLoan={(loan) => handleReturnLoan(loan.id)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
