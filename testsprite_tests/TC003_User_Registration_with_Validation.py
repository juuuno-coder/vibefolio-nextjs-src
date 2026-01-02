import asyncio
from playwright import async_api
from playwright.async_api import expect
import random
import string

def random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=["--window-size=1280,720"],
        )
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto("http://localhost:3000/signup", wait_until="domcontentloaded")
        
        await expect(page.get_by_role("heading", name="회원가입")).to_be_visible()

        username = f"testuser_{random_string()}"
        email = f"{username}@example.com"
        password = "password123"

        await page.get_by_label("사용자 이름").fill(username)
        await page.get_by_label("이메일").fill(email)
        await page.get_by_label("비밀번호", exact=True).fill(password)
        await page.get_by_label("비밀번호 확인").fill(password)
        
        page.on("dialog", lambda dialog: dialog.accept())

        await page.get_by_role("button", name="가입하기").click()

        await page.wait_for_url("**/mypage/profile", timeout=10000)
        
        print(f"Test passed: Successfully registered user {email} and redirected to profile page.")
        
        with open("testsprite_tests/test_credentials.txt", "w") as f:
            f.write(f"{email}\n{password}")

    except Exception as e:
        print(f"Test case failed: {e}")
        raise
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
