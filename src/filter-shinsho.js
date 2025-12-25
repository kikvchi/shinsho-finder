/**
 * Check if a book was added to openBD in the current month or later
 * @param {string} datekoukai - Date the book was published on openBD (YYYY-MM-DD format)
 * @returns {boolean} True if the book was added in the current month or later
 */
function isCurrentMonthOrLater(datekoukai) {
  if (!datekoukai) {
    return false;
  }

  const koukai = new Date(datekoukai);
  if (isNaN(koukai.getTime())) {
    return false;
  }

  // Get the first day of the current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return koukai >= firstDayOfMonth;
}

/**
 * Check if datemodified is within N days of datekoukai
 * This filters out books that were registered earlier but only appeared in the ISBN list later
 * @param {string} datekoukai - Date the book was published on openBD (YYYY-MM-DD format)
 * @param {string} datemodified - Date the book was last modified (YYYY-MM-DD HH:MM:SS format)
 * @param {number} maxDays - Maximum allowed difference in days (default: 3)
 * @returns {boolean} True if the difference is within maxDays
 */
function isRecentlyRegistered(datekoukai, datemodified, maxDays = 3) {
  if (!datekoukai || !datemodified) {
    return false;
  }

  const koukai = new Date(datekoukai);
  const modified = new Date(datemodified);

  if (isNaN(koukai.getTime()) || isNaN(modified.getTime())) {
    return false;
  }

  const diffMs = modified.getTime() - koukai.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= maxDays;
}

/**
 * Convert ISBN-13 to ISBN-10
 * @param {string} isbn13 - 13-digit ISBN
 * @returns {string} 10-digit ISBN or empty string if conversion fails
 */
function convertToISBN10(isbn13) {
  // Remove any hyphens
  const cleanISBN = isbn13.replace(/-/g, '');

  // ISBN-13 must start with 978 to be convertible to ISBN-10
  if (!cleanISBN.startsWith('978') || cleanISBN.length !== 13) {
    return '';
  }

  // Extract the 9 digits after 978
  const isbn10Base = cleanISBN.substring(3, 12);

  // Calculate ISBN-10 check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn10Base[i]) * (10 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 11;
  const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString();

  return isbn10Base + checkChar;
}

/**
 * Filter books to find shinsho (新書) based on series name
 * @param {Object[]} books - Array of book objects from openBD API
 * @returns {Object[]} Array of shinsho books with relevant information
 */
