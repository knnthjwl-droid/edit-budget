import { adAccountCache } from './lru-cache.js';
import { getAccessTokenInfo } from './validate-AT.js';
import { ACCESS_TOKEN } from "./config.js";
import { runBudgetUpdate } from './run-button.js'; 
export { renderTable, addTerminalMessage};


export let tableData = [];

let currentPage = 1;

const rowsPerPage = 10;
const apiUrl = "http://127.0.0.1:5095";



function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

function addTerminalMessage(message, level = 'INFO') {
    const colors = {
        INFO: 'text-secondary',
        SUCCESS: 'text-success',
        ERROR: 'text-danger',
        WARNING: 'text-warning'
    };
    const p = document.createElement('p');
    p.className = `m-1 ${colors[level] || colors.INFO}`;
    p.textContent = `[${getCurrentTime()}] [${level}] ${message}`;
    const terminal = document.getElementById('terminalOutput');
    terminal.appendChild(p);
    terminal.scrollTop = terminal.scrollHeight;
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const csvInput = document.getElementById('csvFileInput');
    const importBtn = document.getElementById('importCSV');
    const importBtn2 = document.getElementById('importCSV2');
    const saveBtn = document.getElementById('saveChanges');
    const runBtn = document.getElementById('runUpdate');

    // Event listeners
    importBtn.addEventListener('click', () => csvInput.click());
    importBtn2?.addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', handleFileUpload);
    saveBtn.addEventListener('click', saveEditChanges);
    runBtn.addEventListener('click', runBudgetUpdate);

    addTerminalMessage("Upload module initialized.", "INFO");
});

// ---------------- CSV Upload ----------------
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    addTerminalMessage(`Processing file: ${file.name}`, 'INFO');

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data.length === 0) {
                addTerminalMessage('CSV file is empty.', 'ERROR');
                return;
            }

            const requiredHeaders = ['facebook_name', 'page_name', 'item_name', 'ad_account_id', 'new_budget', 'campaign_code'];
            const csvHeaders = results.meta.fields.map(h => h.toLowerCase());
            const missingHeaders = requiredHeaders.filter(h => !csvHeaders.includes(h));

            if (missingHeaders.length > 0) {
                addTerminalMessage(`Missing required columns: ${missingHeaders.join(', ')}`, 'ERROR');
                return;
            }

            processCSVData(results.data);
            addTerminalMessage(`Successfully imported ${results.data.length} records.`, 'SUCCESS');
        },
        error: function(error) {
            addTerminalMessage(`Error parsing CSV: ${error.message}`, 'ERROR');
        }
    });
}

// ---------------- Process Data ----------------
function processCSVData(data) {
    tableData = data.map((row, index) => ({
        ...row,
        id: index,
        ad_account_status: 'Pending',
        access_token_status: 'Pending',
        status: 'Pending',
        errors: []
    }));

    renderTable();
    validateData();
}

