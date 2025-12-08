/**
 * Fetch book details for given ISBNs from openBD API
 * @param {string[]} isbns - Array of ISBNs to fetch
 * @returns {Promise<Object[]>} Array of book details
 */
export async function fetchDetails(isbns) {
  if (!isbns || isbns.length === 0) {
    console.log('No ISBNs to fetch');
    return [];
  }

  const url = 'https://api.openbd.jp/v1/get';
  const batchSize = 10000; // API limit
  const allBooks = [];

  try {
    // Split into batches if needed
    for (let i = 0; i < isbns.length; i += batchSize) {
      const batch = isbns.slice(i, i + batchSize);
      console.log(`Fetching details for ${batch.length} ISBNs (batch ${Math.floor(i / batchSize) + 1})...`);

      // openBD API expects comma-separated ISBNs as query parameter
      const isbnParam = batch.join(',');
      const response = await fetch(`${url}?isbn=${isbnParam}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const books = await response.json();

      // Filter out null entries (ISBNs not found in database)
      const validBooks = books.filter(book => book !== null);
      allBooks.push(...validBooks);

      console.log(`✓ Received ${validBooks.length} valid book entries`);
    }

    return allBooks;
  } catch (error) {
    console.error('Error fetching book details:', error.message);
    throw error;
  }
}
