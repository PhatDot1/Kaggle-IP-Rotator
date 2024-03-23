const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
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
    { id: 'jobElement', title: 'Job Element' },
    { id: 'locationElement', title: 'Location Element' },
  ],
});

async function scrapeData(url) {
  const fullUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=true`;
  try {
    const response = await axios.get(fullUrl);
    const $ = cheerio.load(response.data);
    const github = $("a[href*='github.com']").attr('href') || 'N/A';
    const linkedin = $("a[href*='linkedin.com']").attr('href') || 'N/A';
    const job = $("li:contains('at')").text().split('at')[1].trim() || 'N/A';
    const location = $("li:contains('City')").text().trim() || 'N/A';
    const jobElement = $("li:contains('at')").html() || 'N/A';
    const locationElement = $("li:contains('City')").html() || 'N/A';
    return { url, github, linkedin, location, job, jobElement, locationElement };
  } catch (error) {
    console.error(`Error scraping ${url}: `, error.message);
    return { url, github: 'N/A', linkedin: 'N/A', location: 'N/A', job: 'N/A', jobElement: 'N/A', locationElement: 'N/A' };
  }
}

async function readUrlsAndScrape() {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
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
