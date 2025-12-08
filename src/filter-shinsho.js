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
    'SB新書',
    'ブルーバックス',
    '岩波ジュニア新書',
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

      // Extract relevant information
      const collateralDetail = onix.CollateralDetail || {};
      const publishingDetail = onix.PublishingDetail || {};
      const productIdentifier = onix.ProductIdentifier || {};

      const isbn = productIdentifier.IDValue || book.isbn || 'N/A';
      const title = descriptiveDetail.TitleDetail?.TitleElement?.TitleText?.content || 'N/A';

      // Get author information
      let author = 'N/A';
      const contributors = descriptiveDetail.Contributor || [];
      if (contributors.length > 0) {
        const mainAuthor = contributors.find(c => c.ContributorRole?.[0] === 'A01') || contributors[0];
        author = mainAuthor?.PersonName?.content || 'N/A';
      }

      // Get publisher
      const publisher = publishingDetail.Imprint?.ImprintName ||
                       publishingDetail.Publisher?.[0]?.PublisherName || 'N/A';

      // Get publication date
      const pubDates = publishingDetail.PublicationDate || [];
      let publishedDate = 'N/A';
      if (pubDates.length > 0) {
        publishedDate = pubDates[0];
      }

      // Get description/summary
      const textContents = collateralDetail.TextContent || [];
      let description = '';
      for (const text of textContents) {
        if (text.TextType === '02' || text.TextType === '03') { // Short or long description
          description = text.Text || '';
          break;
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
        title,
        author,
        publisher,
        series: seriesName,
        publishedDate,
        description,
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
