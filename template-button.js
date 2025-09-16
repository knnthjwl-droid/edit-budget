document.getElementById('downloadTemplate').addEventListener('click', () => {

    const headers = [
        "facebook_name",
        "page_name",
        "item_name",
        "ad_account_id",
        "new_budget",
        "campaign_code"
    ];

    const sampleRow = [
        "Armando Tampos",
        "SamplePage",
        "SampleItem",
        "123456789012345",
        "500.00",
        "CAMP123"

    ];

    // Build CSV with headers + sample row
    const csv = headers.join(",") + "\n" + sampleRow.join(",") + "\n";

    // Create blob for download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a hidden link to trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log message
    if (window.addTerminalMessage) {
        window.addTerminalMessage('📄 Downloaded CSV template with sample data.', 'SUCCESS');
    }
});
