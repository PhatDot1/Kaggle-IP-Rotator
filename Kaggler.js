const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { parse } = require('csv-parse/sync'); // Correct import for parse function
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const API_KEY = '56787f9df62613cca856e93082439648';
const inputFile = 'input.csv';
const outputFile = 'output.csv';

const csvWriter = createCsvWriter({
  path: outputFile,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'github', title: 'GitHub' },
    { id: 'linkedin', title: 'LinkedIn' },
    { id: 'location', title: 'Location' },
    { id: 'job', title: 'Job' },
  ],
});

// Function to scrape data
async function scrapeData(url) {
  // Including &render=true to ensure JavaScript content is rendered
  const fullUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=true`;
  try {
    const response = await axios.get(fullUrl);
    const $ = cheerio.load(response.data);

    // Updated selectors based on the provided HTML
    const github = $("a[href*='github.com']").attr('href') || 'N/A';
    const linkedin = $("a[href*='linkedin.com']").attr('href') || 'N/A';
    const location = $("li:has(i[aria-label='pin_drop']) p").text() || 'N/A';
    const job = $("li:has(i[aria-label='work_outline']) p").text() || 'N/A';

    return { url, github, linkedin, location, job };
  } catch (error) {
    console.error(`Error scraping ${url}: `, error.message);
    return { url, github: 'N/A', linkedin: 'N/A', location: 'N/A', job: 'N/A' };
  }
}

// Main function to read URLs and scrape data
async function readUrlsAndScrape() {
  // Synchronous reading and parsing of the CSV file
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const urls = parse(fileContent, { columns: false, skip_empty_lines: true }).flat();

  const scrapeResults = [];
  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    const data = await scrapeData(url);
    scrapeResults.push(data);
  }

  // Writing the results to a CSV file
  csvWriter.writeRecords(scrapeResults)
    .then(() => console.log('The CSV file was written successfully'))
    .catch((err) => console.error('Error writing CSV:', err));
}

// Execute the main function
readUrlsAndScrape();
