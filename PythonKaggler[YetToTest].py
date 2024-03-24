from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import pandas as pd
import time
from webdriver_manager.chrome import ChromeDriverManager

input_file = 'input.csv'
output_file = 'output.csv'
data = []

# Function to scrape data using Selenium
def scrape_data(url):
    options = Options()
    options.headless = True
    browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        browser.get(url)
        time.sleep(5)  # Wait for 5 seconds for the page to load

        soup = BeautifulSoup(browser.page_source, 'html.parser')

        github = soup.find("a", href=lambda href: href and "github.com" in href)
        linkedin = soup.find("a", href=lambda href: href and "linkedin.com" in href)

        github_link = github['href'] if github else 'N/A'
        linkedin_link = linkedin['href'] if linkedin else 'N/A'

        job_title = 'N/A'
        li_elements = soup.find_all("li", class_="sc-hWnHHk cIEfHe")

        for li in li_elements:
            if 'work' in li.text:
                job_title = li.find("p").text.strip()
                break

        return {'URL': url, 'GitHub': github_link, 'LinkedIn': linkedin_link, 'Job Title': job_title}

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return {'URL': url, 'GitHub': 'N/A', 'LinkedIn': 'N/A', 'Job Title': 'N/A'}

    finally:
        browser.quit()

# Main function to read URLs and scrape data
def read_urls_and_scrape():
    urls = pd.read_csv(input_file, header=None).iloc[:, 0].tolist()

    for url in urls:
        print(f"Scraping: {url}")
        result = scrape_data(url)
        data.append(result)

    df = pd.DataFrame(data)
    df.to_csv(output_file, index=False)
    print('The CSV file was written successfully')

# Execute the main function
if __name__ == "__main__":
    read_urls_and_scrape()
