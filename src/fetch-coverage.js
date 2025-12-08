/**
 * Fetch all ISBNs from openBD coverage API
 * @returns {Promise<string[]>} Array of ISBNs
 */
export async function fetchCoverage() {
  const url = 'https://api.openbd.jp/v1/coverage';

  try {
    console.log('Fetching coverage from openBD API...');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const isbnList = await response.json();
    console.log(`✓ Fetched ${isbnList.length} ISBNs`);

    return isbnList;
  } catch (error) {
    console.error('Error fetching coverage:', error.message);
    throw error;
  }
}
