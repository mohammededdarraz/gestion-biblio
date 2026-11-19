import { GoogleBookMetadata } from '../types';

export async function fetchBookMetadata(isbnOrQuery: string): Promise<GoogleBookMetadata | null> {
  const cleanIsbn = isbnOrQuery.replace(/[\s\-]/g, '').trim();
  if (!cleanIsbn) return null;

  // 1. Try Google Books API
  try {
    const isNumeric = /^[0-9Xx]{10,13}$/.test(cleanIsbn);
    const queryParam = isNumeric ? `isbn:${cleanIsbn}` : encodeURIComponent(isbnOrQuery.trim());
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${queryParam}&maxResults=1`);
    if (res.ok) {
      const json = await res.json();
      if (json.items && json.items.length > 0) {
        const item = json.items[0];
        const volumeInfo = item.volumeInfo || {};

        let thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
        if (thumbnail && thumbnail.startsWith('http://')) {
          thumbnail = thumbnail.replace('http://', 'https://');
        }

        const publishedYear = volumeInfo.publishedDate
          ? volumeInfo.publishedDate.split('-')[0]
          : '';

        let isbn10 = '';
        let isbn13 = '';
        if (Array.isArray(volumeInfo.industryIdentifiers)) {
          for (const ident of volumeInfo.industryIdentifiers) {
            if (ident.type === 'ISBN_10') isbn10 = ident.identifier;
            if (ident.type === 'ISBN_13') isbn13 = ident.identifier;
          }
        }

        return {
          title: volumeInfo.title || '',
          authors: volumeInfo.authors || [],
          publisher: volumeInfo.publisher || '',
          publishedDate: publishedYear,
          description: volumeInfo.description || '',
          pageCount: volumeInfo.pageCount || 0,
          categories: volumeInfo.categories || [],
          thumbnail: thumbnail || '',
          isbn10: isbn10 || (cleanIsbn.length === 10 ? cleanIsbn : ''),
          isbn13: isbn13 || (cleanIsbn.length === 13 ? cleanIsbn : ''),
        };
      }
    }
  } catch (err) {
    console.warn('Google Books API lookup failed, trying Open Library API:', err);
  }

  // 2. Fallback to Open Library API
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
    if (res.ok) {
      const json = await res.json();
      const bookData = json[`ISBN:${cleanIsbn}`];
      if (bookData) {
        return {
          title: bookData.title || '',
          authors: (bookData.authors || []).map((a: any) => a.name),
          publisher: (bookData.publishers || [])[0]?.name || '',
          publishedDate: bookData.publish_date || '',
          description: typeof bookData.notes === 'string' ? bookData.notes : (bookData.subtitle || ''),
          pageCount: bookData.number_of_pages || 0,
          categories: (bookData.subjects || []).slice(0, 3).map((s: any) => s.name),
          thumbnail: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small || '',
          isbn13: cleanIsbn,
        };
      }
    }
  } catch (err) {
    console.warn('Open Library API lookup also failed:', err);
  }

  return null;
}
