import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import csv

# Constants
API_KEY = '56787f9df62613cca856e93082439648'  # Replace with your ScraperAPI API key
INPUT_CSV = 'input.csv'  # Your input file with URLs
OUTPUT_CSV = 'output.csv'  # File to save the scraping results
DELAY_BETWEEN_REQUESTS = 10  # Delay between requests in seconds
IP_ROTATE_EVERY = 300  # Rotate IP every 300 requests

def scrape_and_parse(url, session_number):
    """
    Scrape a single URL using ScraperAPI and parse the HTML content to extract specific data.
    """
    payload = {'api_key': API_KEY, 'url': url, 'session_number': session_number}
    try:
        response = requests.get('http://api.scraperapi.com', params=payload)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'lxml')
            name = soup.select_one('h6').text if soup.select_one('h6') else 'N/A'
            github = soup.select_one("a.sc-gjLLEI.ensagI[href*='github.com']").get('href') if soup.select_one("a.sc-gjLLEI.ensagI[href*='github.com']") else 'N/A'
            linkedin = soup.select_one("a.sc-gjLLEI.ensagI[href*='linkedin.com']").get('href') if soup.select_one("a.sc-gjLLEI.ensagI[href*='linkedin.com']") else 'N/A'
            job = soup.select_one("li.sc-damGuE.eODcCD:has(i.rmwc-icon[aria-label='work_outline']) > p.sc-dJGMql.sc-cUuGV.jCrglO.dsBhXX").text if soup.select_one("li.sc-damGuE.eODcCD:has(i.rmwc-icon[aria-label='work_outline']) > p.sc-dJGMql.sc-cUuGV.jCrglO.dsBhXX") else 'N/A'
            location = soup.select_one("li.sc-damGuE.eODcCD:has(i.rmwc-icon[aria-label='pin_drop']) > p.sc-dJGMql.sc-cUuGV.jCrglO.dsBhXX").text if soup.select_one("li.sc-damGuE.eODcCD:has(i.rmwc-icon[aria-label='pin_drop']) > p.sc-dJGMql.sc-cUuGV.jCrglO.dsBhXX") else 'N/A'
            return [url, name, github, linkedin, job, location]
        else:
            print(f"Error: Received status code {response.status_code}")
            return [url, 'Failed to scrape'] * 5  # Replicate failure message for all fields
    except Exception as e:
        print(f"Exception occurred: {e}")
        return [url, 'Exception'] * 5  # Replicate exception message for all fields

def main():
    urls = pd.read_csv(INPUT_CSV, header=None)[0].tolist()
    results = []
    session_number = 1

    for index, url in enumerate(urls):
        print(f"Scraping URL {index + 1}/{len(urls)}: {url}")
        result = scrape_and_parse(url, session_number)
        results.append(result)

        if (index + 1) % IP_ROTATE_EVERY == 0:
            print("Rotating IP...")
            session_number += 1  # Increment session_number to simulate IP rotation

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Save results to CSV
    with open(OUTPUT_CSV, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["URL", "Name", "GitHub", "LinkedIn", "Job", "Location"])
        writer.writerows(results)
    print(f"Scraping completed. Results saved to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
