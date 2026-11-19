import * as XLSX from 'xlsx';
import { ExcelImportRow, ExcelImportSummary, Student } from '../types';
import { isValidEmail } from './validation';
import { SEED_STUDENTS } from '../data/seedData';

/**
 * Parse an Excel file for Books import
 */
export async function parseBooksExcel(file: File, existingIsbns: string[]): Promise<{
  rows: ExcelImportRow[];
  summary: ExcelImportSummary;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: ExcelImportRow[] = [];
  const seenIsbnsInFile = new Set<string>();

  rawData.forEach((item, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];

    // Map common french or english column names
    const title = String(item['Titre'] || item['titre'] || item['Title'] || item['title'] || '').trim();
    const author = String(item['Auteur'] || item['auteur'] || item['Author'] || item['author'] || '').trim();
    const isbn = String(item['ISBN'] || item['isbn'] || item['Isbn'] || '').replace(/[\s\-]/g, '').trim();
    const category = String(item['Catégorie'] || item['categorie'] || item['Category'] || item['category'] || 'Général').trim();
    const publisher = String(item['Éditeur'] || item['editeur'] || item['Publisher'] || item['publisher'] || 'Éditions Universitaires').trim();
    const year = parseInt(item['Année'] || item['annee'] || item['Year'] || item['year'] || '2024', 10);
    const copiesCount = parseInt(item['Exemplaires'] || item['copies'] || item['Copies'] || item['Quantité'] || '2', 10);
    const location = String(item['Emplacement'] || item['Rayon'] || item['Location'] || 'Rayon Informatique').trim();
    const description = String(item['Description'] || item['description'] || item['Résumé'] || '').trim();
    const coverImage = String(item['Image'] || item['Couverture'] || item['Cover'] || item['coverImage'] || '').trim();

    if (!title) errors.push('Le titre est manquant.');
    if (!author) errors.push("L'auteur est manquant.");
    if (!isbn) {
      errors.push("L'ISBN est manquant.");
    } else if (isbn.length < 9) {
      errors.push("Format d'ISBN invalide.");
    }

    const isDuplicate = existingIsbns.includes(isbn) || seenIsbnsInFile.has(isbn);
    if (isbn) seenIsbnsInFile.add(isbn);
    if (isDuplicate) {
      errors.push('Livre ou ISBN déjà existant dans le catalogue.');
    }

    rows.push({
      rowNumber,
      data: {
        title,
        author,
        isbn,
        category,
        publisher,
        publicationYear: isNaN(year) ? 2024 : year,
        copiesCount: isNaN(copiesCount) || copiesCount < 1 ? 2 : copiesCount,
        shelfLocation: location,
        description,
        coverImage,
      },
      isValid: errors.length === 0,
      isDuplicate,
      errors,
    });
  });

  const validRows = rows.filter((r) => r.isValid).length;
  const duplicateRows = rows.filter((r) => r.isDuplicate).length;
  const invalidRows = rows.length - validRows;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicateRows,
      importedCount: 0,
    },
  };
}

/**
 * Parse an Excel file containing verified student emails for "Ingénierie Logicielle – 2ème année"
 */
export async function parseStudentsExcel(
  file: File,
  existingStudents: Student[]
): Promise<{
  rows: ExcelImportRow[];
  summary: ExcelImportSummary;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: ExcelImportRow[] = [];
  const seenEmailsInFile = new Set<string>();

  rawData.forEach((item, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    const studentNumber = String(
      item['Matricule'] || item['matricule'] || item['CNE'] || item['cne'] || item['ID'] || ''
    ).trim();
    const lastName = String(item['Nom'] || item['nom'] || item['Nom de famille'] || '').trim();
    const firstName = String(item['Prénom'] || item['prenom'] || item['Prenom'] || '').trim();
    const fullName = String(item['Nom complet'] || item['Nom & Prénom'] || `${lastName} ${firstName}`).trim();
    const email = String(
      item['Email'] || item['email'] || item['Courriel'] || item['Email universitaire'] || ''
    ).trim().toLowerCase();

    if (!email) {
      errors.push("L'adresse email universitaire est obligatoire.");
    } else if (!isValidEmail(email)) {
      errors.push("Format d'adresse email invalide.");
    }

    if (email && seenEmailsInFile.has(email)) {
      errors.push('Cette adresse email est présente en double dans le fichier.');
    }
    if (email) seenEmailsInFile.add(email);

    // Verify if this student exists in the official promotion list
    let matchedStudent: Student | undefined;
    if (studentNumber) {
      matchedStudent = existingStudents.find(
        (s) => s.studentNumber.toUpperCase() === studentNumber.toUpperCase() || s.id.toUpperCase() === studentNumber.toUpperCase()
      );
    }
    if (!matchedStudent && (lastName || fullName)) {
      const cleanLast = lastName.toLowerCase();
      const cleanFirst = firstName.toLowerCase();
      const cleanFull = fullName.toLowerCase();
      matchedStudent = existingStudents.find((s) => {
        const sLast = s.lastName.toLowerCase();
        const sFirst = s.firstName.toLowerCase();
        const sFull = s.fullName.toLowerCase();
        if (cleanLast && cleanFirst && sLast.includes(cleanLast) && sFirst.includes(cleanFirst)) return true;
        if (cleanFull && (sFull.includes(cleanFull) || cleanFull.includes(sLast))) return true;
        if (cleanLast && sLast === cleanLast) return true;
        return false;
      });
    }

    if (!matchedStudent) {
      errors.push("Étudiant non trouvé dans la liste officielle de la promotion Ingénierie Logicielle (2A).");
    }

    const isDuplicate = Boolean(
      matchedStudent && matchedStudent.isEmailVerified && matchedStudent.email && matchedStudent.email.toLowerCase() === email
    );

    if (isDuplicate) {
      errors.push('Cet étudiant a déjà un courriel vérifié identique dans le système.');
    }

    rows.push({
      rowNumber,
      data: {
        studentNumber: matchedStudent?.studentNumber || studentNumber,
        lastName: matchedStudent?.lastName || lastName,
        firstName: matchedStudent?.firstName || firstName,
        fullName: matchedStudent?.fullName || fullName,
        email,
        matchedStudentId: matchedStudent?.id,
        matchedStudentName: matchedStudent?.fullName,
      },
      isValid: errors.length === 0,
      isDuplicate,
      errors,
    });
  });

  const validRows = rows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateRows = rows.filter((r) => r.isDuplicate).length;
  const invalidRows = rows.length - validRows;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicateRows,
      importedCount: 0,
    },
  };
}

