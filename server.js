import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // if using Node < 18, install: npm install node-fetch
import { ACCESS_TOKEN } from "./config.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(__dirname));

app.use(cors());
app.use(express.json());



// Verify Ad Accounts against Facebook API
app.post("/api/v1/verify-ads-account/verify", async (req, res) => {
  const { campaigns } = req.body;

  if (!campaigns || !Array.isArray(campaigns)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const verified_accounts = [];

    for (const c of campaigns) {
      const adAccountId = c.ad_account_id;

      try {
        const response = await fetch(
          `https://graph.facebook.com/v23.0/act_${adAccountId}?fields=id,account_status&access_token=${ACCESS_TOKEN}`
        );

        const data = await response.json();

        if (response.ok && data.id) {
          verified_accounts.push({
            ad_account_id: adAccountId,
            is_verified: true,
            account_status: data.account_status,
          });
        } else {
          verified_accounts.push({
            ad_account_id: adAccountId,
            is_verified: false,
            error: data.error ? data.error.message : "Unknown error",
          });
        }
      } catch (err) {
        verified_accounts.push({
          ad_account_id: adAccountId,
          is_verified: false,
          error: err.message,
        });
      }
    }

    res.json({ verified_accounts });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Start server
const PORT = 5095;
app.listen(PORT, () => {
  console.log(`✅ API running on http://127.0.0.1:${PORT}`);
});
