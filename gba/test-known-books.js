/**
 * Test Google Books API with well-known shinsho books
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
    console.error(`Error:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('=== Testing Google Books API with Known Shinsho ===\n');

  // Well-known shinsho books (older publications)
  const testBooks = [
    { isbn: '9784004310938', title: '朝鮮通信使', series: '岩波新書', year: '2007' },
    { isbn: '9784121027245', title: '行動経済学の処方箋', series: '中公新書', year: '2022' },
    { isbn: '9784480069733', title: '僕らの社会主義', series: 'ちくま新書', year: '2018' },
    { isbn: '9784062884389', title: '飛行機の戦争1914-1945', series: '講談社現代新書', year: '2017' },
  ];

  for (const book of testBooks) {
    console.log(`\n📚 Testing: ${book.title}`);
    console.log(`   Series: ${book.series} (${book.year})`);
    console.log(`   ISBN: ${book.isbn}`);

    try {
      const result = await searchGoogleBooks(book.isbn);

      if (result.totalItems === 0) {
        console.log(`   ❌ Not found in Google Books API`);
      } else {
        console.log(`   ✓ Found in Google Books API`);
        const item = result.items[0];
        const volumeInfo = item.volumeInfo;

        console.log(`   Title: ${volumeInfo.title || 'N/A'}`);
        console.log(`   Authors: ${volumeInfo.authors?.join(', ') || 'N/A'}`);
        console.log(`   Publisher: ${volumeInfo.publisher || 'N/A'}`);
        console.log(`   Published Date: ${volumeInfo.publishedDate || 'N/A'}`);
        console.log(`   Page Count: ${volumeInfo.pageCount || 'N/A'}`);
        console.log(`   Language: ${volumeInfo.language || 'N/A'}`);

        // Check categories/subjects
        if (volumeInfo.categories) {
          console.log(`   Categories: ${volumeInfo.categories.join(', ')}`);
        }

        // Description
        if (volumeInfo.description) {
          const desc = volumeInfo.description.substring(0, 100);
          console.log(`   Description: ${desc}...`);
        } else {
          console.log(`   Description: Not available`);
        }

        // Check if preview is available
        if (item.accessInfo) {
          console.log(`   Preview: ${item.accessInfo.viewability || 'N/A'}`);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n=== Test Complete ===');
}

main();
