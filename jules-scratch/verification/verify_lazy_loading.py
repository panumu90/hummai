from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Navigate to the homepage.
            page.goto("http://localhost:5000")

            # 2. Wait for the heading to be visible, indicating the page has loaded.
            expect(page.get_by_role("heading", name="Cody's Express-React App")).to_be_visible()

            # 3. Take a screenshot of the homepage.
            page.screenshot(path="jules-scratch/verification/homepage.png")

            # 4. Navigate to the Impact Analysis page.
            page.get_by_role("link", name="Impact Analysis").click()

            # 5. Wait for the heading of the new page to be visible.
            expect(page.get_by_role("heading", name="Impact Analysis")).to_be_visible(timeout=10000)

            # 6. Take a screenshot of the Impact Analysis page.
            page.screenshot(path="jules-scratch/verification/impact-analysis-page.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()