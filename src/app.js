/*
Navigates to twitter.com and logs into the account.
Saves cookie data to a json file.
Uses cookies to log back in.
*/

require('dotenv').config({
    path: './pw.env'
});
const fs = require('fs');
const {
    Builder,
    By,
    until
} = require('selenium-webdriver')
// Initiate the browser

const driver = new Builder().forBrowser('firefox').build();
// Run App
async function init() {
    // Check existing cookie data.
    const cookies = await checkExistingCookies();
    if (!cookies) {
        console.log("No cookies.... logging in!")
        // Navigate to twitter.com/login
        await driver.get("http://twitter.com/login");
        await logIn();
        await storeCookies();
    } else {
        console.log("cookies found! adding them to the driver...")
        await navigateToHome();
        await addCookies(cookies);
        console.log("going home with cookies")
        await navigateToHome();
    }

}

// Log In
async function logIn(phone) {
    // Wait until loading is finished...
    await driver.wait(until.elementLocated(By.css('input[name="session[username_or_email]"]')))

    // Locate the Inputs and Submit Button
    const emailInput = await driver.findElement(By.css('input[name="session[username_or_email]"]'));
    const passwordInput = await driver.findElement(By.css('input[name="session[password]"]'));
    const submitButton = await driver.findElement(By.css('div[role="button"]'))


    let username;
    if (!phone) {
        username = process.env.TWITTER_EMAIL
        console.log("No phone flag. username : ", username)
    } else {
        username = process.env.TWITTER_PHONE
        console.log("Phone flag. username : ", username)
    }

    // Send Keys to inputs and Submit
    console.log("sending keys....")
    await emailInput.sendKeys(username);
    await passwordInput.sendKeys(process.env.TWITTER_PASSWORD);
    await submitButton.click();
    await verifyLogin();


}

async function storeCookies() {
    // Save the cookies
    (await driver).manage().getCookies().then(cookies => {
        console.log("STRINGIFYING THE COOKIES!")
        let jsonObj = JSON.stringify(cookies);
        console.log("WRITING THE COOKIES TO twitter_cookies.json: ", jsonObj)
        fs.writeFileSync('./twitter_cookies.json', jsonObj)
    })
}

// Verify Login
async function verifyLogin() {

    console.log("Verifying login...")
    await timeout(3000)
    try {
        console.log("Finding element by xpath...")
        const text = await driver.findElement(By.xpath('/html/body/div/div/div/div[2]/main/div/div/div[1]/span')).getText();
        if (text.includes('unusual login')) {
            console.log("Unusual login activity, re-submitting login.")
            return logIn("phone");
        }
    } catch (err) {
        if (err) {
            console.log("No unusual login.")
        }
        return Promise.resolve(true)
    }

}

// Add cookies to driver
async function addCookies(cookies) {
    console.log("adding cookies...")
    cookies = JSON.parse(cookies);
    for (const [key, value] of Object.entries(cookies)) {
        let cookieObject = {}
        for (const [k, v] of Object.entries(value)) {
            cookieObject[k] = v
        }
        cookieObject.domain = "twitter.com"
        cookieObject.sameSite = "Lax"
        await (await driver).manage().addCookie({
            name: cookieObject.name,
            value: cookieObject.value,
            path: cookieObject.path,
            domain: cookieObject.domain,
            secure: cookieObject.secure,
            httpOnly: cookieObject.httpOnly,
            expiry: cookieObject.expiry,
            sameSite: cookieObject.sameSite
        })
    }
}
async function navigateToHome() {
    await driver.get('https://twitter.com/home')
}

// Check for existing twitter_cookies.json file
async function checkExistingCookies() {
    console.log("checking for existing cookies...")
    try {
        let data = fs.readFileSync('./twitter_cookies.json', 'utf8')
        return data;
    } catch (err) {
        return false;
    }
}

// Timout Function
function timeout(ms) {
    console.log(`pausing execution for ${ms}ms...`)
    return new Promise(resolve => setTimeout(resolve, ms));
}

init();