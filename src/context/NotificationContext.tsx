import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { db } from '../services/db';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);

    // Auto dismiss after 4.5s
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const refreshNotifications = useCallback(() => {
    const loans = db.getLoans();
    const books = db.getBooks();
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    const notifs: AppNotification[] = [];

    // 1. Overdue loans
    loans.forEach((loan) => {
      if (loan.status === 'overdue') {
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(loan.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        notifs.push({
          id: `notif-overdue-${loan.id}`,
          type: 'overdue',
          title: 'Emprunt en retard',
          message: `Le livre "${loan.bookTitle}" emprunté par ${loan.memberName} a un retard de ${diffDays} jour(s).`,
          timestamp: loan.dueDate,
          read: false,
          linkTab: 'overdue',
        });
      }
    });

    // 2. Loans due soon (due within next 3 days)
    loans.forEach((loan) => {
      if (loan.status === 'active' && !loan.returnDate) {
        const dueDate = new Date(loan.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          notifs.push({
            id: `notif-duesoon-${loan.id}`,
            type: 'due_soon',
            title: 'Retour imminent',
            message: `"${loan.bookTitle}" (${loan.memberName}) doit être retourné dans ${diffDays === 0 ? "aujourd'hui" : diffDays + ' jour(s)'}.`,
            timestamp: loan.dueDate,
            read: false,
            linkTab: 'returns',
          });
        }
      }
    });

    // 3. Books out of stock / unavailable
    books.forEach((book) => {
      if (book.availableQuantity === 0 && book.totalQuantity > 0) {
        notifs.push({
          id: `notif-stock-${book.id}`,
          type: 'unavailable',
          title: 'Exemplaires épuisés',
          message: `Tous les exemplaires du livre "${book.title}" sont actuellement empruntés.`,
          timestamp: todayStr,
          read: false,
          linkTab: 'books',
        });
      }
    });

    setNotifications(notifs);
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
