const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFile = 'input.csv';
const outputFile = 'output.csv';

const csvWriter = createCsvWriter({
  path: outputFile,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'github', title: 'GitHub' },
    { id: 'linkedin', title: 'LinkedIn' },
    { id: 'jobTitle', title: 'Location' },
  ],
});

// Function to scrape data using Puppeteer
async function scrapeData(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Additional delay if needed, after page load
    await page.evaluate(() => {
      return new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
    });


    // Get page content and load into Cheerio
    const content = await page.content();
    const $ = cheerio.load(content);

    const github = $("a[href*='github.com']").attr('href') || 'N/A';
    const linkedin = $("a[href*='linkedin.com']").attr('href') || 'N/A';
    let jobTitle = 'N/A';
    const liElements = $("li.sc-hWnHHk.cIEfHe");

    if (liElements.eq(1).find('i').text().includes('pin')) {
      jobTitle = liElements.eq(1).find("p").text().trim();
    } else if (liElements.eq(2).find('i').text().includes('pin')) {
      jobTitle = liElements.eq(2).find("p").text().trim();
    }


    return { url, github, linkedin, jobTitle };
  } catch (error) {
    console.error(`Error scraping ${url}: `, error.message);
    return { url, github: 'N/A', linkedin: 'N/A', jobTitle: 'N/A' };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

// Main function to read URLs and scrape data
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

// Execute the main function
readUrlsAndScrape();
