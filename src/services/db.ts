import {
  Book,
  PhysicalCopy,
  AuthorizedUser,
  Member,
  Reservation,
  Loan,
  User,
  LibrarySettings,
  Student,
} from '../types';
import {
  SEED_SETTINGS,
  SEED_STUDENTS,
  SEED_AUTHORIZED_USERS,
  SEED_MEMBERS,
  SEED_BOOKS_RAW,
  generateSeedCopies,
  generateSeedLoans,
} from '../data/seedData';

const STORAGE_KEYS = {
  BOOKS: 'smartlib_books_v4',
  COPIES: 'smartlib_copies_v4',
  MEMBERS: 'smartlib_members_v4',
  AUTHORIZED_USERS: 'smartlib_authorized_users_v4',
  LOANS: 'smartlib_loans_v4',
  RESERVATIONS: 'smartlib_reservations_v4',
  CURRENT_USER: 'smartlib_current_user_v4',
  SETTINGS: 'smartlib_settings_v4',
  STUDENTS: 'smartlib_students_v4',
};

class SmartLibraryDB {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setSettings(SEED_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      this.setStudents(SEED_STUDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUTHORIZED_USERS)) {
      this.setAuthorizedUsers(SEED_AUTHORIZED_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      this.setMembers(SEED_MEMBERS);
    }

