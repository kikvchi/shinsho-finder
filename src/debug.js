import { fetchDetails } from './fetch-details.js';

const testISBNs = ['9784004310938']; // 岩波新書

async function debug() {
  const books = await fetchDetails(testISBNs);
  if (books.length > 0) {
    console.log('Full book structure:');
    console.log(JSON.stringify(books[0], null, 2));
  }
}

debug();
