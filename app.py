const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const API_KEY = '56787f9df62613cca856e93082439648';
const inputFile = 'input.csv';
const outputFile = 'output.csv';

const results = [];

// Function to scrape data
async function scrapeData(url) {
  const fullUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${url}`;
  try {
    const response = await axios.get(fullUrl);
    const $ = cheerio.load(response.data);

    const github = $("a[href*='github.com']").attr('href') || 'N/A';
    const linkedin = $("a[href*='linkedin.com']").attr('href') || 'N/A';
    const location = $("p.sc-dJGMql.sc-cUuGV.jCrglO.dsBhXX").text() || 'N/A';
    const job = $("li.sc-damGuE.eODcCD").find("p").text() || 'N/A';

    return { url, github, linkedin, location, job };
  } catch (error) {
    console.error(`Error scraping ${url}: `, error.message);
    return { url, github: 'N/A', linkedin: 'N/A', location: 'N/A', job: 'N/A' };
  }
}

// CSV writer setup
const csvWriter = createCsvWriter({
  path: outputFile,
  header: [
    {id: 'url', title: 'URL'},
    {id: 'github', title: 'GitHub'},
    {id: 'linkedin', title: 'LinkedIn'},
    {id: 'location', title: 'Location'},
    {id: 'job', title: 'Job'},
  ]
});

// Main function to read URLs and scrape data
function main() {
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (data) => results.push(data.URL))
    .on('end', async () => {
      const scrapeResults = [];
      for (let url of results) {
        console.log(`Scraping: ${url}`);
        const data = await scrapeData(url);
        scrapeResults.push(data);
      }

      csvWriter.writeRecords(scrapeResults)
        .then(() => console.log('The CSV file was written successfully'));
    });
}

main();