    let currentCopies = this.getCopies();
    if (!localStorage.getItem(STORAGE_KEYS.COPIES)) {
      currentCopies = generateSeedCopies();
      this.setCopies(currentCopies);
    }

    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
      const initialBooks: Book[] = SEED_BOOKS_RAW.map((b) => {
        const bookCopies = currentCopies.filter((c) => c.bookId === b.id);
        const total = bookCopies.length;
        const available = bookCopies.filter((c) => c.status === 'available').length;
        const borrowed = bookCopies.filter((c) => c.status === 'borrowed').length;
        return {
          ...b,
          totalQuantity: total,
          availableQuantity: available,
          totalCopies: total,
          availableCopies: available,
          borrowedCopies: borrowed,
          location: b.shelfLocation,
          coverUrl: b.coverImage,
          status: available > 0 ? 'available' : 'unavailable',
        };
      });
      this.setBooks(initialBooks);
    }

    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
      const initialLoans = generateSeedLoans(currentCopies);
      this.setLoans(initialLoans);
    }

    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      const admin = SEED_AUTHORIZED_USERS[0];
      this.setCurrentUser({
        id: admin.id,
        name: admin.fullName,
        email: admin.email,
        role: admin.role,
        isAuthorized: true,
        avatarUrl: '/src/assets/images/avatar_librarian_admin_1791278460849.jpg',
        createdAt: admin.addedAt,
      });
    }

    this.refreshLoanStatuses();
    this.recomputeAllBookCounts();
  }

  // --- SETTINGS ---
  public getSettings(): LibrarySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : SEED_SETTINGS;
    } catch {
      return SEED_SETTINGS;
    }
  }

  public setSettings(s: LibrarySettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
  }

  // --- STUDENTS (PROMOTION INGÉNIERIE LOGICIELLE - 2ÈME ANNÉE) ---
  public getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : SEED_STUDENTS;
    } catch {
      return SEED_STUDENTS;
    }
  }

  public setStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  }

  public updateStudent(id: string, updates: Partial<Student>): Student {
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Étudiant introuvable.');

    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.setStudents(list);

    // If student has a verified email and is marked authorized, synchronize whitelist
    if (updated.email && updated.isAuthorized) {
      const authList = this.getAuthorizedUsers();
      const cleanEmail = updated.email.trim().toLowerCase();
      const existingAuth = authList.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existingAuth) {
        existingAuth.fullName = updated.fullName;
        existingAuth.status = 'active';
        existingAuth.studentId = updated.id;
        this.setAuthorizedUsers(authList);
      } else {
        authList.unshift({
          id: `AUTH-${updated.studentNumber}`,
          email: cleanEmail,
          fullName: updated.fullName,
          role: 'reader',
          status: 'active',
          addedAt: new Date().toISOString().split('T')[0],
          notes: `Étudiant ${updated.filiere} (Matricule: ${updated.studentNumber})`,
          studentId: updated.id,
        });
        this.setAuthorizedUsers(authList);
      }

      // Also ensure member entry exists
      const members = this.getMembers();
      if (!members.some((m) => m.email.toLowerCase() === cleanEmail)) {
        members.unshift({
          id: `AUTH-${updated.studentNumber}`,
          fullName: updated.fullName,
          email: cleanEmail,
          phone: '06 00 00 00 00',
          address: 'Campus Universitaire',
          membershipDate: new Date().toISOString().split('T')[0],
          status: 'active',
          notes: `Étudiant ${updated.filiere}`,
          role: 'reader',
        });
        this.setMembers(members);
      }
    } else if (updated.email && !updated.isAuthorized) {
      // Deactivate in whitelist if revoked
      const authList = this.getAuthorizedUsers();
      const cleanEmail = updated.email.trim().toLowerCase();
      const existingAuth = authList.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingAuth) {
        existingAuth.status = 'suspended';
        this.setAuthorizedUsers(authList);
      }
    }

    return updated;
  }

  public matchAndImportStudentEmails(
    rows: Array<{
      studentNumber?: string;
      cne?: string;
      lastName?: string;
      firstName?: string;
      fullName?: string;
      email: string;
    }>
  ): {
    matchedCount: number;
    unmatchedRows: any[];
    updatedStudents: Student[];
  } {
    const students = this.getStudents();
    const unmatchedRows: any[] = [];
    let matchedCount = 0;

    rows.forEach((row) => {
      const cleanEmail = (row.email || '').trim().toLowerCase();
      if (!cleanEmail) {
        unmatchedRows.push({ ...row, reason: 'Email manquant' });
        return;
      }

      // Try matching by studentNumber / CNE
      const targetNum = (row.studentNumber || row.cne || '').trim().toUpperCase();
      let matchedIndex = -1;

      if (targetNum) {
        matchedIndex = students.findIndex(
          (s) => s.studentNumber.toUpperCase() === targetNum || s.id.toUpperCase() === targetNum
        );
      }

      // If not matched by number, try matching by name
      if (matchedIndex === -1 && (row.lastName || row.fullName)) {
        const last = (row.lastName || '').trim().toLowerCase();
        const first = (row.firstName || '').trim().toLowerCase();
        const full = (row.fullName || '').trim().toLowerCase();

        matchedIndex = students.findIndex((s) => {
          const sLast = s.lastName.toLowerCase();
          const sFirst = s.firstName.toLowerCase();
          const sFull = s.fullName.toLowerCase();
          if (last && first && (sLast.includes(last) || last.includes(sLast)) && (sFirst.includes(first) || first.includes(sFirst))) return true;
          if (full && (sFull.includes(full) || full.includes(sLast))) return true;
          if (last && sLast === last) return true;
          return false;
        });
      }

      if (matchedIndex !== -1) {
        students[matchedIndex].email = cleanEmail;
        students[matchedIndex].isEmailVerified = true;
        students[matchedIndex].isAuthorized = true;
        matchedCount++;

        // Add or update whitelist
        try {
          const authList = this.getAuthorizedUsers();
          const existingAuth = authList.find((u) => u.email.toLowerCase() === cleanEmail);
          if (existingAuth) {
            existingAuth.status = 'active';
            existingAuth.fullName = students[matchedIndex].fullName;
            existingAuth.studentId = students[matchedIndex].id;
            this.setAuthorizedUsers(authList);
          } else {
            authList.unshift({
              id: `AUTH-${students[matchedIndex].studentNumber}`,
              email: cleanEmail,
              fullName: students[matchedIndex].fullName,
              role: 'reader',
              status: 'active',
              addedAt: new Date().toISOString().split('T')[0],
              notes: `Étudiant ${students[matchedIndex].filiere}`,
              studentId: students[matchedIndex].id,
            });
            this.setAuthorizedUsers(authList);
          }

          // Ensure member entry
          const members = this.getMembers();
          if (!members.some((m) => m.email.toLowerCase() === cleanEmail)) {
            members.unshift({
              id: `AUTH-${students[matchedIndex].studentNumber}`,
              fullName: students[matchedIndex].fullName,
              email: cleanEmail,
              phone: '06 00 00 00 00',
              address: 'Campus Universitaire',
              membershipDate: new Date().toISOString().split('T')[0],
              status: 'active',
              notes: `Étudiant ${students[matchedIndex].filiere}`,
              role: 'reader',
            });
            this.setMembers(members);
          }
        } catch (e) {
          console.warn('Sync whitelist error:', e);
        }
      } else {
        unmatchedRows.push({ ...row, reason: 'Aucun étudiant correspondant dans la promotion officielle' });
      }
    });

    this.setStudents(students);
    return {
      matchedCount,
      unmatchedRows,
      updatedStudents: students,
    };
  }

  // --- AUTHORIZED USERS (WHITELIST) ---
  public getAuthorizedUsers(): AuthorizedUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTHORIZED_USERS);
      return data ? JSON.parse(data) : SEED_AUTHORIZED_USERS;
    } catch {
      return SEED_AUTHORIZED_USERS;
    }
  }

  public setAuthorizedUsers(users: AuthorizedUser[]): void {
    localStorage.setItem(STORAGE_KEYS.AUTHORIZED_USERS, JSON.stringify(users));
  }

  public isEmailAuthorized(email: string): AuthorizedUser | undefined {
    const list = this.getAuthorizedUsers();
    const clean = email.trim().toLowerCase();
    return list.find((u) => u.email.toLowerCase() === clean && u.status === 'active');
  }

  public addAuthorizedUser(user: Omit<AuthorizedUser, 'id' | 'addedAt'>): AuthorizedUser {
    const list = this.getAuthorizedUsers();
    const cleanEmail = user.email.trim().toLowerCase();
    if (list.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`L'adresse email ${user.email} est déjà autorisée.`);
    }

    const newUser: AuthorizedUser = {
      ...user,
      id: `AUTH-${String(list.length + 1).padStart(3, '0')}`,
      email: cleanEmail,
      addedAt: new Date().toISOString().split('T')[0],
    };

    list.unshift(newUser);
    this.setAuthorizedUsers(list);

    // Also auto-sync as Member if not already present
    const members = this.getMembers();
    if (!members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      members.unshift({
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: '06 00 00 00 00',
        address: 'Bibliothèque Centrale',
        membershipDate: newUser.addedAt,
        status: 'active',
        notes: newUser.notes || 'Inscrit via liste autorisée',
        role: newUser.role,
      });
      this.setMembers(members);
    }

    return newUser;
  }

  public updateAuthorizedUser(id: string, updates: Partial<AuthorizedUser>): AuthorizedUser {
    const list = this.getAuthorizedUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Utilisateur introuvable.');

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    this.setAuthorizedUsers(list);
    return updated;
  }

  public deleteAuthorizedUser(id: string): void {
    const loans = this.getActiveLoansByUser(id);
    if (loans.length > 0) {
      throw new Error(`Impossible de supprimer cet utilisateur : il a ${loans.length} emprunt(s) en cours.`);
    }
    const list = this.getAuthorizedUsers().filter((u) => u.id !== id);
    this.setAuthorizedUsers(list);
  }

  // --- MEMBERS ---
  public getMembers(): Member[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return data ? JSON.parse(data) : SEED_MEMBERS;
    } catch {
      return SEED_MEMBERS;
    }
  }

  public setMembers(members: Member[]): void {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find((m) => m.id === id);
  }

  public createMember(memberData: Omit<Member, 'id' | 'membershipDate'>): Member {
    const members = this.getMembers();
    const nextNum = members.length + 1;
    const newId = `AUTH-${String(nextNum).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newMember: Member = {
      ...memberData,
      id: newId,
      membershipDate: todayStr,
      role: memberData.role || 'reader',
    };

    members.unshift(newMember);
    this.setMembers(members);

    // Auto-authorize in whitelist
    try {
      const authList = this.getAuthorizedUsers();
      if (!authList.some((u) => u.email.toLowerCase() === newMember.email.toLowerCase())) {
        authList.unshift({
          id: newId,
          email: newMember.email.toLowerCase(),
          fullName: newMember.fullName,
          role: newMember.role || 'reader',
          status: 'active',
          addedAt: todayStr,
          notes: newMember.notes,
        });
        this.setAuthorizedUsers(authList);
      }
    } catch (err) {
      console.warn('Sync whitelist error:', err);
    }

    return newMember;
  }

  public updateMember(id: string, updates: Partial<Member>): Member {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Adhérent introuvable.');

    members[index] = { ...members[index], ...updates };
    this.setMembers(members);

    // Sync authorized users
    const authList = this.getAuthorizedUsers();
    const authIndex = authList.findIndex((u) => u.id === id || u.email === members[index].email);
    if (authIndex !== -1) {
      authList[authIndex].fullName = members[index].fullName;
      if (updates.email) authList[authIndex].email = updates.email;
      this.setAuthorizedUsers(authList);
    }

    return members[index];
  }

  public deleteMember(id: string): { success: boolean; message: string } {
    const loans = this.getActiveLoansByUser(id);
    if (loans.length > 0) {
      throw new Error(`Impossible de supprimer cet adhérent : il a ${loans.length} emprunt(s) actif(s) en cours.`);
    }

    const members = this.getMembers().filter((m) => m.id !== id);
    this.setMembers(members);

    // Remove from whitelist if found
    const authList = this.getAuthorizedUsers().filter((u) => u.id !== id);
    this.setAuthorizedUsers(authList);

    return { success: true, message: "L'adhérent a été supprimé avec succès." };
  }

  // --- USERS & AUTHENTICATION (GOOGLE OAUTH CHECK & ADMIN DEMO) ---
  public getUsers(): User[] {
    const authorized = this.getAuthorizedUsers();
    const list: User[] = [
      {
        id: 'ADMIN-DEV-001',
        name: 'Sophie Valois (Administratrice)',
        email: 'admin',
        role: 'admin',
        isAuthorized: true,
        avatarUrl: '/src/assets/images/avatar_librarian_admin_1791278460849.jpg',
        createdAt: '2026-01-01',
        password: 'admin123',
      },
      {
        id: 'AUTH-001',
        name: 'Sophie Valois (Administratrice)',
        email: 'admin@smartlibrary.fr',
        role: 'admin',
        isAuthorized: true,
        avatarUrl: '/src/assets/images/avatar_librarian_admin_1791278460849.jpg',
        createdAt: '2026-01-01',
        password: 'admin123',
      },
      {
        id: 'AUTH-006',
        name: 'Marc Lefebvre (Bibliothécaire)',
        email: 'marc.biblio@smartlibrary.fr',
        role: 'librarian',
        isAuthorized: true,
        createdAt: '2026-01-10',
        password: 'biblio',
      },
    ];

    authorized.forEach((u) => {
      if (u.email !== 'admin@smartlibrary.fr' && u.email !== 'marc.biblio@smartlibrary.fr') {
        list.push({
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          isAuthorized: true,
          createdAt: u.addedAt,
          password: u.role === 'admin' ? 'admin123' : u.role === 'librarian' ? 'biblio' : 'lecteur',
        });
      }
    });

    return list;
  }

  public getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  /**
   * Google OAuth Verification:
   * Only registered and authorized emails can access the application.
   * If not authorized, returns the required exact French error message:
   * "Accès refusé. Votre compte n'est pas autorisé à accéder à la bibliothèque universitaire."
   * Access is never granted based only on matching first or last name!
   */
  public authenticateGoogleUser(
    googleEmail: string,
    googleName: string,
    avatarUrl?: string
  ): { success: boolean; user?: User; error?: string } {
    const cleanEmail = googleEmail.trim().toLowerCase();
    const authorized = this.isEmailAuthorized(cleanEmail);

    if (!authorized) {
      return {
        success: false,
        error: "Accès refusé. Votre compte n'est pas autorisé à accéder à la bibliothèque universitaire.",
      };
    }

    const user: User = {
      id: authorized.id,
      name: authorized.fullName || googleName,
      email: authorized.email,
      role: authorized.role,
      avatarUrl: avatarUrl || undefined,
      isAuthorized: true,
      googleId: 'google_' + Math.random().toString(36).substring(2, 9),
      createdAt: authorized.addedAt,
    };

    this.setCurrentUser(user);
    return { success: true, user };
  }

  // --- PHYSICAL COPIES ---
  public getCopies(): PhysicalCopy[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COPIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public setCopies(copies: PhysicalCopy[]): void {
    localStorage.setItem(STORAGE_KEYS.COPIES, JSON.stringify(copies));
    this.recomputeAllBookCounts();
  }

  public getCopiesByBook(bookId: string): PhysicalCopy[] {
    return this.getCopies().filter((c) => c.bookId === bookId);
  }

  public addPhysicalCopy(copyData: Omit<PhysicalCopy, 'id'>): PhysicalCopy {
    const copies = this.getCopies();
    const copiesForBook = copies.filter((c) => c.bookId === copyData.bookId);
    const book = this.getBookById(copyData.bookId);

    const copyNum = String(copiesForBook.length + 1).padStart(2, '0');
    const newId = `EX-${(book?.isbn || 'BOOK').slice(-8)}-${copyNum}`;

    const newCopy: PhysicalCopy = {
      ...copyData,
      id: newId,
      barcode: copyData.barcode || `BC-${Date.now().toString().slice(-6)}`,
    };

    copies.push(newCopy);
    this.setCopies(copies);
    return newCopy;
  }

  public updatePhysicalCopy(id: string, updates: Partial<PhysicalCopy>): PhysicalCopy {
    const copies = this.getCopies();
    const index = copies.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Exemplaire physique introuvable.');

    copies[index] = { ...copies[index], ...updates };
    this.setCopies(copies);
    return copies[index];
  }

  public deletePhysicalCopy(id: string): void {
    const activeLoan = this.getLoans().find(
      (l) => l.copyId === id && (l.status === 'active' || l.status === 'overdue')
    );
    if (activeLoan) {
      throw new Error(`Cet exemplaire est actuellement emprunté par ${activeLoan.userName}.`);
    }

    const copies = this.getCopies().filter((c) => c.id !== id);
    this.setCopies(copies);
  }

  // --- BOOKS ---
  public getBooks(): Book[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) return [];
      const books: Book[] = JSON.parse(data);
      // Ensure bidirectional property normalization
      return books.map((b) => ({
        ...b,
        totalQuantity: b.totalQuantity ?? b.totalCopies ?? 1,
        availableQuantity: b.availableQuantity ?? b.availableCopies ?? 0,
        totalCopies: b.totalCopies ?? b.totalQuantity ?? 1,
        availableCopies: b.availableCopies ?? b.availableQuantity ?? 0,
        borrowedCopies:
          b.borrowedCopies ??
          Math.max(
            0,
            (b.totalQuantity ?? b.totalCopies ?? 1) -
              (b.availableQuantity ?? b.availableCopies ?? 0)
          ),
        location: b.location ?? b.shelfLocation ?? 'Rayon Principal',
        shelfLocation: b.shelfLocation ?? b.location ?? 'Rayon Principal',
        coverUrl: b.coverUrl ?? b.coverImage,
        coverImage: b.coverImage ?? b.coverUrl,
      }));
    } catch {
      return [];
    }
  }

  public setBooks(books: Book[]): void {
    const normalized = books.map((b) => ({
      ...b,
      totalQuantity: b.totalQuantity ?? b.totalCopies ?? 1,
      availableQuantity: b.availableQuantity ?? b.availableCopies ?? 0,
      totalCopies: b.totalCopies ?? b.totalQuantity ?? 1,
      availableCopies: b.availableCopies ?? b.availableQuantity ?? 0,
      borrowedCopies:
        b.borrowedCopies ??
        Math.max(
          0,
          (b.totalQuantity ?? b.totalCopies ?? 1) -
            (b.availableQuantity ?? b.availableCopies ?? 0)
        ),
      location: b.location ?? b.shelfLocation ?? 'Rayon Principal',
      shelfLocation: b.shelfLocation ?? b.location ?? 'Rayon Principal',
      coverUrl: b.coverUrl ?? b.coverImage,
      coverImage: b.coverImage ?? b.coverUrl,
      status: (b.availableQuantity ?? b.availableCopies ?? 0) > 0 ? ('available' as const) : ('unavailable' as const),
    }));
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(normalized));
  }

  public getBookById(id: string): Book | undefined {
    return this.getBooks().find((b) => b.id === id);
  }

  public createBook(
    bookData: Omit<Book, 'id' | 'createdAt' | 'status' | 'totalQuantity' | 'availableQuantity'>,
    initialCopiesCount: number = 2
  ): Book {
    const books = this.getBooks();
    const nextNum = books.length + 1;
    const newId = `LIV-CS-${String(nextNum).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newBook: Book = {
      ...bookData,
      id: newId,
      totalQuantity: initialCopiesCount,
      availableQuantity: initialCopiesCount,
      totalCopies: initialCopiesCount,
      availableCopies: initialCopiesCount,
      borrowedCopies: 0,
      shelfLocation: bookData.shelfLocation || bookData.location || 'Rayon Principal',
      location: bookData.location || bookData.shelfLocation || 'Rayon Principal',
      coverImage:
        bookData.coverImage ||
        bookData.coverUrl ||
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      coverUrl:
        bookData.coverUrl ||
        bookData.coverImage ||
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      createdAt: todayStr,
    };

    books.unshift(newBook);
    this.setBooks(books);

    // Create physical copies
    const copies = this.getCopies();
    for (let i = 1; i <= initialCopiesCount; i++) {
      const copyNumStr = String(i).padStart(2, '0');
      copies.push({
        id: `EX-${newBook.isbn.slice(-8)}-${copyNumStr}`,
        barcode: `BC-${Date.now().toString().slice(-5)}${copyNumStr}`,
        bookId: newId,
        status: 'available',
        condition: 'Neuf',
        shelfLocation: newBook.shelfLocation || 'Rayon Principal',
        acquiredDate: todayStr,
        notes: 'Exemplaire initial créé avec l’ouvrage',
      });
    }
    this.setCopies(copies);

    return newBook;
  }

  public updateBook(id: string, updates: Partial<Book>): Book {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Livre introuvable.');

    books[index] = { ...books[index], ...updates };
    this.setBooks(books);
    return books[index];
  }

  public deleteBook(id: string): { success: boolean; message: string } {
    const activeLoans = this.getLoans().filter(
      (l) => l.bookId === id && (l.status === 'active' || l.status === 'overdue')
    );
    if (activeLoans.length > 0) {
      throw new Error(
        `Impossible de supprimer ce livre : ${activeLoans.length} exemplaire(s) sont actuellement empruntés.`
      );
    }

    const books = this.getBooks().filter((b) => b.id !== id);
    this.setBooks(books);

    const copies = this.getCopies().filter((c) => c.bookId !== id);
    this.setCopies(copies);

    return { success: true, message: 'Le livre et ses exemplaires ont été supprimés.' };
  }

  // --- LOANS & CIRCULATION ---
  public getLoans(): Loan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOANS);
      if (!data) return [];
      const loans: Loan[] = JSON.parse(data);
      // Normalize dates and user fields
      return loans.map((l) => ({
        ...l,
        borrowDate: l.borrowDate || l.loanDate || '',
        loanDate: l.loanDate || l.borrowDate || '',
        expectedReturnDate: l.expectedReturnDate || l.dueDate || '',
        dueDate: l.dueDate || l.expectedReturnDate || '',
        actualReturnDate: l.actualReturnDate ?? l.returnDate ?? null,
        returnDate: l.returnDate ?? l.actualReturnDate ?? null,
        memberName: l.memberName || l.userName || '',
        userName: l.userName || l.memberName || '',
        memberEmail: l.memberEmail || l.userEmail || '',
        userEmail: l.userEmail || l.memberEmail || '',
        bookCoverUrl: l.bookCoverUrl || l.bookCoverImage,
        bookCoverImage: l.bookCoverImage || l.bookCoverUrl,
      }));
    } catch {
      return [];
    }
  }

  public setLoans(loans: Loan[]): void {
    const normalized = loans.map((l) => ({
      ...l,
      borrowDate: l.borrowDate || l.loanDate || '',
      loanDate: l.loanDate || l.borrowDate || '',
      expectedReturnDate: l.expectedReturnDate || l.dueDate || '',
      dueDate: l.dueDate || l.expectedReturnDate || '',
      actualReturnDate: l.actualReturnDate ?? l.returnDate ?? null,
      returnDate: l.returnDate ?? l.actualReturnDate ?? null,
      memberName: l.memberName || l.userName || '',
      userName: l.userName || l.memberName || '',
      memberEmail: l.memberEmail || l.userEmail || '',
      userEmail: l.userEmail || l.memberEmail || '',
      bookCoverUrl: l.bookCoverUrl || l.bookCoverImage,
      bookCoverImage: l.bookCoverImage || l.bookCoverUrl,
    }));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(normalized));
  }

  public getActiveLoansByUser(userId: string): Loan[] {
    return this.getLoans().filter(
      (l) => (l.userId === userId || l.memberId === userId) && (l.status === 'active' || l.status === 'overdue')
    );
  }

  public createLoansForMember(
    memberId: string,
    bookIds: string[],
    durationDays: number = 21,
    notes?: string
  ): Loan[] {
    const member = this.getMemberById(memberId);
    if (!member) throw new Error('Adhérent introuvable.');

    const activeUserLoans = this.getActiveLoansByUser(memberId);
    const settings = this.getSettings();
    if (activeUserLoans.length + bookIds.length > settings.maxBooksPerUser) {
      throw new Error(
        `Limite d'emprunt atteinte (${settings.maxBooksPerUser} livres maximum). Cet adhérent a déjà ${activeUserLoans.length} emprunt(s) actif(s).`
      );
    }

    const copies = this.getCopies();
    const loans = this.getLoans();
    const createdLoans: Loan[] = [];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    for (const bookId of bookIds) {
      const book = this.getBookById(bookId);
      if (!book) continue;

      // Find first available physical copy
      const availableCopy = copies.find((c) => c.bookId === bookId && c.status === 'available');
      if (!availableCopy) {
        throw new Error(`Aucun exemplaire physique disponible pour "${book.title}".`);
      }

      // Mark copy as borrowed
      availableCopy.status = 'borrowed';

      const loanNum = String(loans.length + createdLoans.length + 1).padStart(3, '0');
      const newLoanId = `EMP-2026-${loanNum}`;

      const newLoan: Loan = {
        id: newLoanId,
        userId: member.id,
        userName: member.fullName,
        userEmail: member.email,
        memberId: member.id,
        memberName: member.fullName,
        memberEmail: member.email,
        bookId: book.id,
        bookTitle: book.title,
        bookIsbn: book.isbn,
        bookCoverImage: book.coverImage || book.coverUrl,
        bookCoverUrl: book.coverUrl || book.coverImage,
        copyId: availableCopy.id,
        copyBarcode: availableCopy.barcode,
        borrowDate: todayStr,
        loanDate: todayStr,
        expectedReturnDate: dueDateStr,
        dueDate: dueDateStr,
        actualReturnDate: null,
        returnDate: null,
        overdueDays: 0,
        status: 'active',
        notes: notes || 'Emprunt enregistré au guichet',
      };

      createdLoans.push(newLoan);
    }

    this.setCopies(copies);
    loans.unshift(...createdLoans);
    this.setLoans(loans);
    this.recomputeAllBookCounts();

    return createdLoans;
  }

  public returnLoan(loanId: string, notes?: string): Loan {
    const loans = this.getLoans();
    const index = loans.findIndex((l) => l.id === loanId);
    if (index === -1) throw new Error('Emprunt introuvable.');

    const loan = loans[index];
    if (loan.status === 'returned') {
      throw new Error('Cet emprunt a déjà été restitué.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    loan.status = 'returned';
    loan.actualReturnDate = todayStr;
    loan.returnDate = todayStr;
    loan.overdueDays = 0;
    if (notes) loan.notes = (loan.notes ? loan.notes + ' | ' : '') + notes;

    // Free the physical copy
    const copies = this.getCopies();
    const copyIndex = copies.findIndex((c) => c.id === loan.copyId);
    if (copyIndex !== -1) {
      copies[copyIndex].status = 'available';
      this.setCopies(copies);
    }

    this.setLoans(loans);
    this.recomputeAllBookCounts();
    return loan;
  }

  public renewLoan(loanId: string, additionalDays: number = 14): Loan {
    const loans = this.getLoans();
    const index = loans.findIndex((l) => l.id === loanId);
    if (index === -1) throw new Error('Emprunt introuvable.');

    const loan = loans[index];
    if (loan.status === 'returned') {
      throw new Error('Impossible de prolonger un emprunt déjà restitué.');
    }

    const currentDue = new Date(loan.expectedReturnDate || loan.dueDate || new Date());
    currentDue.setDate(currentDue.getDate() + additionalDays);
    const newDueDateStr = currentDue.toISOString().split('T')[0];

    loan.expectedReturnDate = newDueDateStr;
    loan.dueDate = newDueDateStr;
    loan.notes = (loan.notes ? loan.notes + ' | ' : '') + `Prolongé de ${additionalDays} jours`;

    // Recalculate overdue status
    const today = new Date();
    if (currentDue >= today) {
      loan.status = 'active';
      loan.overdueDays = 0;
    }

    this.setLoans(loans);
    return loan;
  }

  // --- OVERDUE TRACKING & CALCULATIONS ---
  public refreshLoanStatuses(): void {
    const loans = this.getLoans();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let changed = false;
    loans.forEach((l) => {
      if (l.status === 'returned') return;
      const due = new Date(l.expectedReturnDate || l.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        if (l.status !== 'overdue' || l.overdueDays !== diffDays) {
          l.status = 'overdue';
          l.overdueDays = diffDays;
          changed = true;
        }
      } else {
        if (l.status !== 'active' || l.overdueDays !== 0) {
          l.status = 'active';
          l.overdueDays = 0;
          changed = true;
        }
      }
    });

    if (changed) {
      this.setLoans(loans);
    }
  }

  public getOverdueLoans(): Loan[] {
    this.refreshLoanStatuses();
    return this.getLoans().filter((l) => l.status === 'overdue');
  }

  public getOverdueRate(): number {
    const loans = this.getLoans();
    const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
    if (activeLoans.length === 0) return 0;
    const overdueCount = activeLoans.filter((l) => l.status === 'overdue').length;
    return Math.round((overdueCount / activeLoans.length) * 100);
  }

  // --- OUVRAGES EN SOUFFRANCE ---
  public getOuvragesEnSouffrance(): Book[] {
    const books = this.getBooks();
    const copies = this.getCopies();

    return books.filter((book) => {
      const bookCopies = copies.filter((c) => c.bookId === book.id);
      if (bookCopies.length === 0) return false;
      const allBorrowed = bookCopies.every((c) => c.status === 'borrowed');
      return allBorrowed;
    });
  }

  public recomputeAllBookCounts(): void {
    const books = this.getBooks();
    const copies = this.getCopies();

    const updated = books.map((b) => {
      const bookCopies = copies.filter((c) => c.bookId === b.id);
      const total = bookCopies.length;
      const available = bookCopies.filter((c) => c.status === 'available').length;
      const borrowed = bookCopies.filter((c) => c.status === 'borrowed').length;

      return {
        ...b,
        totalQuantity: total,
        availableQuantity: available,
        totalCopies: total,
        availableCopies: available,
        borrowedCopies: borrowed,
        status: available > 0 ? ('available' as const) : ('unavailable' as const),
      };
    });

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(updated));
  }

  // --- RESERVATIONS ---
  public getReservations(): Reservation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public setReservations(res: Reservation[]): void {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(res));
  }

  public getReservationsByMember(memberId: string): Reservation[] {
    return this.getReservations().filter((r) => r.memberId === memberId && r.status === 'pending');
  }

  public createReservation(memberId: string, bookId: string): Reservation {
    const member = this.getMemberById(memberId);
    const book = this.getBookById(bookId);
    if (!member) throw new Error('Adhérent introuvable.');
    if (!book) throw new Error('Livre introuvable.');

    const reservations = this.getReservations();
    const existing = reservations.find(
      (r) => r.memberId === memberId && r.bookId === bookId && r.status === 'pending'
    );
    if (existing) {
      throw new Error(`Vous avez déjà réservé cet ouvrage.`);
    }

    const newRes: Reservation = {
      id: `RES-${Date.now().toString().slice(-6)}`,
      bookId: book.id,
      bookTitle: book.title,
      memberId: member.id,
      memberName: member.fullName,
      reservationDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      bookCoverUrl: book.coverImage || book.coverUrl,
    };

    reservations.unshift(newRes);
    this.setReservations(reservations);
    return newRes;
  }

  public cancelReservation(resId: string): void {
    const reservations = this.getReservations().filter((r) => r.id !== resId);
    this.setReservations(reservations);
  }

  // --- EXCEL IMPORTS ---
  public importValidatedBooks(booksData: any[]): number {
    let count = 0;
    booksData.forEach((row) => {
      this.createBook(
        {
          title: row.title,
          author: row.author,
          isbn: row.isbn,
          category: row.category || 'Général',
          publisher: row.publisher || 'Éditions Universitaires',
          publicationYear: Number(row.publicationYear) || 2024,
          description: row.description || '',
          coverImage:
            row.coverImage ||
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
          shelfLocation: row.shelfLocation || 'Rayon Informatique',
        },
        Number(row.copiesCount) || 2
      );
      count++;
    });
    return count;
  }

  public importValidatedUsers(usersData: any[]): number {
    let count = 0;
    usersData.forEach((row) => {
      try {
        this.addAuthorizedUser({
          email: row.email,
          fullName: row.fullName,
          role: row.role || 'reader',
          status: 'active',
          notes: row.notes || 'Importé via Excel',
        });
        count++;
      } catch (err) {
        console.warn('Skip duplicate or invalid user import:', err);
      }
    });
    return count;
  }

  // --- BACKUP & RESTORE ---
  public exportBackup(): string {
    const backup = {
      version: '4.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      students: this.getStudents(),
      authorizedUsers: this.getAuthorizedUsers(),
      members: this.getMembers(),
      books: this.getBooks(),
      copies: this.getCopies(),
      loans: this.getLoans(),
      reservations: this.getReservations(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.setSettings(data.settings);
      if (data.students) this.setStudents(data.students);
      if (data.authorizedUsers) this.setAuthorizedUsers(data.authorizedUsers);
      if (data.members) this.setMembers(data.members);
      if (data.copies) this.setCopies(data.copies);
      if (data.books) this.setBooks(data.books);
      if (data.loans) this.setLoans(data.loans);
      if (data.reservations) this.setReservations(data.reservations);
      this.recomputeAllBookCounts();
      return true;
    } catch {
      return false;
    }
  }

  public resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.COPIES);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.AUTHORIZED_USERS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    this.init();
  }
}

export const db = new SmartLibraryDB();
