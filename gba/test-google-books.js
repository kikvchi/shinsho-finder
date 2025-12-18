/**
 * Google Books API Test
 * Test if books from openBD database can be found in Google Books API
 * and check when they were indexed
 */

/**
 * Search Google Books API for a book by ISBN
 * @param {string} isbn - ISBN to search for
 * @returns {Promise<Object>} API response
 */
async function searchGoogleBooks(isbn) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Google Books API:`, error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('=== Google Books API Test ===\n');

  // Load the shinsho database
  const fs = await import('fs/promises');
  const path = await import('path');

  const dbPath = path.join(process.cwd(), 'data', 'shinsho-database.json');

  let database;
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    database = JSON.parse(data);
    console.log(`✓ Loaded ${database.length} books from database\n`);
  } catch (error) {
    console.error('Error loading database:', error.message);
    console.log('Please run `npm start` first to generate the database.\n');
    return;
  }

  if (database.length === 0) {
    console.log('Database is empty. Run the main script first.\n');
    return;
  }

  // Sort by discoveredAt to get the most recent
  database.sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));

  console.log('Testing with the 3 most recently discovered books:\n');

  const testBooks = database.slice(0, 3);

  for (const book of testBooks) {
    console.log(`\n📚 Testing: ${book.title}`);
    console.log(`   Series: ${book.series}`);
    console.log(`   ISBN: ${book.isbn}`);
    console.log(`   Discovered: ${new Date(book.discoveredAt).toLocaleString('ja-JP')}`);
    console.log(`   Published: ${book.publishedDate}`);

    try {
      const result = await searchGoogleBooks(book.isbn);

      if (result.totalItems === 0) {
        console.log(`   ❌ Not found in Google Books API`);
      } else {
        console.log(`   ✓ Found in Google Books API`);
        const volumeInfo = result.items[0].volumeInfo;

        console.log(`   Title in GB: ${volumeInfo.title || 'N/A'}`);
        console.log(`   Authors: ${volumeInfo.authors?.join(', ') || 'N/A'}`);
        console.log(`   Published Date: ${volumeInfo.publishedDate || 'N/A'}`);
        console.log(`   Page Count: ${volumeInfo.pageCount || 'N/A'}`);

        // Check if description exists
        if (volumeInfo.description) {
          console.log(`   Description length: ${volumeInfo.description.length} chars`);
        } else {
          console.log(`   Description: Not available`);
        }
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n=== Test Complete ===');

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total books in database: ${database.length}`);
  console.log(`Most recent discovery: ${new Date(database[0].discoveredAt).toLocaleString('ja-JP')}`);
  console.log(`Oldest discovery: ${new Date(database[database.length - 1].discoveredAt).toLocaleString('ja-JP')}`);
}

main();
