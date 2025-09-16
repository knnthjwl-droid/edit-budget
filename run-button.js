import { tableData, renderTable, addTerminalMessage } from './upload-button.js';
import { ACCESS_TOKEN } from './config.js';

// Entry point
export async function runBudgetUpdate() {
    const validRows = tableData.filter(r => r.status === 'Verified');
    if (validRows.length === 0) {
        addTerminalMessage('❌ No verified rows to process.', 'ERROR');
        return;
    }

    addTerminalMessage(`▶️ Starting budget update for ${validRows.length} campaigns...`, 'INFO');
    for (let i = 0; i < validRows.length; i++) {
        await updateCampaignBudget(validRows[i]);
    }
    addTerminalMessage('✅ Budget update process completed.', 'SUCCESS');
}

// Process one row
async function updateCampaignBudget(row) {
    const dataIndex = tableData.findIndex(r => r.id === row.id);
    if (dataIndex !== -1) tableData[dataIndex].status = 'Processing';
    renderTable();

    addTerminalMessage(`🔄 Updating campaign: ${row.page_name} (${row.item_name})`, 'INFO');

    try {
        // 1. Find the campaign ID
        const campaignId = await findCampaignId(
            row.ad_account_id,
            row.campaign_code,
            ACCESS_TOKEN
        );

        if (!campaignId) {
            addTerminalMessage(`❌ Campaign not found for ${row.page_name}`, 'ERROR');
            tableData[dataIndex].status = 'Error';
            tableData[dataIndex].errors.push('Campaign not found');
            renderTable();
            return;
        }

        // 2. Update the budget
        const budgetInCents = Math.round(parseFloat(row.new_budget) * 100);
        const success = await updateCampaignBudgetOnFacebook(campaignId, budgetInCents, ACCESS_TOKEN);

        if (success) {
            addTerminalMessage(`💰 Budget updated to ₱${parseFloat(row.new_budget).toFixed(2)} for ${row.page_name}`, 'SUCCESS');
            tableData[dataIndex].status = 'Updated';
        } else {
            addTerminalMessage(`⚠️ Failed to update budget for ${row.page_name}`, 'ERROR');
            tableData[dataIndex].status = 'Error';
            tableData[dataIndex].errors.push('Failed to update budget');
        }

        renderTable();
    } catch (err) {
        addTerminalMessage(`❌ API error: ${err.message}`, 'ERROR');
        tableData[dataIndex].status = 'Error';
        tableData[dataIndex].errors.push(err.message);
        renderTable();
    }

    // Delay to avoid rate-limits
    await new Promise(resolve => setTimeout(resolve, 500));
}

// ------------------ Actual API Calls ------------------

// Step 1: Search for campaign ID under the ad account
async function findCampaignId(adAccountId, campaignCode, token) {
    const url = `https://graph.facebook.com/v23.0/act_${adAccountId}/campaigns?fields=id,name&access_token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    // Try to match campaign by name containing the campaign code
    const campaign = data.data.find(c => c.name.includes(campaignCode));
    return campaign ? campaign.id : null;
}

// Step 2: Update budget for a campaign
async function updateCampaignBudgetOnFacebook(campaignId, budgetInCents, token) {
    const url = `https://graph.facebook.com/v23.0/${campaignId}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            daily_budget: budgetInCents.toString(),
            access_token: token
        })
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("Facebook API error:", err);
        return false;
    }

    const result = await response.json();
    return result.success === true;
}
