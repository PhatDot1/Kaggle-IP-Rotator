
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const API_KEY = '56787f9df62613cca856e93082439648'; // Make sure to replace this with your actual API key
const inputFile = 'input.csv';
const outputFile = 'output.csv';

const csvWriter = createCsvWriter({
  path: outputFile,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'github', title: 'GitHub' },
    { id: 'linkedin', title: 'LinkedIn' },
    { id: 'fullText', title: 'Full Text' },
  ],
});

async function scrapeData(url) {
  const fullUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=true`;
  try {
    const response = await axios.get(fullUrl);
    const $ = cheerio.load(response.data);

    // Diagnostic logging to check if elements are found
    console.log(`Scraping URL: ${url}`);
    console.log(`Number of li.sc-hWnHHk.cIEfHe elements found: `, $("li.sc-hWnHHk.cIEfHe").length);

    const github = $("a[href*='github.com']").attr('href') || 'N/A';
    const linkedin = $("a[href*='linkedin.com']").attr('href') || 'N/A';

    const fullText = $("li.sc-hWnHHk.cIEfHe").map((_, el) => {
      // Log each matched element's text for diagnostic purposes
      const text = $(el).text().trim();
      console.log(`Found text: `, text);
      return text;
    }).get().join(' ');

    console.log(`Full text for URL ${url}: `, fullText); // Log the fullText for diagnostics

    return { url, github, linkedin, fullText };
  } catch (error) {
    console.error(`Error scraping ${url}: `, error.message);
    return { url, github: 'N/A', linkedin: 'N/A', fullText: 'N/A' };
  }
}

async function readUrlsAndScrape() {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  // Use the parse function directly from csv-parse sync
  const urls = parse(fileContent, { columns: false, skip_empty_lines: true }).flat();
  const scrapeResults = [];
  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    const data = await scrapeData(url);
    scrapeResults.push(data);
  }
  csvWriter.writeRecords(scrapeResults)
    .then(() => console.log('The CSV file was written successfully'))
    .catch((err) => console.error('Error writing CSV:', err));
}

readUrlsAndScrape();

