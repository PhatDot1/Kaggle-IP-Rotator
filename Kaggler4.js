const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFile = 'input.csv';
const outputFile = 'output.csv';
const userDataDirPath = './user_data'; // Custom user data directory

const csvWriter = createCsvWriter({
  path: outputFile,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'github', title: 'GitHub' },
    { id: 'linkedin', title: 'LinkedIn' },
    { id: 'jobTitle', title: 'Location' },
  ],
  append: true, // Ensure appending to the file
});

async function scrapeData(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      timeout: 0, // Disable browser launch timeout
      userDataDir: userDataDirPath, // Use a custom user data directory
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 }); // Disable navigation timeout

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));

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
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing the browser:', closeError);
      }
    }
  }
}

async function readUrlsAndScrape() {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const urls = parse(fileContent, { columns: false, skip_empty_lines: true }).flat();

  const scrapeResults = [];
  for (let i = 0; i < urls.length; i++) {
    console.log(`Scraping: ${urls[i]}`);
    const data = await scrapeData(urls[i]);
    scrapeResults.push(data);

    if ((i + 1) % 100 === 0 || i === urls.length - 1) {
      await csvWriter.writeRecords(scrapeResults.splice(0, scrapeResults.length))
        .then(() => console.log('Progress saved to CSV file'))
        .catch((err) => console.error('Error writing CSV:', err));
    }
  }
}

readUrlsAndScrape();
