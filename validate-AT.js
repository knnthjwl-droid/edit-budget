import { tokenCache } from './lru-cache.js';
import { ACCESS_TOKEN } from "./config.js";


const ACCESS_TOKEN_DIV = document.querySelector(".d-inline-block.bg-white");
const TERMINAL = document.getElementById("terminalOutput");

// assume tableData is global (declared in edit-budget.js)
window.tokenStatus = "Unknown";  

// Helper function to get current time as HH:MM:SS
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

// Formal logging function
function logToTerminal(message, level = "INFO") {
    const colors = {
        INFO: "text-secondary",
        SUCCESS: "text-success",
        ERROR: "text-danger",
        WARNING: "text-warning"
    };
    const p = document.createElement("p");
    p.className = `m-1 ${colors[level] || colors.INFO}`;
    p.textContent = `[${getCurrentTime()}] [${level}] ${message}`;
    TERMINAL.appendChild(p);
    TERMINAL.scrollTop = TERMINAL.scrollHeight;
}

// Function to check access token validity
async function checkAccessToken(token) {
    logToTerminal("Starting access token validation...", "INFO");

    try {
        const response = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
        const data = await response.json();

        if (data.data && data.data.is_valid) {
            window.tokenStatus = "Verified";
            ACCESS_TOKEN_DIV.innerHTML = `
                <small class="text-primary">Access Token: Connected</small>
                <i class="fas fa-check-circle text-success ms-1"></i>
            `;
            logToTerminal("Access token is valid.", "SUCCESS");
            logToTerminal(`App ID: ${data.data.app_id}`, "INFO");
            logToTerminal(`Token expires at: ${new Date(data.data.expires_at * 1000).toLocaleString()}`, "INFO");
        } else {
            window.tokenStatus = "Invalid";
            ACCESS_TOKEN_DIV.innerHTML = `
                <small class="text-danger">Access Token: Invalid</small>
                <i class="fas fa-times-circle text-danger ms-1"></i>
            `;
            logToTerminal("Access token is invalid.", "ERROR");
        }
    } catch (error) {
        window.tokenStatus = "Error";
        ACCESS_TOKEN_DIV.innerHTML = `
            <small class="text-danger">Access Token: Error</small>
            <i class="fas fa-exclamation-circle text-warning ms-1"></i>
        `;
        logToTerminal(`Error checking token: ${error.message}`, "ERROR");
        console.error(error);
    }

    // 🔹 Update all rows in tableData with latest token status
    if (typeof tableData !== "undefined") {
        tableData.forEach(row => {
            row.access_token_status = window.tokenStatus;
        });
        if (typeof renderTable === "function") {
            renderTable();
        }
    }
}

let cachedTokenInfo = null;

export async function fbApiRetry(fn, retries = 3, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
            else throw err;
        }
    }
}


export async function getAccessTokenInfo(token) {
    const cached = tokenCache.get(token);
    if (cached) return cached;

    const info = await fbApiRetry(async () => {
        const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
        const debugData = await debugRes.json();
        if (debugData.data?.is_valid) {
            const userRes = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
            const userData = await userRes.json();
            return { isValid: true, fbName: userData.name };
        } else {
            return { isValid: false, fbName: null };
        }
    }) || { isValid: false, fbName: null };

    tokenCache.set(token, info);
    return info;
}

// Run validation on page load
checkAccessToken(ACCESS_TOKEN);