// ---------------- Render Table ----------------
function renderTable() {
    const tableBody = document.getElementById('tableBody');

    if (tableData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <i class="fas fa-info-circle text-secondary mb-2" style="font-size: 2rem;"></i>
                    <p>No data available. Import a CSV file to get started.</p>
                    <button class="btn btn-primary btn-sm" id="importCSV2">
                        <i class="fas fa-file-import me-1"></i>Import CSV
                    </button>
                </td>
            </tr>
        `;
        document.getElementById('importCSV2').addEventListener('click', () => document.getElementById('csvFileInput').click());
        return;
    }

    // Calculate which rows to show
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = tableData.slice(startIndex, startIndex + rowsPerPage);

    tableBody.innerHTML = '';
    paginatedData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.ad_account_id || ''}</td>
            <td><span class="status-badge status-${row.ad_account_status === 'Verified' ? 'verified' : 'not-verified'}">${row.ad_account_status}</span></td>
            <td>${row.facebook_name || ''}</td>
            <td><span class="status-badge status-${row.access_token_status === 'Verified' ? 'verified' : 'not-verified'}">${row.access_token_status}</span></td>
            <td>${row.page_name || ''}</td>
            <td>${row.item_name || ''}</td>
            <td>${row.campaign_code || ''}</td>
            <td>${row.new_budget ? parseFloat(row.new_budget).toFixed(2) : ''}</td>
            <td><span class="status-badge status-${row.status === 'Verified' ? 'verified' : row.status === 'Processing' ? 'processing' : 'not-verified'}">${row.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-btn" data-index="${startIndex + index}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => openEditModal(e.currentTarget.dataset.index));
    });

    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    paginationContainer.innerHTML = `
        <button class="btn btn-sm btn-outline-primary me-2" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">Prev</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary ms-2" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">Next</button>
    `;

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });
}



// ---------------- Edit Modal ----------------
function openEditModal(index) {
    const row = tableData[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('facebookName').value = row.facebook_name || '';
    document.getElementById('pageName').value = row.page_name || '';
    document.getElementById('itemName').value = row.item_name || '';
    document.getElementById('adAccountId').value = row.ad_account_id || '';
    document.getElementById('campaignCode').value = row.campaign_code || '';
    document.getElementById('newBudget').value = row.new_budget || '';
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    editModal.show();
}

function saveEditChanges() {
    const index = document.getElementById('editIndex').value;
    if (!index) return;

    tableData[index] = {
        ...tableData[index],
        facebook_name: document.getElementById('facebookName').value,
        page_name: document.getElementById('pageName').value,
        item_name: document.getElementById('itemName').value,
        ad_account_id: document.getElementById('adAccountId').value,
        campaign_code: document.getElementById('campaignCode').value,
        new_budget: document.getElementById('newBudget').value,
        ad_account_status: 'Pending',
        access_token_status: 'Pending',
        status: 'Pending',
        errors: []
    };

    renderTable();
    validateRow(index);
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    addTerminalMessage(`Updated row ${parseInt(index) + 1}`, 'INFO');
}

// ---------------- Validation ----------------
async function validateData() {
    addTerminalMessage('Starting validation process...', 'INFO');

    const adAccountIds = [...new Set(tableData.map(r => r.ad_account_id).filter(Boolean))];

    // ✅ use plural version
    const accountStatuses = await validateAdAccounts(adAccountIds, ACCESS_TOKEN);

    for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];
        row.ad_account_status = accountStatuses[row.ad_account_id] ? 'Verified' : 'Not Verified';
        validateRow(i); // continues with token + field validation
    }

    addTerminalMessage('Validation process completed.', 'SUCCESS');
    renderTable();
}

async function validateRow(index) {
    const row = tableData[index];
    row.errors = [];

    row.ad_account_status = (await validateAdAccount(row.ad_account_id, ACCESS_TOKEN)) ? 'Verified' : 'Not Verified';

    // Check token validity and Facebook name match
    const tokenInfo = await getAccessTokenInfo(ACCESS_TOKEN);
    if (tokenInfo.isValid && row.facebook_name === tokenInfo.fbName) {
        row.access_token_status = 'Verified';
    } else {
        row.access_token_status = 'Not Verified';
        if (!tokenInfo.isValid) row.errors.push('Access token invalid');
        if (row.facebook_name !== tokenInfo.fbName) row.errors.push('Facebook Name does not match access token');
    }

    if (!row.facebook_name) row.errors.push('Facebook Name required');
    if (!row.page_name) row.errors.push('Page Name required');
    if (!row.item_name) row.errors.push('Item Name required');
    if (!row.campaign_code) row.errors.push('Campaign Code required');
    if (!row.new_budget || isNaN(parseFloat(row.new_budget)) || parseFloat(row.new_budget) <= 0) {
        row.errors.push('New Budget must be positive');
    }

    row.status = (row.ad_account_status === 'Verified' && row.access_token_status === 'Verified' && row.errors.length === 0) ? 'Verified' : 'Not Verified';
    tableData[index] = row;

    addTerminalMessage(`Row ${parseInt(index) + 1} validation completed. Status: ${row.status}`, row.status === 'Verified' ? 'SUCCESS' : 'ERROR');
    renderTable();
}

// ---------------- Simulated API ----------------
// Batch version
async function validateAdAccounts(adAccountIds, token) {
    try {
        const processedData = adAccountIds.map(id => ({ ad_account_id: id }));

        const response = await fetch(
            `${apiUrl}/api/v1/verify-ads-account/verify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    skip_zrok_interstitial: "true",
                },
                body: JSON.stringify({ user_id: 1, campaigns: processedData }),
            }
        );

        const result = await response.json();

        if (response.ok && result.verified_accounts) {
            addTerminalMessage(
                `Verification completed for ${result.verified_accounts.length} accounts`,
                "SUCCESS"
            );

            // 🔑 return a lookup object keyed by ad_account_id
            const statusMap = {};
            result.verified_accounts.forEach(acc => {
                statusMap[acc.ad_account_id] = acc.is_verified === true;
            });
            return statusMap;
        } else {
            const errorMsg = result.message || "No verified accounts returned from API.";
            addTerminalMessage(`⚠️ ${errorMsg}`, "WARNING");
            return {}; // return empty map to avoid crash
        }
    } catch (error) {
        addTerminalMessage(`❌ Failed to verify ad accounts: ${error.message}`, "ERROR");
        return {}; // return empty map to avoid crash
    }
}


// Single version
async function validateAdAccount(adAccountId, token) {
    const cached = adAccountCache.get(adAccountId);
    if (cached !== null) return cached;

    const results = await validateAdAccounts([adAccountId], token);
    const status = results[adAccountId] || false;
    adAccountCache.set(adAccountId, status);
    return status;
}