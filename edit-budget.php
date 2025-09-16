<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Budget System</title>
    <link rel="stylesheet" href="edit-budget-style.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container-fluid py-4">
        <div class="row">
            <div class="col-12">
                <div class="hero-section">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h1>Edit Budget System</h1>
                            <p class="mb-0">Update Facebook campaign budgets in bulk using CSV upload</p>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <div class="access-token-container d-inline-block bg-white px-3 py-2 rounded" id="AccessTokenContainer" >
                                <small class="text-primary"></small>
                                <i class="fas fa-check-circle text-success ms-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-table me-2"></i>Campaign Budgets</span>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-light" id="downloadTemplate">
                                <i class="fas fa-download me-1"></i>Template
                            </button>
                            <button class="btn btn-sm btn-light" id="exportData">
                                <i class="fas fa-file-export me-1"></i>Export
                            </button>
                            <button class="btn btn-sm btn-light" id="clearAll">
                                <i class="fas fa-trash me-1"></i>Clear All
                            </button>
                            <button class="btn btn-sm btn-light" id="importCSV">
                                <i class="fas fa-file-import me-1"></i>Import CSV
                            </button>
                            <button class="btn btn-sm btn-success" id="runUpdate">
                                <i class="fas fa-play-circle me-1"></i>RUN
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover" id="budgetTable">
                                <thead>
                                    <tr>
                                        <th>Ad Account ID</th>
                                        <th>Ad Account Status</th>
                                        <th>Facebook Name</th>
                                        <th>Access Token Status</th>
                                        <th>Page Name</th>
                                        <th>Item Name</th>
                                        <th>Campaign Code</th>
                                        <th>New Budget</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="tableBody">
                                    <tr>
                                        <td colspan="10" class="text-center py-4">
                                            <i class="fas fa-info-circle text-secondary mb-2" style="font-size: 2rem;"></i>
                                            <p>No data available. Import a CSV file to get started.</p>
                                            <button class="btn btn-primary btn-sm" id="importCSV2">
                                                <i class="fas fa-file-import me-1"></i>Import CSV
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div class="d-flex justify-content-center mt-3" id="paginationContainer"></div>

                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-terminal me-2"></i>Terminal Output
                    </div>
                    <div class="card-body p-0">
                        <div class="terminal" id="terminalOutput">

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden file input for CSV import -->
    <input type="file" id="csvFileInput" accept=".csv" style="display: none;">

    <!-- Edit Modal -->
    <div class="modal fade" id="editModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Campaign Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editForm">
                        <input type="hidden" id="editIndex">
                        <div class="mb-3">
                            <label for="facebookName" class="form-label">Facebook Name</label>
                            <input type="text" class="form-control" id="facebookName">
                        </div>
                        <div class="mb-3">
                            <label for="pageName" class="form-label">Page Name</label>
                            <input type="text" class="form-control" id="pageName">
                        </div>
                        <div class="mb-3">
                            <label for="itemName" class="form-label">Item Name</label>
                            <input type="text" class="form-control" id="itemName">
                        </div>
                        <div class="mb-3">
                            <label for="adAccountId" class="form-label">Ad Account ID</label>
                            <input type="text" class="form-control" id="adAccountId">
                        </div>
                        <div class="mb-3">
                            <label for="campaignCode" class="form-label">Campaign Code</label>
                            <input type="text" class="form-control" id="campaignCode">
                        </div>
                        <div class="mb-3">
                            <label for="newBudget" class="form-label">New Budget</label>
                            <input type="number" step="0.01" class="form-control" id="newBudget">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveChanges">Save Changes</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
    
    <script type="module" src="validate-AT.js"></script>
    <script type="module" src="upload-button.js"></script>
    <script type="module" src="template-button.js"></script>
    <script type="module" src="export-button.js"></script>



</body>
</html>