import RSS from 'rss';
import fs from 'fs/promises';

/**
 * Generate RSS feed from shinsho database
 * @param {Object[]} shinshoBooks - Array of shinsho book objects
 * @param {string} outputPath - Path to output XML file
 */
export async function generateRSS(shinshoBooks, outputPath) {
  const feed = new RSS({
    title: '新書ファインダー',
    description: 'openBD APIを使用した新書の新刊情報フィード',
    feed_url: 'https://analekt.github.io/shinsho-finder/index.xml',
    site_url: 'https://analekt.github.io/shinsho-finder/',
    language: 'ja',
    pubDate: new Date(),
    ttl: 1440, // 24 hours
  });

  // Sort by discovery date (newest first) and take latest 100 items
  const sortedBooks = [...shinshoBooks]
    .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt))
    .slice(0, 100);

  for (const book of sortedBooks) {
    let description = '';

    // Build description HTML
    if (book.coverImageUrl) {
      description += `<img src="${book.coverImageUrl}" alt="${book.title}" style="max-width: 200px; float: left; margin-right: 15px;"/>\n\n`;
    }

    description += `<p><strong>著者:</strong> ${book.author}</p>\n`;
    description += `<p><strong>出版社:</strong> ${book.publisher}</p>\n`;
    description += `<p><strong>シリーズ:</strong> ${book.series}</p>\n`;
    description += `<p><strong>ISBN:</strong> ${book.isbn}</p>\n`;
    description += `<p><strong>発売日:</strong> ${book.publishedDate}</p>\n`;

    if (book.pageCount) {
      description += `<p><strong>ページ数:</strong> ${book.pageCount}ページ</p>\n`;
    }

    if (book.description) {
      description += `<h4>内容紹介</h4>\n<p>${book.description}</p>\n`;
    }

    if (book.tableOfContents) {
      description += `<h4>目次</h4>\n<pre>${book.tableOfContents}</pre>\n`;
    }

    if (book.authorBio) {
      description += `<h4>著者略歴</h4>\n<p>${book.authorBio}</p>\n`;
    }

    description += `<div style="clear: both;"></div>`;

    // Build Amazon URL using ISBN-10 if available
    const amazonUrl = book.isbn10
      ? `https://www.amazon.co.jp/dp/${book.isbn10}/`
      : `https://www.amazon.co.jp/s?k=${book.isbn}`;

    feed.item({
      title: book.title,
      description: description,
      url: amazonUrl,
      guid: book.isbn,
      date: new Date(book.discoveredAt),
      custom_elements: [
        { 'isbn': book.isbn },
        { 'isbn10': book.isbn10 || '' },
        { 'series': book.series },
        { 'author': book.author },
        { 'publisher': book.publisher },
      ],
    });
  }

  const xml = feed.xml({ indent: true });

  try {
    await fs.writeFile(outputPath, xml, 'utf-8');
    console.log(`✓ RSS feed generated at ${outputPath} (${sortedBooks.length} items)`);
  } catch (error) {
    console.error('Error writing RSS file:', error.message);
    throw error;
  }
}
