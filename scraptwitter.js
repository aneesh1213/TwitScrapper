import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PROXY_URL = process.env.PROXY_URL;

mongoose.connect(MONGO_URI, {
    tls: true
  }).then(() => {
    console.log('Connected to MongoDB');
  }).catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });
  


export async function scrapTwitter() {
  const options = new chrome.Options();
  if (PROXY_URL) {
    options.addArguments(`--proxy-server=${PROXY_URL}`);
  }

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  const uniqueId = `run-${Date.now()}`;
  const result = {
    uniqueId,
    trends: [],
    ip: PROXY_URL ? PROXY_URL.split("@").pop() : "Local IP (No Proxy)",
    timestamp: new Date(),
  };

  try {
    await driver.get("https://x.com/login");
    console.log("Navigated to Twitter login page.");

    // Wait for username field and enter credentials
    const usernameField = await driver.wait(
      until.elementLocated(By.name("text")),
      10000
    );
    await usernameField.sendKeys(process.env.TWITTER_USERNAME);
    await driver.findElement(By.css("div[data-testid='LoginForm_Login_Button']")).click();

    // Wait for password field and enter credentials
    const passwordField = await driver.wait(
      until.elementLocated(By.name("password")),
      10000
    );
    await passwordField.sendKeys(process.env.TWITTER_PASSWORD);
    await driver.findElement(By.css("div[data-testid='LoginForm_Login_Button']")).click();

    // Wait for trends section to load
    const trendsSection = await driver.wait(
      until.elementLocated(By.css("section[aria-labelledby='accessible-list-0']")),
      15000
    );
    const trendElements = await trendsSection.findElements(By.css("div span"));

    for (let i = 0; i < 5 && i < trendElements.length; i++) {
      const trendText = await trendElements[i].getText();
      if (trendText) {
        result.trends.push(trendText);
      }
    }

    // Save data to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("twitterTrends");
    const collection = db.collection("trends");
    await collection.insertOne(result);
    await client.close();

    console.log("Scraped data saved to MongoDB:", result);
  } catch (err) {
    console.error("Error scraping Twitter:", err);
  } finally {
    await driver.quit();
  }

  return result;
}
