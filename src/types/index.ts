export type UserRole = 'admin' | 'librarian' | 'reader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isAuthorized: boolean;
  googleId?: string;
  createdAt: string;
  password?: string;
}

export interface AuthorizedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  addedAt: string;
  notes?: string;
  studentId?: string;
}

export interface Student {
  id: string;
  studentNumber: string; // Matricule / CNE (ex: IL2-2024-001)
  lastName: string;
  firstName: string;
  fullName: string;
  filiere: string; // 'Ingénierie Logicielle – 2ème année'
  email?: string; // Empty until imported via Excel or validated
  isEmailVerified: boolean;
  isAuthorized: boolean;
  registeredDate: string;
  notes?: string;
}

export type MemberStatus = 'active' | 'inactive' | 'suspended';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  membershipDate: string;
  status: MemberStatus;
  notes?: string;
  role?: UserRole;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservationDate: string;
  status: 'pending' | 'ready' | 'cancelled' | 'fulfilled';
  bookCoverUrl?: string;
  notes?: string;
}

export type CopyStatus = 'available' | 'borrowed' | 'maintenance' | 'lost';

export interface PhysicalCopy {
  id: string; // Ex: EX-978001-01
  barcode: string;
  bookId: string;
  status: CopyStatus;
  condition: 'Neuf' | 'Très bon état' | 'Bon état' | 'Usé' | 'Dégradé';
  shelfLocation: string;
  acquiredDate: string;
  notes?: string;
}

export type BookAvailabilityStatus = 'available' | 'all_borrowed' | 'inactive_copies';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  category: string;
  description: string;
  coverImage: string;
  coverUrl?: string;
  totalQuantity: number;
  availableQuantity: number;
  totalCopies?: number;
  availableCopies?: number;
  borrowedCopies?: number;
  shelfLocation?: string;
  location?: string;
  status?: 'available' | 'borrowed' | 'unavailable';
  createdAt: string;
}

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  bookCoverImage?: string;
  bookCoverUrl?: string;
  copyId: string;
  copyBarcode?: string;
  borrowDate: string; // YYYY-MM-DD
  loanDate: string; // YYYY-MM-DD (compatibility)
  expectedReturnDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (compatibility)
  actualReturnDate: string | null;
  returnDate: string | null; // compatibility
  overdueDays: number;
  status: LoanStatus;
  notes?: string;
}

export interface LibrarySettings {
  libraryName: string;
  address: string;
  phone: string;
  email: string;
  defaultBorrowDurationDays: number;
  defaultLoanDurationDays?: number; // compatibility alias
  maxBooksPerUser: number;
  maxBooksPerMember?: number; // compatibility alias
  overdueThresholdOrangeDays: number; // default 1 to 3
  overdueThresholdRedDays: number; // default 4+
  allowRenewal: boolean;
  renewalDurationDays: number;
}

export interface AppNotification {
  id: string;
  type: 'overdue' | 'upcoming' | 'due_soon' | 'unavailable' | 'new_loan' | 'info';
  title: string;
  message: string;
  date?: string;
  timestamp?: string;
  read: boolean;
  linkTab?: string;
}

export interface GoogleBookMetadata {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  thumbnail?: string;
  isbn10?: string;
  isbn13?: string;
}

export interface ExcelImportRow {
  rowNumber: number;
  data: Record<string, any>;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ExcelImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedCount: number;
}
