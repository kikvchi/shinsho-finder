import crypto from 'crypto';
import fs from 'fs/promises';

const POSTED_ISBNS_PATH = 'data/posted-isbns.json';
const AFFILIATE_TAG = 'shinshofinder-22';

/**
 * Load list of already posted ISBNs
 * @returns {Promise<Set<string>>} Set of posted ISBNs
 */
async function loadPostedISBNs() {
  try {
    const data = await fs.readFile(POSTED_ISBNS_PATH, 'utf-8');
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

/**
 * Save list of posted ISBNs
 * @param {Set<string>} postedISBNs - Set of posted ISBNs
 */
async function savePostedISBNs(postedISBNs) {
  await fs.writeFile(POSTED_ISBNS_PATH, JSON.stringify([...postedISBNs], null, 2), 'utf-8');
}

/**
 * Generate OAuth 1.0a signature for X API
 */
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
}

/**
 * Post a tweet to X
 * @param {string} text - Tweet text
 * @returns {Promise<Object>} Response from X API
 */
async function postTweet(text) {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('X API credentials not configured');
  }

  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const signature = generateOAuthSignature(method, url, oauthParams, apiSecret, accessTokenSecret);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`X API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Format book data into tweet text
 * @param {Object} book - Book object
 * @returns {string} Formatted tweet text
 */
function formatTweet(book) {
  const amazonUrl = book.isbn10
    ? `https://www.amazon.co.jp/dp/${book.isbn10}/?tag=${AFFILIATE_TAG}`
    : `https://www.amazon.co.jp/s?k=${book.isbn}&tag=${AFFILIATE_TAG}`;

  return `📚 新書新刊

『${book.title}』
著者: ${book.author}
シリーズ: ${book.series}
発売: ${book.publishedDate}

${amazonUrl}

#新書 #新刊`;
}

/**
 * Post new books to X
 * @param {Object[]} newBooks - Array of newly discovered books
 * @returns {Promise<number>} Number of books posted
 */
export async function postNewBooksToX(newBooks) {
  if (!newBooks || newBooks.length === 0) {
    console.log('No new books to post to X');
    return 0;
  }

  // Check if X API is configured
  if (!process.env.X_API_KEY) {
    console.log('X API not configured, skipping posting');
    return 0;
  }

  const postedISBNs = await loadPostedISBNs();
  let postedCount = 0;

  for (const book of newBooks) {
    // Skip if already posted
    if (postedISBNs.has(book.isbn)) {
      console.log(`Skipping ${book.isbn} - already posted`);
      continue;
    }

    try {
      const tweetText = formatTweet(book);
      console.log(`Posting to X: ${book.title}`);

      await postTweet(tweetText);

      // Mark as posted
      postedISBNs.add(book.isbn);
      postedCount++;

      console.log(`✓ Posted: ${book.title}`);

      // Small delay between posts
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error posting ${book.title}:`, error.message);
    }
  }

  // Save updated posted ISBNs
  await savePostedISBNs(postedISBNs);

  console.log(`✓ Posted ${postedCount} new books to X`);
  return postedCount;
}
