/**
 * Find all series names containing "新書" in openBD database
 * Memory-efficient version using streaming approach
 */

import { writeFile, readFile } from 'fs/promises';

// Current supported labels
const currentLabels = [
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

async function fetchCoverage() {
  console.log('📥 Fetching ISBN coverage from openBD...');
  const response = await fetch('https://api.openbd.jp/v1/coverage');
  if (!response.ok) {
    throw new Error(`Failed to fetch coverage: ${response.status}`);
  }
  const isbns = await response.json();
  console.log(`✓ Total ISBNs in openBD: ${isbns.length.toLocaleString()}`);
  return isbns;
}

async function fetchBatchDetails(isbns) {
  const url = `https://api.openbd.jp/v1/get?isbn=${isbns.join(',')}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.filter(d => d !== null);
    }
  } catch (error) {
    console.error(`Batch error: ${error.message}`);
  }
  return [];
}

function extractSeriesName(book) {
  try {
    const collection = book?.onix?.DescriptiveDetail?.Collection;
    if (!collection) return null;

    const titleDetail = collection.TitleDetail;
    if (!titleDetail?.TitleElement) return null;

    const elements = Array.isArray(titleDetail.TitleElement)
      ? titleDetail.TitleElement
      : [titleDetail.TitleElement];

    for (const element of elements) {
      const titleText = element.TitleText?.content;
      if (titleText) {
        return titleText;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

function normalizeLabel(seriesName) {
  // Remove volume numbers, edition info, etc.
  return seriesName
    .replace(/\s*[;；]\s*.*$/, '')  // Remove everything after semicolon
    .replace(/\s*\d+$/, '')          // Remove trailing numbers
    .trim();
}

async function main() {
  console.log('🔍 Finding all shinsho labels in openBD...\n');

  // Fetch all ISBNs
  const allIsbns = await fetchCoverage();

  console.log(`\n📖 Scanning ${allIsbns.length.toLocaleString()} ISBNs for shinsho series...`);
  console.log('   (Processing in batches to avoid memory issues...)\n');

  const seriesWithShinsho = new Map(); // seriesName -> count
  const batchSize = 100;
  let processedCount = 0;
  let foundShinshoCount = 0;

  // Process in batches without storing all results
  for (let i = 0; i < allIsbns.length; i += batchSize) {
    const batch = allIsbns.slice(i, i + batchSize);
    const books = await fetchBatchDetails(batch);

    // Extract series names containing "新書" immediately
    for (const book of books) {
      const seriesName = extractSeriesName(book);
      if (seriesName && seriesName.includes('新書')) {
        const normalized = normalizeLabel(seriesName);
        seriesWithShinsho.set(normalized, (seriesWithShinsho.get(normalized) || 0) + 1);
        foundShinshoCount++;
      }
    }

    processedCount += batch.length;

    // Progress indicator every 50,000 ISBNs
    if (processedCount % 50000 < batchSize) {
      console.log(`  Progress: ${processedCount.toLocaleString()} / ${allIsbns.length.toLocaleString()} ISBNs (found ${foundShinshoCount.toLocaleString()} shinsho books so far)`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  console.log(`\n✓ Scan complete! Found ${foundShinshoCount.toLocaleString()} shinsho books\n`);

  // Sort by count (descending)
  const sortedSeries = [...seriesWithShinsho.entries()].sort((a, b) => b[1] - a[1]);

  // Separate into covered and not covered
  const covered = [];
  const notCovered = [];

  for (const [series, count] of sortedSeries) {
    const isCovered = currentLabels.some(label => series.includes(label) || label.includes(series));
    if (isCovered) {
      covered.push([series, count]);
    } else {
      notCovered.push([series, count]);
    }
  }

  console.log('=' .repeat(70));
  console.log('📚 ALL SERIES CONTAINING "新書" IN OPENBD');
  console.log('=' .repeat(70));

  console.log(`\n✅ CURRENTLY COVERED (${covered.length} labels):`);
  console.log('-'.repeat(50));
  for (const [series, count] of covered) {
    console.log(`  ${series.padEnd(30)} (${count.toLocaleString()} books)`);
  }

  console.log(`\n❌ NOT YET COVERED (${notCovered.length} labels):`);
  console.log('-'.repeat(50));
  for (const [series, count] of notCovered) {
    console.log(`  ${series.padEnd(30)} (${count.toLocaleString()} books)`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Total unique shinsho labels: ${sortedSeries.length}`);
  console.log(`Currently covered: ${covered.length}`);
  console.log(`Not yet covered: ${notCovered.length}`);
  console.log('='.repeat(70));

  // Save results to file for reference
  const results = {
    timestamp: new Date().toISOString(),
    totalShinshoBooks: foundShinshoCount,
    totalUniqueLabels: sortedSeries.length,
    covered: covered.map(([label, count]) => ({ label, count })),
    notCovered: notCovered.map(([label, count]) => ({ label, count })),
  };

  await writeFile('data/shinsho-labels-analysis.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Results saved to data/shinsho-labels-analysis.json');
}

main().catch(console.error);
