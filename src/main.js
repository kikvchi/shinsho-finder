import fs from 'fs/promises';
import path from 'path';
import { fetchCoverage } from './fetch-coverage.js';
import { fetchDetails } from './fetch-details.js';
import { filterShinsho } from './filter-shinsho.js';
import { generateRSS } from './generate-rss.js';
import { postNewBooksToX } from './post-to-x.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DOCS_DIR = path.join(process.cwd(), 'docs');
const ISBN_LIST_PATH = path.join(DATA_DIR, 'isbn-list.json');
const SHINSHO_DB_PATH = path.join(DATA_DIR, 'shinsho-database.json');
const RSS_OUTPUT_PATH = path.join(DOCS_DIR, 'index.xml');

/**
 * Load JSON file or return default value if not exists
 */
async function loadJSON(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${filePath}, using default value`);
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Save JSON file with pretty formatting
 */
async function saveJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Main execution flow
 */
async function main() {
  console.log('=== Shinsho Finder Started ===\n');

  try {
    // Step 1: Fetch current ISBN coverage
    const currentISBNs = await fetchCoverage();

    // Step 2: Load previous ISBN list
    const previousISBNs = await loadJSON(ISBN_LIST_PATH, []);
    console.log(`Previous ISBN count: ${previousISBNs.length}`);

    // Step 3: Find new ISBNs (difference)
    const previousISBNSet = new Set(previousISBNs);
    const newISBNs = currentISBNs.filter(isbn => !previousISBNSet.has(isbn));
    console.log(`New ISBNs found: ${newISBNs.length}\n`);

    // First-time initialization check
    const isFirstRun = previousISBNs.length === 0;
    if (isFirstRun) {
      console.log('⚠️  First run detected: Initializing ISBN database without fetching details.');
      console.log('   New books will be detected starting from the next run.\n');
    }

    if (newISBNs.length === 0) {
      console.log('No new ISBNs to process. Updating RSS feed with existing data...\n');
    } else if (isFirstRun) {
      console.log('Skipping book details fetch on first run to avoid timeout.\n');
    } else {
      // Step 4: Fetch details for new ISBNs
      const newBooks = await fetchDetails(newISBNs);
      console.log('');

      // Step 5: Filter shinsho books
      const newShinsho = filterShinsho(newBooks);
      console.log('');

      if (newShinsho.length > 0) {
        // Step 6: Load existing shinsho database and add new ones
        const shinshoDatabase = await loadJSON(SHINSHO_DB_PATH, []);
        shinshoDatabase.push(...newShinsho);

        // Save updated database
        await saveJSON(SHINSHO_DB_PATH, shinshoDatabase);
        console.log(`✓ Updated shinsho database (${shinshoDatabase.length} total books)\n`);

        // Step 6.5: Post new books to X
        await postNewBooksToX(newShinsho);
      } else {
        console.log('No new shinsho books found\n');
      }
    }

    // Step 7: Save current ISBN list for next run
    await saveJSON(ISBN_LIST_PATH, currentISBNs);
    console.log(`✓ Saved ISBN list (${currentISBNs.length} ISBNs)\n`);

    // Step 8: Generate RSS feed from complete database
    const shinshoDatabase = await loadJSON(SHINSHO_DB_PATH, []);
    await generateRSS(shinshoDatabase, RSS_OUTPUT_PATH);

    console.log('\n=== Shinsho Finder Completed Successfully ===');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
