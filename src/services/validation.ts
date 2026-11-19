import { Book, Loan, Member, AuthorizedUser, PhysicalCopy } from '../types';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/[\s\.\-\(\)]/g, '');
  return clean.length >= 8;
}

export function isValidISBN(isbn: string): boolean {
  const clean = isbn.replace(/[\s\-]/g, '');
  if (clean.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(clean[i], 10);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }
    const lastChar = clean[9].toUpperCase();
    const lastVal = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    if (isNaN(lastVal)) return false;
    sum += lastVal;
    return sum % 11 === 0;
  } else if (clean.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(clean[i], 10);
      if (isNaN(digit)) return false;
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(clean[12], 10);
    return checkDigit === lastDigit;
  }
  return /^[0-9]{9,13}[0-9Xx]?$/.test(clean);
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateBook(book: Partial<Book>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!book.title?.trim()) {
    errors.title = 'Le titre du livre est obligatoire.';
  }

  if (!book.author?.trim()) {
    errors.author = "L'auteur du livre est obligatoire.";
  }

  if (!book.category?.trim()) {
    errors.category = 'La catégorie est obligatoire.';
  }

  if (!book.isbn?.trim()) {
    errors.isbn = 'Le code ISBN est obligatoire.';
  } else if (!isValidISBN(book.isbn)) {
    errors.isbn = 'Format ISBN invalide (ex: 978-2-07-061275-8 ou 10/13 chiffres).';
  }

  if (
    book.publicationYear &&
    (book.publicationYear < 1000 || book.publicationYear > new Date().getFullYear() + 2)
  ) {
    errors.publicationYear = "L'année de publication est invalide.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateMember(member: Partial<Member>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!member.fullName?.trim()) {
    errors.fullName = 'Le nom complet est obligatoire.';
  }

  if (!member.email?.trim()) {
    errors.email = "L'adresse email est obligatoire.";
  } else if (!isValidEmail(member.email)) {
    errors.email = 'Format d’email invalide (ex: adherent@exemple.fr).';
  }

  if (!member.phone?.trim()) {
    errors.phone = 'Le numéro de téléphone est obligatoire.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAuthorizedUser(user: Partial<AuthorizedUser>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!user.fullName?.trim()) {
    errors.fullName = 'Le nom complet est obligatoire.';
  }

  if (!user.email?.trim()) {
    errors.email = "L'adresse email est obligatoire.";
  } else if (!isValidEmail(user.email)) {
    errors.email = 'Format d’email invalide (ex: utilisateur@domaine.fr).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function canDeleteBook(bookId: string, loans: Loan[]): { allowed: boolean; reason?: string } {
  const activeLoans = loans.filter(
    (l) => l.bookId === bookId && (l.status === 'active' || l.status === 'overdue')
  );
  if (activeLoans.length > 0) {
    return {
      allowed: false,
      reason: `Impossible de supprimer ce livre : il y a actuellement ${activeLoans.length} emprunt(s) actif(s) en cours.`,
    };
  }
  return { allowed: true };
}

export function canDeleteMember(memberId: string, loans: Loan[]): { allowed: boolean; reason?: string } {
  const activeLoans = loans.filter(
    (l) => (l.userId === memberId || l.memberId === memberId) && (l.status === 'active' || l.status === 'overdue')
  );
  if (activeLoans.length > 0) {
    return {
      allowed: false,
      reason: `Impossible de supprimer cet adhérent : il a actuellement ${activeLoans.length} emprunt(s) actif(s) en cours.`,
    };
  }
  return { allowed: true };
}

export function canDeletePhysicalCopy(copyId: string, loans: Loan[]): { allowed: boolean; reason?: string } {
  const activeLoan = loans.find(
    (l) => l.copyId === copyId && (l.status === 'active' || l.status === 'overdue')
  );
  if (activeLoan) {
    return {
      allowed: false,
      reason: `Cet exemplaire (${copyId}) est actuellement emprunté par ${activeLoan.userName || activeLoan.memberName}. Restituez-le d'abord.`,
    };
  }
  return { allowed: true };
}
