import { fetchDetails } from './fetch-details.js';
import { filterShinsho } from './filter-shinsho.js';

// Test with a few known ISBNs
const testISBNs = [
  '9784004310938', // 岩波新書
  '9784480069733', // ちくま新書
  '9784087211234', // 集英社新書
  '9784062884389', // 講談社現代新書
  '9784121027245', // 中公新書
];

async function test() {
  console.log('Testing openBD API with known shinsho ISBNs...\n');

  try {
    const books = await fetchDetails(testISBNs);
    console.log(`\nReceived ${books.length} books\n`);

    if (books.length > 0) {
      console.log('Sample book structure:');
      console.log(JSON.stringify(books[0], null, 2).substring(0, 500) + '...\n');

      const shinsho = filterShinsho(books);
      console.log(`\nFiltered ${shinsho.length} shinsho books:`);
      shinsho.forEach(book => {
        console.log(`- [${book.series}] ${book.title} by ${book.author}`);
      });
    } else {
      console.log('No books received. API might have issues.');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
