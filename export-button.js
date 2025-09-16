import { tableData } from './upload-button.js'; 

document.getElementById('exportData').addEventListener('click', () => {
    if (!tableData || tableData.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Define headers (lowercase, clean)
    const headers = [
        "ad_account_id",
        "facebook_name",
        "page_name",
        "item_name",
        "campaign_code",
        "new_budget"
    ];

    const csvRows = [];
    csvRows.push(headers.join(",")); // add headers

    tableData.forEach(row => {
        const rowData = [
            row.ad_account_id || '',
            row.facebook_name || '',
            row.page_name || '',
            row.item_name || '',
            row.campaign_code || '',
            row.new_budget ? parseFloat(row.new_budget).toFixed(2) : ''
        ];
        csvRows.push(rowData.join(","));
    });

    const csv = csvRows.join("\n");

    // Create blob for download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.addTerminalMessage) {
        window.addTerminalMessage(`📄 Exported all ${tableData.length} rows as CSV.`, 'SUCCESS');
    }
});
