import express from "express";
import { scrapTwitter } from "./scraptwitter.js";

const app = express();

// Serve static files (e.g., index.html)
app.use(express.static("public"));

app.get("/scrape-twitter", async (req, res) => {
  try {
    const data = await scrapTwitter();
    res.json({
      message: `Successfully fetched the data at ${data.timestamp}`,
      data,
    });
  } catch (err) {
    console.error("Error fetching the trends:", err);
    res.status(500).json({ error: "Failed to scrape data", details: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