/**
 * Parse an Excel file for general Authorized Users import
 */
export async function parseUsersExcel(file: File, existingEmails: string[]): Promise<{
  rows: ExcelImportRow[];
  summary: ExcelImportSummary;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: ExcelImportRow[] = [];
  const seenEmailsInFile = new Set<string>();
  const lowerExistingEmails = existingEmails.map((e) => e.toLowerCase());

  rawData.forEach((item, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    const email = String(item['Email'] || item['email'] || item['Courriel'] || '').trim().toLowerCase();
    const fullName = String(item['Nom'] || item['nom'] || item['Nom complet'] || item['Name'] || item['name'] || '').trim();
    const roleInput = String(item['Rôle'] || item['role'] || item['Role'] || 'reader').trim().toLowerCase();
    const notes = String(item['Notes'] || item['notes'] || item['Département'] || '').trim();

    let role: 'admin' | 'librarian' | 'reader' = 'reader';
    if (roleInput.includes('admin') || roleInput.includes('gérant')) {
      role = 'admin';
    } else if (roleInput.includes('biblio') || roleInput.includes('librarian')) {
      role = 'librarian';
    }

    if (!email) {
      errors.push("L'email est obligatoire.");
    } else if (!isValidEmail(email)) {
      errors.push("Format d'adresse email invalide.");
    }

    const isDuplicate = lowerExistingEmails.includes(email) || seenEmailsInFile.has(email);
    if (email) seenEmailsInFile.add(email);
    if (isDuplicate) {
      errors.push('Cette adresse email est déjà enregistrée.');
    }

    rows.push({
      rowNumber,
      data: {
        email,
        fullName: fullName || email.split('@')[0],
        role,
        notes,
      },
      isValid: errors.length === 0,
      isDuplicate,
      errors,
    });
  });

  const validRows = rows.filter((r) => r.isValid).length;
  const duplicateRows = rows.filter((r) => r.isDuplicate).length;
  const invalidRows = rows.length - validRows;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicateRows,
      importedCount: 0,
    },
  };
}

/**
 * Generate official Excel template for student emails of "Ingénierie Logicielle - 2ème année"
 */
export function generateStudentsEmailTemplate(): void {
  const sampleData = SEED_STUDENTS.map((s) => ({
    Matricule: s.studentNumber,
    Nom: s.lastName,
    Prénom: s.firstName,
    Filière: s.filiere,
    'Email Universitaire': s.email || `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@usmba.ac.ma`,
  }));

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Étudiants IL-2A');
  XLSX.writeFile(wb, 'modele_emails_etudiants_ingenierie_logicielle_2a.xlsx');
}

/**
 * Generate sample Excel template for Computer Science Books
 */
export function generateBooksTemplate(): void {
  const sampleData = [
    {
      Titre: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      Auteur: 'Robert C. Martin',
      ISBN: '9780132350884',
      Catégorie: 'Software Engineering',
      Éditeur: 'Prentice Hall',
      Année: 2008,
      Exemplaires: 3,
      Emplacement: 'Rayon GL-01',
      Description: 'Principes du code propre et du refactoring.',
    },
    {
      Titre: 'Designing Data-Intensive Applications',
      Auteur: 'Martin Kleppmann',
      ISBN: '9781449373320',
      Catégorie: 'Database Management',
      Éditeur: "O'Reilly Media",
      Année: 2017,
      Exemplaires: 3,
      Emplacement: 'Rayon BD-01',
      Description: 'Architecture des systèmes de données fiables et distribués.',
    },
    {
      Titre: 'Introduction to Algorithms (CLRS)',
      Auteur: 'Thomas H. Cormen, Charles E. Leiserson',
      ISBN: '9780262046305',
      Catégorie: 'Algorithms & Data Structures',
      Éditeur: 'MIT Press',
      Année: 2022,
      Exemplaires: 4,
      Emplacement: 'Rayon ALGO-01',
      Description: 'Traité complet d’algorithmique universitaire.',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modèle Livres');
  XLSX.writeFile(wb, 'modele_import_livres_informatique.xlsx');
}

/**
 * Generate sample Excel template for Authorized Users
 */
export function generateUsersTemplate(): void {
  const sampleData = [
    {
      Email: 'mohammed.eddarraz3@usmba.ac.ma',
      Nom: 'Mohammed Eddarraz',
      Rôle: 'reader',
      Notes: 'Étudiant Ingénierie Logicielle 2A',
    },
    {
      Email: 'professeur.informatique@usmba.ac.ma',
      Nom: 'Professeur Encadrant',
      Rôle: 'reader',
      Notes: 'Enseignant-Chercheur Département Informatique',
    },
    {
      Email: 'sophie.gerant@smartlibrary.fr',
      Nom: 'Sophie Valois',
      Rôle: 'admin',
      Notes: 'Administratrice Bibliothèque',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modèle Utilisateurs');
  XLSX.writeFile(wb, 'modele_import_utilisateurs_smart_library.xlsx');
}