export function filterShinsho(books) {
  // Known shinsho labels - add more as needed
  const shinshoLabels = [
    '岩波新書',
    '中公新書',
    'ちくま新書',
    '講談社現代新書',
    '文春新書',
    '新潮新書',
    '集英社新書',
    '光文社新書',
    '幻冬舎新書',
    'PHP新書',
    '平凡社新書',
    '小学館新書',
    'ベスト新書',
    '角川新書',
    'ちくまプリマー新書',
    '中公新書ラクレ',
    '講談社＋α新書',
    '講談社+α新書',
    'SB新書',
    'ブルーバックス',
    '岩波ジュニア新書',
    '朝日新書',
    '祥伝社新書',
    '扶桑社新書',
    '宝島社新書',
    'NHK出版新書',
    'サイエンス・アイ新書',
    '星海社新書',
    'PHPビジネス新書',
    'ハヤカワ新書',
  ];

  const shinshoBooks = [];

  for (const book of books) {
    try {
      // Navigate to the onix data structure
      const onix = book?.onix;
      if (!onix) continue;

      const descriptiveDetail = onix.DescriptiveDetail;
      if (!descriptiveDetail) continue;

      // Check if series/collection name contains known shinsho label
      const collection = descriptiveDetail.Collection;
      let seriesName = '';
      let isShinsho = false;

      if (collection) {
        const titleDetail = collection.TitleDetail;
        if (titleDetail?.TitleElement) {
          const elements = Array.isArray(titleDetail.TitleElement)
            ? titleDetail.TitleElement
            : [titleDetail.TitleElement];

          for (const element of elements) {
            const titleText = element.TitleText?.content;
            if (titleText) {
              seriesName = titleText;
              // Check if it matches any known shinsho label
              if (shinshoLabels.some(label => titleText.includes(label))) {
                isShinsho = true;
                break;
              }
            }
          }
        }
      }

      // Skip if not a shinsho
      if (!isShinsho) continue;

      // [EXPERIMENTAL] Date filtering disabled for testing
      // const datekoukai = book?.hanmoto?.datekoukai || '';
      // const datemodified = book?.hanmoto?.datemodified || '';

      // // Only include books that were added to openBD in the current month or later
      // if (!isCurrentMonthOrLater(datekoukai)) {
      //   continue; // Skip books that were added before this month
      // }

      // // Only include books where datemodified is within 3 days of datekoukai
      // // This filters out books that were registered earlier but only appeared in the ISBN list later
      // if (!isRecentlyRegistered(datekoukai, datemodified)) {
      //   continue; // Skip books that were only modified, not newly registered
      // }

      // Get publication date from summary (for display purposes only)
      const pubdate = book?.summary?.pubdate || '';

      // Extract relevant information
      const collateralDetail = onix.CollateralDetail || {};
      const publishingDetail = onix.PublishingDetail || {};
      const productIdentifier = onix.ProductIdentifier || {};

      const isbn = productIdentifier.IDValue || book.isbn || 'N/A';
      const isbn10 = convertToISBN10(isbn);
      const title = descriptiveDetail.TitleDetail?.TitleElement?.TitleText?.content || 'N/A';

      // Get author information
      let author = 'N/A';
      let authorBio = '';
      const contributors = descriptiveDetail.Contributor || [];
      if (contributors.length > 0) {
        const mainAuthor = contributors.find(c => c.ContributorRole?.[0] === 'A01') || contributors[0];
        author = mainAuthor?.PersonName?.content || 'N/A';
        authorBio = mainAuthor?.BiographicalNote || '';
      }

      // Get publisher
      const publisher = publishingDetail.Imprint?.ImprintName ||
                       publishingDetail.Publisher?.[0]?.PublisherName || 'N/A';

      // Format publication date (YYYYMM -> YYYY年MM月)
      let publishedDate = '発売日未定';
      if (pubdate && pubdate.length >= 6) {
        const year = pubdate.substring(0, 4);
        const month = pubdate.substring(4, 6);
        publishedDate = `${year}年${parseInt(month)}月`;
      }

      // Get page count
      let pageCount = '';
      const extents = descriptiveDetail.Extent || [];
      for (const extent of extents) {
        if (extent.ExtentType === '00' || extent.ExtentType === '11') { // Page count
          pageCount = extent.ExtentValue || '';
          break;
        }
      }

      // Get description/summary and table of contents
      const textContents = collateralDetail.TextContent || [];
      let description = '';
      let tableOfContents = '';
      for (const text of textContents) {
        const textType = text.TextType;
        const textContent = text.Text || '';

        if (textType === '02' || textType === '03') { // Short or long description
          description = textContent;
        } else if (textType === '04') { // Table of contents
          tableOfContents = textContent;
        }
      }

      // Get cover image URL
      let coverImageUrl = '';
      const supportingResources = collateralDetail.SupportingResource || [];
      for (const resource of supportingResources) {
        if (resource.ResourceContentType === '01') { // Front cover
          const versions = resource.ResourceVersion || [];
          if (versions.length > 0) {
            coverImageUrl = versions[0].ResourceLink || '';
            break;
          }
        }
      }

      shinshoBooks.push({
        isbn,
        isbn10,
        title,
        author,
        authorBio,
        publisher,
        series: seriesName,
        publishedDate,
        pageCount,
        description,
        tableOfContents,
        coverImageUrl,
        discoveredAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error(`Error processing book:`, error.message);
      continue;
    }
  }

  console.log(`✓ Found ${shinshoBooks.length} shinsho books`);
  return shinshoBooks;
}
