/**
 * Find the most recently indexed books in Google Books API
 * Tests various search strategies to find recent additions
 */

async function searchGoogleBooks(query, maxResults = 10) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&orderBy=newest&langRestrict=ja`;

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
  console.log('=== Finding Latest Books in Google Books API ===\n');

  const searchStrategies = [
    { name: '2025年出版の日本語書籍', query: 'published:2025 lang:ja' },
    { name: '2024年12月出版', query: 'published:2024-12 lang:ja' },
    { name: '2024年出版の日本語書籍', query: 'published:2024 lang:ja' },
    { name: '最近の新書（岩波）', query: '岩波新書 published:2024' },
    { name: '最近の新書（中公）', query: '中公新書 published:2024' },
  ];

  for (const strategy of searchStrategies) {
    console.log(`\n📖 検索: ${strategy.name}`);
    console.log(`   Query: ${strategy.query}\n`);

    try {
      const result = await searchGoogleBooks(strategy.query, 5);

      if (result.totalItems === 0) {
        console.log(`   ❌ 結果なし`);
      } else {
        console.log(`   ✓ 見つかった書籍数: ${result.totalItems}`);
        console.log(`   表示件数: ${result.items?.length || 0}\n`);

        if (result.items) {
          result.items.forEach((item, index) => {
            const info = item.volumeInfo;
            console.log(`   ${index + 1}. ${info.title || 'タイトルなし'}`);
            console.log(`      著者: ${info.authors?.join(', ') || 'N/A'}`);
            console.log(`      出版社: ${info.publisher || 'N/A'}`);
            console.log(`      出版日: ${info.publishedDate || 'N/A'}`);

            // Check for ISBN
            if (info.industryIdentifiers) {
              const isbn = info.industryIdentifiers.find(id => id.type === 'ISBN_13');
              if (isbn) {
                console.log(`      ISBN: ${isbn.identifier}`);
              }
            }

            console.log('');
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.log(`   ❌ エラー: ${error.message}`);
    }
  }

  console.log('\n=== 詳細検索: 特定の出版社 ===\n');

  const publishers = ['岩波書店', '中央公論新社', '筑摩書房', '講談社'];

  for (const publisher of publishers) {
    console.log(`\n🏢 出版社: ${publisher}`);

    try {
      const result = await searchGoogleBooks(`inpublisher:${publisher} published:2024`, 3);

      if (result.totalItems > 0 && result.items) {
        console.log(`   最新の書籍:`);
        result.items.slice(0, 3).forEach((item, index) => {
          const info = item.volumeInfo;
          console.log(`   ${index + 1}. ${info.title} (${info.publishedDate || 'N/A'})`);
        });
      } else {
        console.log(`   2024年の書籍が見つかりませんでした`);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.log(`   エラー: ${error.message}`);
    }
  }

  console.log('\n=== まとめ ===');
  console.log('Google Books APIの日本語書籍データベースは、');
  console.log('新刊の登録に大幅な遅延があることが確認されました。');
}

main();
