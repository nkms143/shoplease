
// ==========================================
// SETTINGS MODULE
// ==========================================
const SettingsModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel" style="max-width: 600px; margin: 0 auto;">
                <h3>Global Application Settings</h3>
                <div style="margin-top: 2rem;">
                    <div class="form-group">
                        <label class="form-label">Delay Penalty Rate (₹ per day)</label>
                        <input type="number" id="set-penalty-rate" class="form-input" placeholder="e.g. 15">
                    </div>

                    <div class="glass-panel" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; margin: 1rem 0;">
                        <h5 style="margin-bottom: 0.5rem; color: var(--primary-color);">GST Rate History</h5>
                        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">
                            Define GST rates and their effective dates. The system will automatically use the rate applicable for any given month.
                        </p>

                        <table class="data-table" style="margin-bottom: 1rem;">
                            <thead>
                                <tr>
                                    <th>Effective Date</th>
                                    <th>GST Rate (%)</th>
                                    <th style="width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="gst-history-list">
                                <!-- Populated via JS -->
                            </tbody>
                        </table>

                        <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
                            <div style="flex: 1;">
                                <label class="form-label" style="font-size: 0.8rem;">New Effective Date</label>
                                <input type="date" id="new-gst-date" class="form-input">
                            </div>
                            <div style="flex: 1;">
                                <label class="form-label" style="font-size: 0.8rem;">New Rate (%)</label>
                                <input type="number" id="new-gst-rate" class="form-input" placeholder="e.g. 12">
                            </div>
                            <button onclick="SettingsModule.addGstEntry()" class="btn-primary" style="padding: 0.7rem;">+</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Penalty Implementation Date</label>
                        <input type="date" id="set-penalty-date" class="form-input">
                        <small style="color:#666;">Penalties will only apply for delays AFTER this date.</small>
                    </div>

                    <button onclick="SettingsModule.save()" class="btn-primary" style="width:100%; margin-top: 1rem;">Save Settings</button>
                </div>

                <!-- BACKUP & RESTORE SECTION -->
                <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="margin-bottom: 1rem; color: var(--primary-color);">Data Backup & Recovery</h4>
                    <div style="display: grid; gap: 1rem; grid-template-columns: 1fr 1fr 1fr;">
                        <button id="btn-backup" class="btn-primary" style="background: #0ea5e9; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem; padding: 0.5rem;">
                            <span>⬇</span> Local
                        </button>
                        <button id="btn-cloud-backup" class="btn-primary" style="background: #8b5cf6; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem; padding: 0.5rem;">
                            <span>☁</span> Cloud
                        </button>
                        <button id="btn-restore" class="btn-primary" style="background: #f59e0b; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem; padding: 0.5rem;">
                            <span>⬆</span> Restore
                        </button>
                        <input type="file" id="restore-file-input" accept=".json" style="display: none;">
                    </div>
                    <small style="display: block; margin-top: 0.5rem; color: var(--text-muted); text-align: center;">
                        Download a JSON backup to keep your data safe.<br>
                        <strong>Warning:</strong> Restoring will overwrite all current data.
                    </small>
                </div>
            </div>
        `;

        const s = Store.getSettings();
        // Load Penalty Settings
        if (s) {
            document.getElementById('set-penalty-rate').value = s.penaltyRate || 15;
            document.getElementById('set-penalty-date').value = s.penaltyDate || '2025-01-01';
        }

        // Initialize/Load GST History
        SettingsModule.gstHistory = s && s.gstHistory ? s.gstHistory : [];

        // Migration: If old settings exist but no history, create initial history
        if ((!s || !s.gstHistory || s.gstHistory.length === 0) && s) {
            if (s.gstBaseRate) {
                SettingsModule.gstHistory.push({ date: '2000-01-01', rate: s.gstBaseRate });
            }
            if (s.gstNewRate && s.gstEffectiveDate) {
                SettingsModule.gstHistory.push({ date: s.gstEffectiveDate, rate: s.gstNewRate });
            }
            // Fallback if absolutely nothing
            if (SettingsModule.gstHistory.length === 0) {
                SettingsModule.gstHistory.push({ date: '2000-01-01', rate: 18 });
            }
        }

        SettingsModule.renderGstList();

        // Bind Backup/Restore Events (Hypothetical, assuming Store has these methods or we add them later)
        // For now, just ensuring ID existence doesn't crash
    },

    gstHistory: [],

    renderGstList() {
        const tbody = document.getElementById('gst-history-list');
        if (!tbody) return;
        // Sort by Date Descending (Newest first)
        this.gstHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = this.gstHistory.map((item, index) => `
            <tr>
                <td>${item.date}</td>
                <td>${item.rate}%</td>
                <td><button onclick="SettingsModule.removeGstEntry(${index})" style="color:red; background:none; border:none; cursor:pointer;">×</button></td>
            </tr>
        `).join('');
    },

    addGstEntry() {
        const d = document.getElementById('new-gst-date').value;
        const r = document.getElementById('new-gst-rate').value;
        if (!d || !r) { alert("Enter date and rate"); return; }

        this.gstHistory.push({ date: d, rate: parseFloat(r) });
        this.renderGstList();

        // Clear inputs
        document.getElementById('new-gst-date').value = '';
        document.getElementById('new-gst-rate').value = '';
    },

    removeGstEntry(index) {
        this.gstHistory.splice(index, 1);
        this.renderGstList();
    },

    save() {
        const rate = document.getElementById('set-penalty-rate').value;
        const date = document.getElementById('set-penalty-date').value;

        if (!rate || !date) {
            alert("Please fill required penalty fields");
            return;
        }

        if (this.gstHistory.length === 0) {
            alert("Please add at least one GST Rate entry (e.g. from 2000-01-01)");
            return;
        }

        const newSettings = {
            penaltyRate: parseFloat(rate),
            penaltyDate: date,
            gstHistory: this.gstHistory
        };

        Store.saveSettings(newSettings).then(() => {
            alert("Settings Saved!");
        });
    }
};

// --- BACKUP LOGIC ---
document.getElementById('btn-backup').addEventListener('click', () => {
    try {
        const data = Store.getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suda-shop-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Backup Failed: ' + err.message);
        console.error(err);
    }
});

// Cloud Backup Button
document.getElementById('btn-cloud-backup').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cloud-backup');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Saving...';
    btn.disabled = true;

    try {
        await Store.createCloudBackup();
        alert("Cloud Backup Created Successfully!");
    } catch (e) {
        console.error("Cloud Backup Failed", e);
        alert("Cloud Backup Failed: " + (e.message || "Unknown Error"));
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- RESTORE LOGIC ---
const restoreBtn = document.getElementById('btn-restore');
const fileInput = document.getElementById('restore-file-input');

restoreBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('⚠️ CRITICAL WARNING ⚠️\n\nRestoring from backup will COMPLETELY ERASE and OVERWRITE all current:\n- Shops\n- Applicants (Tenants)\n- Payments\n- History\n\nThis action cannot be undone.\n\nAre you absolutely sure you want to proceed?')) {
        e.target.value = ''; // Reset
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            Store.restoreData(data);
            alert('✅ Data restored successfully! The application will now reload.');
            location.reload();
        } catch (err) {
            alert('❌ Restore Failed: ' + err.message);
            console.error(err);
        }
    };
    reader.readAsText(file);
});


// ==========================================
// NOTICE MODULE
// ==========================================
const NoticeModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Defaulters Notice Generation</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" id="btn-warn-late" style="background: #f59e0b;">
                             ✉️ Send Late Warnings
                        </button>
                        <button class="btn-primary" id="btn-scan-defaulters" style="background: #e11d48;">
                            Scan for Defaulters
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                     <table class="data-table">
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Shop No</th>
                                <th>Renter Name</th>
                                <th>Rent Due (Months)</th>
                                <th>Base Rent Due</th>
                                <th>GST Due</th>
                                <th>Penalty Due</th>
                                <th>Total Outstanding</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="notice-list-body">
                             <tr><td colspan="8" style="text-align:center;">Click "Scan" to identify defaulters.</td></tr>
                        </tbody>
                     </table>
                </div>
            </div>
            
            <!-- Hidden Print Template -->
            <div id="print-area" style="display:none;"></div>
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; display: block !important; }
                }

            </style>
        `;

        document.getElementById('btn-scan-defaulters').addEventListener('click', () => {
            this.scanDefaulters();
        });

        document.getElementById('btn-warn-late').addEventListener('click', async () => {
            const btn = document.getElementById('btn-warn-late');
            btn.innerHTML = 'Sending...';
            btn.disabled = true;
            try {
                const count = await Store.processLatePaymentWarnings();
                alert(`Warnings Sent Successfully to ${count} tenants.`);
            } catch (e) {
                console.error(e);
                alert("Failed to send warnings.");
            } finally {
                btn.innerHTML = '✉️ Send Late Warnings';
                btn.disabled = false;
            }
        });
    },

    scanDefaulters() {
        const applicants = Store.getApplicants();
        const tbody = document.getElementById('notice-list-body');
        const settings = Store.getSettings();
        const penaltyRate = parseFloat(settings.penaltyRate) || 15;
        const implementationDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
        const today = new Date();

        // Helper to check dues
        let serial = 1;
        let html = '';

        applicants.forEach(app => {
            const dues = this.calculateApplicantDues(app, penaltyRate, implementationDate, today);

            if (dues.totalAmount > 0) {
                // Count previous-lease months (if any)
                const prevCount = dues.details.filter(d => d.source === 'history').length;
                const monthsDisplay = prevCount > 0
                    ? `${dues.monthsCount} <span style="font-size:0.75rem; color:#6b7280; display:block;">(${prevCount} prev)</span>`
                    : String(dues.monthsCount);

                html += `
                    <tr>
                        <td>${serial++}</td>
                        <td><strong>${app.shopNo}</strong></td>
                        <td>${app.applicantName}</td>
                        <td style="text-align: center; font-weight: bold;">${monthsDisplay}</td>
                        <td>₹${dues.baseRent.toFixed(2)}</td>
                        <td>₹${dues.gst.toFixed(2)}</td>
                        <td style="color: #ef4444;">₹${dues.penalty.toFixed(2)}</td>
                        <td style="font-weight: bold;">₹${dues.totalAmount.toFixed(2)}</td>
                        <td>
                            <button class="btn-gen-notice btn-primary" style="padding: 4px 12px; font-size: 0.8rem;"
                                data-shop="${app.shopNo}">
                                Generate Notice
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        tbody.innerHTML = html || '<tr><td colspan="9" style="text-align:center; color:green;">No defaulters found!</td></tr>';

        // Attach Events
        const buttons = tbody.querySelectorAll('.btn-gen-notice');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.generateNotice(btn.dataset.shop);
            });
        });
    },


    calculateApplicantDues(app, rate, implementationDateBtn, today) {
        // Now delegating to the central Single Source of Truth in Store
        // The Store.calculateOutstandingDues uses:
        // 1. Settings from Store (so 'rate' and 'implementationDateBtn' params are now redundant but we ignore them to ensure consistency)
        // 2. 'today' as reference date (which corresponds to 'referenceDate' param)

        return Store.calculateOutstandingDues(app, today);
    },

    printNotice(htmlContent) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print Notice</title>
                    <style>
                        @media print {
                            @page { size: A4 portrait; margin: 15mm 20mm; }
                            body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; color: black; }
                        }
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                        .notice-content { width: 100%; }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            // Optional: Remove iframe after print dialog closes (approximate)
                            setTimeout(() => { 
                                // window.frameElement.remove(); // Can cause issues if removed too early
                            }, 1000);
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    },

    generateNotice(shopNo) {
        try {
            const app = Store.getApplicants().find(a => a.shopNo === shopNo);
            if (!app) {
                alert('Error: Applicant not found for shop ' + shopNo);
                return;
            }

            // Remove existing print overlay to prevent conflicts
            const existingOverlay = document.getElementById('print-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            const overlay = document.createElement('div');
            overlay.id = 'print-overlay';
            document.body.appendChild(overlay);

            const settings = Store.getSettings();
            const impDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
            const dues = this.calculateApplicantDues(app, parseFloat(settings.penaltyRate) || 15, impDate, new Date());
            const monthsText = dues.details.map(d => d.source === 'history' ? `${d.month} (prev)` : d.month).join(', ');

            // Define Logo HTML based on settings
            let logoHtml = '';
            if (settings.logoUrl) {
                logoHtml = `
                    <div style="text-align: right; margin-bottom: 0;">
                        <img src="${settings.logoUrl}" style="height: 90px; max-width: 250px; object-fit: contain;">
                    </div>
                `;
            } else {
                logoHtml = `
                    <div style="text-align: right; margin-bottom: 0;">
                         <div style="display:inline-block; text-align:center;">
                            <span style="font-weight:900; font-size: 20pt; color: #047857; display:block; line-height:1;">SUDA</span>
                            <span style="font-size: 6pt; letter-spacing: 1px;">SIDDIPET URBAN DEVELOPMENT AUTHORITY</span>
                         </div>
                    </div>
                `;
            }

            // --- 1. CORE NOTICE CONTENT (Clean HTML) ---
            const noticeBody = `
                <!-- Logo Header -->
                ${logoHtml}

                <!-- Main Header -->
                <div style="text-align: center; margin-bottom: 1rem;">
                    <h2 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Office of the Siddipet Urban Development Authority</h2>
                    <h2 style="margin: 2px 0 0 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">Siddipet District</h2>
                </div>

                <!-- Date -->
                <div style="text-align: right; margin-bottom: 1rem; font-weight: bold;">
                    Dt: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
                </div>

                <!-- Notice Title -->
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <span style="font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 2px;">N O T I C E</span>
                </div>

                <!-- Subject Section -->
                <div style="display: flex; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="font-weight: bold; white-space: nowrap; margin-right: 1rem; text-decoration: underline;">Sub:-</div>
                    <div style="text-align: justify; flex: 1;">
                        SUDA Siddipet – Letting out of SUDA Shop No. <strong>${app.shopNo}</strong>, in favor of <strong>${app.applicantName}</strong> 
                        being the highest bidder for <u>Rs. ${app.rentTotal}</u> per month plus GST@18% w.e.f 
                        ${new Date(app.rentStartDate || app.leaseDate).toLocaleString('default', { month: 'long', year: 'numeric' })} – 
                        Monthly rent for the months from <strong>${dues.details.length > 0 ? dues.details[0].month : '...'}</strong> to 
                        <strong>${dues.details.length > 0 ? dues.details[dues.details.length - 1].month : '...'}</strong> for 
                        <u>Rs. ${dues.totalAmount.toFixed(2)}</u> pending to be pay attracts 
                        <u>Rs. ${(parseFloat(settings.penaltyRate) || 15).toFixed(2)}</u> penalty per ${settings.penaltyRate ? 'day' : 'month'} 
                        for delay payment to an amount of <u>Rs. ${dues.totalAmount.toFixed(2)}</u> (including Penalty) and 
                        take action to evict from the Shop – notice issued.
                    </div>
                </div>

                <!-- Separator -->
                <div style="text-align: center; margin: 1rem 0; letter-spacing: 3px;">
                    &lt;&lt;&lt;&gt;&gt;&gt;
                </div>

                <!-- Body Paragraph 1 -->
                <p style="text-align: justify; text-indent: 2.5rem; margin-bottom: 1rem; margin-top: 0;">
                    It is fact that you had allotted SUDA shop no. <strong>${app.shopNo}</strong> for Rs. ${app.rentTotal} (Including GST) 
                    being the highest bidder. But whereas, you have not been paid the monthly rent for the months from 
                    <strong>${monthsText}</strong> inspite of repeated oral request of this office.
                </p>

                <!-- Body Paragraph 2 -->
                <p style="text-align: justify; text-indent: 2.5rem; margin-bottom: 2rem;">
                    In this connection, you are specifically instructed to pay the pending monthly rents within 7 days from the 
                    date of receipt of this notice. Further, you are remarkably remember that, it is an eviction notice on the part 
                    of your responsibility in payment of monthly rent every month upto 5th of every month. But you have been failed 
                    to pay the monthly rent pertains to the <strong>${dues.monthsCount}</strong> months for the months from 
                    <strong>${dues.details.length > 0 ? dues.details[0].month : ''}</strong> to 
                    <strong>${dues.details.length > 0 ? dues.details[dues.details.length - 1].month : ''}</strong> continuously. 
                    The non-payment of monthly rent will result for eviction from the occupation of shops. Further you are instructed 
                    to pay the <u>${dues.monthsCount}</u> months monthly rent by adding Rs. ${(parseFloat(settings.penaltyRate) || 15).toFixed(2)} 
                    penalty per ${settings.penaltyRate ? 'day' : 'month'} totalling to an amount of 
                    <strong>Rs. ${dues.totalAmount.toFixed(2)}</strong> (Rent ${((dues.baseRent + dues.gst).toFixed(2))} and 
                    Penalty Amount for ${dues.monthsCount} Months Rs. ${dues.penalty.toFixed(2)}).
                </p>

                <!-- Signature & Address Container -->
                <!-- SIGNATURE FIRST (Right Aligned) -->
                <div style="text-align: right; margin-bottom: 3rem; margin-top: 1rem; padding-right: 1rem;">
                    <div style="display: inline-block; text-align: center; min-width: 200px;">
                        <div style="font-weight: bold;">Vice Chairman</div>
                        <div style="margin-top: 5px;">SUDA, Siddipet</div>
                    </div>
                </div>

                <!-- TO ADDRESS SECOND (Left Aligned) -->
                <div style="text-align: left; font-size: 11pt;">
                    <div style="font-weight: bold; margin-bottom: 5px;">To,</div>
                    <div style="margin-left: 0;">
                        <strong>${app.applicantName}</strong><br>
                        ${app.proprietorShopName ? `Prop: ${app.proprietorShopName}<br>` : ''}
                        Shop No: ${app.shopNo}<br>
                        ${app.address}<br>
                        Siddipet District.
                    </div>
                </div>
            `;

            // --- 2. PREVIEW OVERLAY (Screen Only) ---
            overlay.innerHTML = `
                <style>
                    #print-overlay {
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                        background: rgba(0,0,0,0.85); z-index: 10000;
                        overflow-y: auto; display: flex; justify-content: center;
                        padding: 40px 0; box-sizing: border-box;
                    }
                    #preview-page {
                        width: 210mm; min-height: 297mm;
                        padding: 15mm 20mm;
                        background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                        font-family: 'Times New Roman', serif; color: black; line-height: 1.4;
                        box-sizing: border-box; display: flex; flex-direction: column;
                    }
                    .toolbar {
                        position: fixed; top: 20px; right: 30px; display: flex; gap: 10px; z-index: 10001;
                    }
                </style>
                
                <div class="toolbar">
                    <button id="btn-close-preview" style="cursor:pointer; padding: 8px 16px; font-size: 14px; background: #ef4444; color: white; border: none; border-radius: 4px;">Close Preview</button>
                    <button id="btn-print-action" style="cursor:pointer; padding: 8px 16px; font-size: 14px; background: #3b82f6; color: white; border: none; border-radius: 4px;">🖨️ Print Notice</button>
                </div>

                <div id="preview-page">
                    ${noticeBody}
                </div>
            `;

            // Attach Events
            document.getElementById('btn-close-preview').onclick = () => overlay.remove();
            document.getElementById('btn-print-action').onclick = () => this.printNotice(noticeBody);

        } catch (e) {
            alert('Notice Generation Error: ' + e.message);
            console.error(e);
        }
    }
};

// ==========================================
// GST REMITTANCE MODULE
// ==========================================
const GstRemittanceModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <h3>GST Remittance Management</h3>
                
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: space-between;">
                    <div class="glass-panel" style="background: rgba(255,255,255,0.6); flex:1; text-align: center;">
                        <h4 style="color: var(--text-muted); font-size: 0.9rem;">Total GST Collected</h4>
                        <div id="gst-collected" style="font-size: 1.8rem; font-weight: bold; color: #6366f1;">₹0.00</div>
                    </div>
                    <div class="glass-panel" style="background: rgba(255,255,255,0.6); flex:1; text-align: center;">
                        <h4 style="color: var(--text-muted); font-size: 0.9rem;">Total Remitted</h4>
                        <div id="gst-remitted" style="font-size: 1.8rem; font-weight: bold; color: #10b981;">₹0.00</div>
                    </div>
                    <div class="glass-panel" style="background: rgba(255,255,255,0.6); flex:1; text-align: center;">
                        <h4 style="color: var(--text-muted); font-size: 0.9rem;">Pending Remittance</h4>
                        <div id="gst-pending" style="font-size: 1.8rem; font-weight: bold; color: #ef4444;">₹0.00</div>
                    </div>
                </div>

                <!-- Current filter label & warnings -->
                <div id="gst-filter-meta" style="margin-top: 0.75rem; display:flex; justify-content:flex-start; align-items:center; gap:1rem;">
                    <div id="gst-filter-label" style="color: #475569; font-weight:600;">Current filter: All Months, All Years</div>
                    <div id="gst-warning" style="color:#ef4444; font-weight:700; display:none;">Warning: Remitted exceeds collected for the selected period.</div>
                </div>

                <div class="glass-panel" style="margin-top: 2rem; border: 1px solid #e2e8f0;">
                    <h4 style="margin-bottom: 1rem;">Record New Remittance</h4>
                    <form id="remittance-form" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; align-items: end;">
                        <div class="form-group">
                            <label class="form-label">Amount (₹)</label>
                            <input type="number" id="remit-amount" class="form-input" required step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Remittance Date</label>
                            <input type="date" id="remit-date" class="form-input" required>
                        </div>
                         <div class="form-group">
                            <label class="form-label">Reference / Notes</label>
                            <input type="text" id="remit-notes" class="form-input" placeholder="Bank Ref / Challan No">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn-primary" style="width: 100%;">Record Remittance</button>
                        </div>
                    </form>
                </div>

                <div class="glass-panel" style="margin-top: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem;">
                    <h4 style="margin-bottom: 1rem; color: #475569;">Filter History</h4>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <select id="filter-year" class="form-select" style="width: auto;">
                            <!-- Populated via JS -->
                        </select>
                        <select id="filter-month" class="form-select" style="width: auto;">
                            <option value="">All Months</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                        <button id="btn-apply-filter" class="btn-primary" style="padding: 6px 16px;">Filter Records</button>
                    </div>
                </div>

                <!-- Monthly Summary -->
                <div class="glass-panel" style="margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem; color: #475569;">GST Collection - Month Wise Summary</h4>
                    <div style="overflow-x:auto;">
                        <table class="data-table" id="gst-monthly-summary" style="min-width: 640px;">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>GST Collected</th>
                                    <th>Remitted</th>
                                    <th>Pending</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="gst-monthly-body"></tbody>
                        </table>
                    </div>
                </div>

                <div class="table-container" style="margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem;">Remittance History</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date Remitted</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Recorded At</th>
                            </tr>
                        </thead>
                        <tbody id="remittance-list-body">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.updateStats();
        this.renderHistory();
        this.setupForm();
    },

    // Returns totals optionally filtered by month (1-12) and year (YYYY)
    getStats(month = '', year = '') {
        const payments = Store.getPayments();
        const remittances = Store.getRemittances();



        // Helper to extract year/month from various payment date formats
        // Prefer the actual payment date (`paymentDate`) to assign GST to the month it was paid.
        const getPaymentYearMonth = (p) => {
            // If paymentDate exists, try common formats first (date paid is authoritative)
            if (p.paymentDate && typeof p.paymentDate === 'string') {
                const s = p.paymentDate.trim();
                // ISO YYYY-MM-DD or YYYY/MM/DD
                let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/]?(\d{1,2})?/);
                if (m) return { y: parseInt(m[1]), m: parseInt(m[2]) };

                // DD-MM-YYYY or DD/MM/YYYY
                m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
                if (m) return { y: parseInt(m[3]), m: parseInt(m[2]) };

                // Try timestamp
                const d = new Date(s);
                if (!isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() + 1 };
            }

            // If paymentForMonth in YYYY-MM format, use as fallback
            if (p.paymentForMonth && typeof p.paymentForMonth === 'string') {
                const parts = p.paymentForMonth.split('-').map(s => s.trim());
                if (parts.length >= 2) return { y: parseInt(parts[0]), m: parseInt(parts[1]) };
            }

            // As last resort, return null
            return null;
        };

        // Helper to check if a payment matches the requested month/year.
        // If a `year` is provided we treat it as the financial year starting April 1 of `year` and
        // ending March 31 of `year+1`. If `month` is provided, only payments in that calendar month
        // within the financial year are matched.
        const matchesPayment = (p) => {
            // If no filters, match everything
            if (!month && !year) return true;

            // Determine payment date (prefer paymentDate, fallback to paymentForMonth as first-of-month)
            let paidDate = null;
            if (p.paymentDate) {
                const d = new Date(p.paymentDate);
                if (!isNaN(d.getTime())) paidDate = d;
            }
            if (!paidDate && p.paymentForMonth) {
                const parts = String(p.paymentForMonth).split('-').map(s => parseInt(s));
                if (parts.length >= 2) paidDate = new Date(parts[0], parts[1] - 1, 1);
            }
            if (!paidDate) return false;

            // If financial year filter provided, compute start/end dates
            if (year) {
                const startYear = parseInt(year);
                const fyStart = new Date(startYear, 3, 1, 0, 0, 0); // Apr 1
                const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59); // Mar 31 of next year
                if (paidDate < fyStart || paidDate > fyEnd) return false;

                if (month) {
                    // month is 1..12; check calendar month within the paidDate
                    if (paidDate.getMonth() + 1 !== parseInt(month)) return false;
                }

                return true;
            }

            // If only calendar year/month filtering (legacy), use extracted year/month
            const ym = getPaymentYearMonth(p);
            if (!ym) return false;
            if (year && ym.y !== parseInt(year)) return false;
            if (month && ym.m !== parseInt(month)) return false;
            return true;
        };

        // Helper to check remittance match by remittance.date
        // Remittance matching using financial year when `year` provided
        const matchesRemit = (r) => {
            if (!month && !year) return true;
            const d = new Date(r.date);
            if (isNaN(d.getTime())) return false;

            if (year) {
                const startYear = parseInt(year);
                const fyStart = new Date(startYear, 3, 1, 0, 0, 0);
                const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
                if (d < fyStart || d > fyEnd) return false;
                if (month && (d.getMonth() + 1) !== parseInt(month)) return false;
                return true;
            }

            if (year && d.getFullYear() !== parseInt(year)) return false;
            if (month && (d.getMonth() + 1) !== parseInt(month)) return false;
            return true;
        };

        let matchedPaymentsCount = 0;
        const totalCollected = payments.reduce((sum, p) => {
            if (matchesPayment(p)) {
                matchedPaymentsCount++;
                return sum + Utils.getPaymentGST(p);
            }
            return sum;
        }, 0);

        let matchedRemittancesCount = 0;
        const totalRemitted = remittances.reduce((sum, r) => {
            if (matchesRemit(r)) {
                matchedRemittancesCount++;
                return sum + Utils.parseNumber(r.amount);
            }
            return sum;
        }, 0);

        // Debug: if remitted exceeds collected for the period, log details
        if (totalRemitted > totalCollected) {
            console.warn(`GST Remittance: remitted (₹${totalRemitted.toFixed(2)}) > collected (₹${totalCollected.toFixed(2)}) for filter month=${month} year=${year}`);
        }

        const pending = totalCollected - totalRemitted;

        return { totalCollected, totalRemitted, pending, matchedPaymentsCount, matchedRemittancesCount };
    },

    // Update the top-level GST stats; accepts optional month/year to scope results
    updateStats(month = '', year = '') {
        const stats = this.getStats(month, year);
        document.getElementById('gst-collected').textContent = `₹${stats.totalCollected.toFixed(2)}`;
        document.getElementById('gst-remitted').textContent = `₹${stats.totalRemitted.toFixed(2)}`;
        document.getElementById('gst-pending').textContent = `₹${stats.pending.toFixed(2)}`;

        // Auto-fill pending amount if field is empty or 0
        const input = document.getElementById('remit-amount');
        if (input && (!input.value || parseFloat(input.value) === 0)) {
            input.value = Math.max(0, stats.pending).toFixed(2);
        }

        // Default date to today
        const dateInput = document.getElementById('remit-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Update filter label and show warning if remitted > collected
        try {
            const labelEl = document.getElementById('gst-filter-label');
            const warnEl = document.getElementById('gst-warning');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let labelText = 'Current filter: ';
            if (month && year) {
                const mIdx = parseInt(month) - 1;
                // year is FY start year; display FY and month
                labelText += `${monthNames[mIdx] || month} — FY ${year}-${String(parseInt(year) + 1).slice(2)}`;
            } else if (year) {
                labelText += `FY ${year}-${String(parseInt(year) + 1).slice(2)}`;
            } else if (month) {
                const mIdx = parseInt(month) - 1;
                labelText += `${monthNames[mIdx] || month} (All Years)`;
            } else {
                labelText += 'All Months, All Years';
            }
            if (labelEl) labelEl.textContent = labelText;

            // Append matched counts for visibility
            try {
                const countsPart = ` — payments: ${stats.matchedPaymentsCount || 0}, remittances: ${stats.matchedRemittancesCount || 0}`;
                if (labelEl) labelEl.textContent += countsPart;
            } catch (e) {
                /* ignore */
            }

            if (warnEl) {
                if (stats.totalRemitted > stats.totalCollected) {
                    const diff = (stats.totalRemitted - stats.totalCollected).toFixed(2);
                    warnEl.style.display = 'inline';
                    warnEl.style.display = 'inline';
                    warnEl.textContent = `Warning: Remitted exceeds collected by ₹${diff} for the selected period.`;
                } else if (stats.totalCollected > stats.totalRemitted) {
                    const diff = (stats.totalCollected - stats.totalRemitted).toFixed(2);
                    warnEl.style.display = 'inline';
                    warnEl.style.color = '#e11d48'; // Red for shortfall
                    warnEl.textContent = `Shortfall: You need to remit ₹${diff} more.`;
                } else {
                    warnEl.style.display = 'none';
                }
            }
        } catch (e) {
            console.warn('Failed to update GST filter label or warning', e);
        }
    },

    renderHistory(month = '', year = '') {
        let remittances = Store.getRemittances();
        const tbody = document.getElementById('remittance-list-body');

        // Sort desc
        remittances.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Helper: check if a date falls within the financial year (Apr startYear to Mar startYear+1)
        const inFinancialYear = (d, startYear) => {
            const fyStart = new Date(startYear, 3, 1, 0, 0, 0); // Apr 1
            const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59); // Mar 31
            return d >= fyStart && d <= fyEnd;
        };

        // Filter Logic using financial year when year is provided
        if (year) {
            remittances = remittances.filter(r => {
                const d = new Date(r.date);
                return inFinancialYear(d, parseInt(year));
            });
        }
        if (month) {
            remittances = remittances.filter(r => (new Date(r.date).getMonth() + 1) === parseInt(month));
        }

        if (remittances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 2rem;">No matching records found for selected period.</td></tr>';
            return;
        }

        tbody.innerHTML = remittances.map(r => `
            <tr>
                <td>${r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-'}</td>
                <td>${r.notes || r.reference_no || '-'}</td>
                <td style="font-weight: bold; color: #10b981;">₹${parseFloat(r.amount).toFixed(2)}</td>
                <td style="font-size: 0.8rem; color: #64748b;">${(r.created_at || r.timestamp) ? new Date(r.created_at || r.timestamp).toLocaleString('en-IN') : '-'}</td>
            </tr>
        `).join('');
    },

    // Aggregate payments and remittances by month for a given year ('' => all years)
    aggregateByMonth(year = '') {
        const payments = Store.getPayments();
        const remittances = Store.getRemittances();





        // Initialize months map 1..12
        const months = {};
        for (let i = 1; i <= 12; i++) months[i] = { collected: 0, remitted: 0 };

        const getPaymentYM = (p) => {
            // Prefer paymentDate (actual date paid) for month grouping
            if (p.paymentDate) {
                const d = new Date(p.paymentDate);
                if (!isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() + 1 };
            }
            if (p.paymentForMonth) {
                const parts = String(p.paymentForMonth).split('-').map(s => parseInt(s));
                if (parts.length >= 2) return { y: parts[0], m: parts[1] };
            }
            return null;
        };

        // Helper: check if a date falls within the financial year (Apr startYear to Mar startYear+1)
        const inFinancialYear = (d, startYear) => {
            const fyStart = new Date(startYear, 3, 1, 0, 0, 0); // Apr 1
            const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59); // Mar 31
            return d >= fyStart && d <= fyEnd;
        };

        // Helper: get payment date as Date object (prefer paymentDate)
        const getPaymentDate = (p) => {
            if (p.paymentDate) {
                const d = new Date(p.paymentDate);
                if (!isNaN(d.getTime())) return d;
            }
            if (p.paymentForMonth) {
                const parts = String(p.paymentForMonth).split('-').map(s => parseInt(s));
                if (parts.length >= 2) return new Date(parts[0], parts[1] - 1, 1);
            }
            return null;
        };

        payments.forEach(p => {
            const paidDate = getPaymentDate(p);
            if (!paidDate) return;

            // If year provided, filter to that financial year
            if (year) {
                if (!inFinancialYear(paidDate, parseInt(year))) return;
            }

            const m = paidDate.getMonth() + 1;
            months[m].collected += Utils.getPaymentGST(p);
        });

        remittances.forEach(r => {
            if (!r.date) return;
            const d = new Date(r.date);
            if (isNaN(d.getTime())) return;

            // If year provided, filter to that financial year
            if (year) {
                if (!inFinancialYear(d, parseInt(year))) return;
            }

            const m = d.getMonth() + 1;
            months[m].remitted += Utils.parseNumber(r.amount || 0);
        });

        return months;
    },

    renderMonthlySummary(year = '') {

        const tbody = document.getElementById('gst-monthly-body');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // If no financial year selected, show a hint and keep the table blank
        if (!year) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">Select a financial year to view month-wise summary.</td></tr>';
            return;
        }

        const months = this.aggregateByMonth(year);
        // Render months in financial-year order: Apr..Dec, Jan..Mar
        // Only show months that have at least one transaction
        const order = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
        const rows = order.map(m => {
            const data = months[m] || { collected: 0, remitted: 0 };
            // Skip months with no transactions
            if (data.collected === 0 && data.remitted === 0) return '';
            const pending = data.collected - data.remitted;

            // Status Logic
            let statusBadge = '';
            const diff = data.collected - data.remitted;
            const tolerance = 1.0; // ₹1 differrence allowed for rounding

            if (Math.abs(diff) <= tolerance) {
                statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #d1fae5; color: #059669; font-size: 0.75rem; font-weight: bold;">Matched</span>`;
            } else if (diff > tolerance) {
                statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #fee2e2; color: #ef4444; font-size: 0.75rem; font-weight: bold;">Shortfall</span>`;
            } else {
                statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #ffedd5; color: #c2410c; font-size: 0.75rem; font-weight: bold;">Excess</span>`;
            }

            return `
                <tr data-month="${m}" style="cursor: pointer;">
                    <td><strong>${monthNames[m - 1]}</strong></td>
                    <td>₹${data.collected.toFixed(2)}</td>
                    <td>₹${data.remitted.toFixed(2)}</td>
                    <td style="color: ${pending < 0 ? '#ef4444' : '#059669'};">₹${pending.toFixed(2)}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).filter(r => r !== '');

        // If no months have transactions, show a message
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No transactions in this financial year.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.join('');

        // Attach click handlers: clicking a month will filter stats/history to that month
        tbody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const m = tr.dataset.month;
                const y = document.getElementById('filter-year').value;
                // set the month selector
                document.getElementById('filter-month').value = m;
                this.updateStats(m, y);
                this.renderHistory(m, y);
                // Render month-specific summary: only show this month if it has transactions
                this.renderMonthDetail(m, y);
            });
        });
    },

    // Render detail view for a specific month within a financial year
    // Show only that month if it has transactions; otherwise show "No transactions"
    renderMonthDetail(month, year) {
        const tbody = document.getElementById('gst-monthly-body');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (!month || !year) {
            // If no specific month, show all months for the year
            this.renderMonthlySummary(year);
            return;
        }

        const months = this.aggregateByMonth(year);
        const data = months[parseInt(month)] || { collected: 0, remitted: 0 };

        if (data.collected === 0 && data.remitted === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No transactions in ' + monthNames[parseInt(month) - 1] + ' for this financial year.</td></tr>';
            return;
        }

        const pending = data.collected - data.remitted;
        const mIdx = parseInt(month) - 1;

        // Status Logic (Detail View)
        let statusBadge = '';
        const diff = data.collected - data.remitted;
        const tolerance = 1.0;

        if (Math.abs(diff) <= tolerance) {
            statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #d1fae5; color: #059669; font-size: 0.75rem; font-weight: bold;">Matched</span>`;
        } else if (diff > tolerance) {
            statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #fee2e2; color: #ef4444; font-size: 0.75rem; font-weight: bold;">Shortfall</span>`;
        } else {
            statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; background: #ffedd5; color: #c2410c; font-size: 0.75rem; font-weight: bold;">Excess</span>`;
        }

        // Auto-fill form date when a specific month is selected
        const dateInput = document.getElementById('remit-date');
        if (dateInput) {
            // Set to 10th of next month (or 10th of selected month? usually remittance is done next month 10th)
            // But simplify: Set to today if today is within reasonable range, OR set to end of that month.
            // Let's set it to Last Date of the selected month as a default, or today.
            // Better: If year/month selected, construct a date.
            const selectedY = parseInt(year); // This is FY start.
            // If month is 1,2,3 -> It is (year+1). If 4..12 -> It is (year)
            const actualYear = parseInt(month) <= 3 ? selectedY + 1 : selectedY;

            // Set date to 20th of that month (GST due date usually)
            const suggestedDate = new Date(actualYear, parseInt(month) - 1, 20);

            // Format YYYY-MM-DD
            const yyyy = suggestedDate.getFullYear();
            const mm = String(suggestedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(suggestedDate.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        tbody.innerHTML = `
            <tr>
                <td><strong>${monthNames[mIdx]}</strong></td>
                <td>₹${data.collected.toFixed(2)}</td>
                <td>₹${data.remitted.toFixed(2)}</td>
                <td style="color: ${pending < 0 ? '#ef4444' : '#059669'};">₹${pending.toFixed(2)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    },

    setupForm() {
        const form = document.getElementById('remittance-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById('remit-amount').value);
            const date = document.getElementById('remit-date').value;
            const notes = document.getElementById('remit-notes').value;

            if (amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }

            // Extract month and year from the date for database sync
            const dateObj = new Date(date);
            const month = dateObj.getMonth() + 1; // 1-12
            const year = dateObj.getFullYear();

            const record = {
                amount: amount,
                date: date,
                month: month.toString(),
                year: year.toString(),
                referenceNo: notes, // Map notes to referenceNo for DB compatibility
                notes: notes,
                bankName: '', // Optional field, can be added to form later
                timestamp: new Date().toISOString()
            };

            Store.saveRemittance(record);
            alert('Remittance recorded successfully!');

            form.reset();
            // Refresh stats and current filter view
            const filterMonth = document.getElementById('filter-month').value;
            const filterYear = document.getElementById('filter-year').value;
            this.updateStats(filterMonth, filterYear);
            this.renderHistory(filterMonth, filterYear);
            // If a specific month is selected, render its detail; otherwise show all months for the year
            if (filterMonth && filterYear) {
                this.renderMonthDetail(filterMonth, filterYear);
            } else if (filterYear) {
                this.renderMonthlySummary(filterYear);
            } else {
                this.renderMonthlySummary('');
            }
        });

        // Populate Years (include 'All Years' default)
        const yearSelect = document.getElementById('filter-year');
        // Add an explicit 'All Years' option so an empty month doesn't get filtered by a preselected year
        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = 'All Years';
        allOpt.selected = true; // default to no-year filter
        yearSelect.appendChild(allOpt);

        // Dynamically extract years from payments and remittances
        const yearSet = new Set();
        const currentYear = new Date().getFullYear();

        // Add current year and next 2 years for planning
        yearSet.add(currentYear);
        yearSet.add(currentYear + 1);
        yearSet.add(currentYear + 2);

        // Extract years from payments (based on paymentDate)
        const payments = Store.getPayments();
        payments.forEach(p => {
            if (p.paymentDate) {
                const year = new Date(p.paymentDate).getFullYear();
                if (year) yearSet.add(year);
            }
        });

        // Extract years from remittances (based on date field)
        const remittances = Store.getRemittances();
        remittances.forEach(r => {
            if (r.date) {
                const year = new Date(r.date).getFullYear();
                if (year) yearSet.add(year);
            }
            // Also check if year is stored as a field
            if (r.year) {
                yearSet.add(parseInt(r.year));
            }
        });

        // Convert to sorted array (descending)
        const years = Array.from(yearSet).sort((a, b) => b - a);

        // Populate dropdown with financial year format
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y; // financial year starting year
            // show as 'YYYY-YY' to indicate financial year (e.g., 2024-25)
            const short = String(y + 1).slice(2);
            opt.textContent = `${y}-${short}`;
            yearSelect.appendChild(opt);
        });

        // Initialize stats with no filters (show totals across all data)
        this.updateStats('', '');
        // Default: do NOT render monthly summary until user selects a financial year
        this.renderMonthlySummary('');

        // Apply Filter Event
        document.getElementById('btn-apply-filter').addEventListener('click', () => {
            const m = document.getElementById('filter-month').value;
            const y = document.getElementById('filter-year').value;
            this.updateStats(m, y);
            this.renderHistory(m, y);
            // If a specific month is selected, render its detail; otherwise show all months for the year
            if (m && y) {
                this.renderMonthDetail(m, y);
            } else if (y) {
                this.renderMonthlySummary(y);
            } else {
                this.renderMonthlySummary('');
            }
        });
    }
};

// ==========================================
// LEASE AGREEMENT STATUS MODULE
// ==========================================
const LeaseStatusModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3>Lease Agreement Status</h3>
                    <div style="display: flex; gap: 0.5rem; background: #e0e7ff; padding: 4px; border-radius: 8px;">
                        <button class="nav-btn-sub active" id="btn-tab-active" style="padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; background: white; color: var(--primary-color); font-weight: 500;">Active Agreements</button>
                        <button class="nav-btn-sub" id="btn-tab-history" style="padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #64748b; font-weight: 500;">History (Terminated)</button>
                    </div>
                </div>

                <!-- Active View -->
                <div id="view-active">
                     <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop No</th>
                                    <th>Applicant Name</th>
                                    <th>Lease End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="lease-active-list"></tbody>
                        </table>
                    </div>
                </div>

                <!-- History View -->
                <div id="view-history" style="display: none;">
                     <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop No</th>
                                    <th>Applicant Name</th>
                                    <th>Terminated Date</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody id="lease-history-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- RENEWAL MODAL -->
            <div id="renewal-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
                <div class="glass-panel" style="background: white; width: 500px; max-width: 90%;">
                    <h3 style="margin-bottom: 1rem;">Renew Lease Agreement</h3>
                    <form id="renewal-form">
                        <input type="hidden" name="shopNo" id="renew-shop-no">
                        
                        <div class="form-group">
                            <label class="form-label">New Lease Start Date</label>
                            <input type="date" name="leaseDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Lease End Date</label>
                            <input type="date" name="expiryDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Agreement Date</label>
                            <input type="date" name="agreementDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                             <label class="form-label">Rent Applicable From</label>
                            <input type="date" name="rentStartDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                             <label class="form-label">Monthly Payment Due Date</label>
                             <select name="paymentDay" class="form-select" required>
                                <option value="">Select Day (1-31)</option>
                                ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="chk-update-rent" style="margin-right: 8px;">
                                <span style="font-weight: 500;">Update Base Rent?</span>
                            </label>
                        </div>
                        
                        <div id="rent-update-container" style="display: none; background: #f1f5f9; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
                            <div class="form-group">
                                <label class="form-label">New Base Rent (₹)</label>
                                <input type="number" id="new-base-rent" class="form-input" placeholder="Enter new base rent amount">
                            </div>
                            <div id="prev-base-rent" style="display:none; margin-bottom:8px; font-size:0.9rem; color:#475569;">
                                <strong>Previous Base Rent:</strong> <span id="prev-base-rent-value" style="font-weight:700;">₹0.00</span>
                            </div>
                            <div style="margin-top: 8px; font-size: 0.9rem; color: #475569;">
                                <strong>Calculated Total:</strong> <span id="calc-total-display" style="color: #059669;">Enter new base rent...</span>
                            </div>
                        </div>

                        <!-- AGREEMENT UPLOAD (RENEWAL) -->
                        <div class="form-group" style="margin-top: 1rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
                            <label class="form-label">Upload New Agreement (Optional)</label>
                            <input type="file" id="renew-agreement-upload" class="form-input" accept=".pdf,image/*">
                            <small style="color: var(--text-muted);">Max 5MB.</small>
                        </div>

                        <div style="margin-top: 1.5rem; text-align: right;">
                             <button type="button" class="btn-primary" style="background: #94a3b8; margin-right: 0.5rem;" id="btn-close-renew">Cancel</button>
                             <button type="submit" class="btn-primary">Save Renewal</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        this.renderActiveList();
    },

    bindEvents() {
        const btnActive = document.getElementById('btn-tab-active');
        const btnHistory = document.getElementById('btn-tab-history');
        const viewActive = document.getElementById('view-active');
        const viewHistory = document.getElementById('view-history');

        btnActive.addEventListener('click', () => {
            btnActive.classList.add('active'); // Add your CSS active class logic if needed, here just manual style swap
            btnActive.style.background = 'white'; btnActive.style.color = 'var(--primary-color)';
            btnHistory.style.background = 'transparent'; btnHistory.style.color = '#64748b';

            viewActive.style.display = 'block';
            viewHistory.style.display = 'none';
            this.renderActiveList();
        });

        btnHistory.addEventListener('click', () => {
            btnHistory.style.background = 'white'; btnHistory.style.color = 'var(--primary-color)';
            btnActive.style.background = 'transparent'; btnActive.style.color = '#64748b';

            viewActive.style.display = 'none';
            viewHistory.style.display = 'block';
            this.renderHistoryList();
        });

        // Close Modal
        document.getElementById('btn-close-renew').addEventListener('click', () => {
            document.getElementById('renewal-modal').style.display = 'none';
        });

        // Toggle Rent update fields
        const chkRent = document.getElementById('chk-update-rent');
        const rentContainer = document.getElementById('rent-update-container');
        const inputBase = document.getElementById('new-base-rent');
        const displayTotal = document.getElementById('calc-total-display');
        const prevBaseContainer = document.getElementById('prev-base-rent');
        const prevBaseValue = document.getElementById('prev-base-rent-value');

        chkRent.addEventListener('change', (e) => {
            const show = e.target.checked;
            rentContainer.style.display = show ? 'block' : 'none';
            // Show previous base rent when showing rent update UI
            prevBaseContainer.style.display = show ? 'block' : 'none';
            if (show) {
                inputBase.focus();
            }
        });

        // Calculate Rent on input
        inputBase.addEventListener('input', (e) => {
            const base = parseFloat(e.target.value) || 0;
            const gst = base * 0.18;
            const total = base + gst;
            displayTotal.textContent = `₹${base.toFixed(2)} + ₹${gst.toFixed(2)} (GST) = ₹${total.toFixed(2)}`;
        });

        // Form Submit
        document.getElementById('renewal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRenewal(new FormData(e.target));
        });
    },

    renderActiveList() {
        const applicants = Store.getApplicants();
        const tbody = document.getElementById('lease-active-list');

        if (applicants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No active leases.</td></tr>';
            return;
        }

        tbody.innerHTML = applicants.map(app => `
            <tr>
                <td><strong>${app.shopNo}</strong></td>
                <td>${app.applicantName}</td>
                <td>${app.expiryDate}</td>
                <td><span style="padding: 2px 8px; background: #d1fae5; color: #059669; border-radius: 4px; font-size: 0.8rem;">Active</span></td>
                <td>
                    <button class="btn-renew btn-primary" data-shop="${app.shopNo}" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 5px;">Renew</button>
                    <button class="btn-terminate btn-primary" data-shop="${app.shopNo}" style="padding: 4px 8px; font-size: 0.8rem; background: #e11d48;">Terminate</button>
                </td>
            </tr>
        `).join('');

        // Attach Button Events
        tbody.querySelectorAll('.btn-renew').forEach(btn => {
            btn.addEventListener('click', () => this.openRenewalModal(btn.dataset.shop));
        });

        tbody.querySelectorAll('.btn-terminate').forEach(btn => {
            btn.addEventListener('click', () => this.promptTermination(btn.dataset.shop));
        });
    },

    renderHistoryList() {
        const history = Store.getHistory();
        const tbody = document.getElementById('lease-history-list');

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No termination history found.</td></tr>';
            return;
        }

        // Sort by terminated date desc
        history.sort((a, b) => new Date(b.terminatedAt) - new Date(a.terminatedAt));

        tbody.innerHTML = history.map(h => `
             <tr>
                <td><strong>${h.shopNo}</strong></td>
                <td>${h.applicantName}</td>
                <td>${h.terminationDate}</td>
                <td>${h.terminationReason || '-'}</td>
            </tr>
        `).join('');
    },

    openRenewalModal(shopNo) {
        const app = Store.getApplicants().find(a => a.shopNo === shopNo);
        if (!app) return;

        const modal = document.getElementById('renewal-modal');
        const form = document.getElementById('renewal-form');

        // Pre-fill
        form.querySelector('#renew-shop-no').value = shopNo;
        form.querySelector('[name="leaseDate"]').value = app.leaseDate;
        form.querySelector('[name="expiryDate"]').value = app.expiryDate;
        form.querySelector('[name="agreementDate"]').value = app.agreementDate;
        form.querySelector('[name="rentStartDate"]').value = app.rentStartDate || app.leaseDate;
        form.querySelector('[name="paymentDay"]').value = app.paymentDay;

        // Reset Rent Update UI
        document.getElementById('chk-update-rent').checked = false;
        document.getElementById('rent-update-container').style.display = 'none';
        document.getElementById('new-base-rent').value = app.rentBase || '';
        document.getElementById('calc-total-display').textContent = 'Enter new base rent...';
        // Set previous base rent text for UI (hidden until checkbox checked)
        const prevValueEl = document.getElementById('prev-base-rent-value');
        const prevContainer = document.getElementById('prev-base-rent');
        if (prevValueEl) prevValueEl.textContent = `₹${(parseFloat(app.rentBase) || 0).toFixed(2)}`;
        if (prevContainer) prevContainer.style.display = 'none';

        modal.style.display = 'flex';
    },

    promptTermination(shopNo) {
        const reason = prompt('Are you sure you want to TERMINATE the agreement for Shop ' + shopNo + '?\n\nEnter Reason for Termination:');
        if (reason !== null) { // If not cancelled
            const date = new Date().toISOString().split('T')[0];
            Store.terminateApplicant(shopNo, { date, reason: reason || 'Not Specified' });
            alert('Agreement Terminated. Moved to History.');
            this.renderActiveList();
        }
    },

    handleRenewal(formData) {
        const data = Object.fromEntries(formData.entries());
        const shopNo = data.shopNo;

        // Wrap in async immediately invoked function or promise chain to handle async upload
        const processRenewal = async () => {
            try {
                const applicants = Store.getApplicants();
                const index = applicants.findIndex(a => a.shopNo === shopNo);

                if (index === -1) throw new Error('Applicant not found');

                // Snapshot previous values BEFORE modifying applicant record
                const prev = {
                    leaseDate: applicants[index].leaseDate,
                    expiryDate: applicants[index].expiryDate,
                    agreementDate: applicants[index].agreementDate,
                    rentStartDate: applicants[index].rentStartDate,
                    paymentDay: applicants[index].paymentDay,
                    rentBase: applicants[index].rentBase,
                    gstAmount: applicants[index].gstAmount,
                    rentTotal: applicants[index].rentTotal,
                    occupancyStartDate: applicants[index].occupancyStartDate
                };

                // Preserve original occupancy date if not already set (Fix for Rent Collection history)
                if (!applicants[index].occupancyStartDate) {
                    applicants[index].occupancyStartDate = applicants[index].rentStartDate || applicants[index].leaseDate;
                }

                // Update dates (apply new values)
                applicants[index].leaseDate = data.leaseDate;
                applicants[index].expiryDate = data.expiryDate;
                applicants[index].agreementDate = data.agreementDate;
                applicants[index].rentStartDate = data.rentStartDate;
                applicants[index].paymentDay = data.paymentDay;

                // FILE UPLOAD LOGIC
                const fileInput = document.getElementById('renew-agreement-upload');
                if (fileInput && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const shopClean = shopNo.replace(/[^a-zA-Z0-9]/g, '');
                    const filePath = `renewals/${shopClean}_${Date.now()}.${fileExt}`;

                    // Upload and set URL
                    applicants[index].agreementUrl = await Store.uploadFile(file, filePath);
                }

                // Archive Current Lease as a "History Block" so previous period dues are preserved
                if (!applicants[index].leaseHistory) {
                    applicants[index].leaseHistory = [];
                }
                // Create Block for the expiring lease using PREVIOUS snapshot
                const historyBlock = {
                    periodLabel: `Lease ${prev.leaseDate || 'N/A'} to ${prev.expiryDate || 'N/A'}`,
                    startDate: prev.rentStartDate || prev.occupancyStartDate || prev.leaseDate,
                    endDate: data.rentStartDate || data.leaseDate || prev.expiryDate,

                    // Snapshot of Financials (previous values)
                    rentBase: prev.rentBase,
                    gstAmount: prev.gstAmount,
                    rentTotal: prev.rentTotal,

                    // Snapshot of Dates (Reference)
                    leaseDate: prev.leaseDate,
                    expiryDate: prev.expiryDate,
                    agreementDate: prev.agreementDate,

                    archivedAt: new Date().toISOString()
                };

                // Avoid duplicate archive blocks with same start+end
                const exists = applicants[index].leaseHistory.some(h => h.startDate === historyBlock.startDate && h.endDate === historyBlock.endDate);
                if (!exists) applicants[index].leaseHistory.push(historyBlock);

                // Handle Rent Update (apply new values if requested)
                const updateRent = document.getElementById('chk-update-rent').checked;
                if (updateRent) {
                    const newBase = parseFloat(document.getElementById('new-base-rent').value);
                    if (isNaN(newBase) || newBase <= 0) {
                        throw new Error('Please enter a valid Base Rent amount');
                    }
                    const newGst = parseFloat((newBase * 0.18).toFixed(2));
                    const newTotal = parseFloat((newBase + newGst).toFixed(2));

                    applicants[index].rentBase = newBase;
                    applicants[index].gstAmount = newGst;
                    applicants[index].rentTotal = newTotal;
                }

                // SAVE using Store.saveApplicant to ensure Cloud Sync
                await Store.saveApplicant(applicants[index]);

                alert('Lease Renewed & Synced Successfully!');
                document.getElementById('renewal-modal').style.display = 'none';
                this.renderActiveList();

            } catch (e) {
                console.error(e);
                alert('Error updating lease: ' + e.message);
            }
        };

        processRenewal();
    }
};

// ==========================================
// REPORT MODULE (DCB)
// ==========================================
const ReportModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <h3>Reports</h3>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button class="nav-btn-sub active" onclick="ReportModule.renderDCB()" style="background: #e0e7ff; color: var(--primary-color); border:none; padding: 8px 16px; border-radius: 6px; font-weight: 500;">DCB Report</button>
                    <button class="nav-btn-sub" onclick="ReportModule.renderStatement()" style="background: transparent; color: var(--text-color); border:none; padding: 8px 16px;">Shop Ledger</button>
                </div>

                <div id="report-content" style="margin-top: 1.5rem;">
                    <!-- DCB View Default -->
                </div>
            </div>
        `;
        this.renderDCB();
    },

    renderDCB(container) {
        // Fix: Target the inner content area so we don't wipe out the tabs
        const targetContainer = document.getElementById('report-content');
        if (!targetContainer) {
            // Ideally should not happen if render() called first.
            // If somehow called directly, fallback to container or content-area but this loses tabs
            console.error("Report content area not found!");
            return;
        }

        // Update active tab styling
        const tabs = document.querySelectorAll('.nav-btn-sub');
        tabs.forEach(t => {
            if (t.textContent.includes('DCB')) {
                t.style.background = '#e0e7ff'; t.style.color = 'var(--primary-color)'; t.classList.add('active');
            } else {
                t.style.background = 'transparent'; t.style.color = 'var(--text-color)'; t.classList.remove('active');
            }
        });

        targetContainer.innerHTML = `
            <div class="glass-panel">
                <h4 style="margin-bottom: 1rem;"> Statement Showing the Demand, Collection, Balance (DCB) Report of SUDA Commercial Shops </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: end;">
                    <div class="form-group">
                        <label class="form-label">Shop No</label>
                        <select id="rep-dcb-shop" class="form-select">
                            <option value="ALL">All Shops</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Financial Year</label>
                        <select id="rep-dcb-fy" class="form-select">
                        </select>
                    </div>
                    <div class="form-group" style="display: flex; align-items: flex-end;">
                        <button class="btn-primary" id="btn-gen-dcb" style="width: 100%;">Generate Report</button>
                    </div>
                </div>

                <div id="dcb-results" style="margin-top: 2rem; display: none;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;">
                        <button class="btn-primary" id="btn-dcb-print" style="background: #64748b; font-size: 0.8rem;">Print</button>
                        <button class="btn-primary" id="btn-dcb-export" style="background: #059669; font-size: 0.8rem;">Export to Excel</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table" id="dcb-table">
                            <thead>
                                <tr>
                                    <th>Sl No</th>
                                    <th>Shop No</th>
                                    <th>Shop Name</th>
                                    <th>Current Demand (Base)</th>
                                    <th>Current Demand (GST)</th>
                                    <th>Arrear Demand (Base)</th>
                                    <th>Arrear Demand (GST)</th>
                                    <th>Arrear Demand (Penalty)</th>
                                    <th>Total Demand</th>
                                    <th>Current Collection</th>
                                    <th>Current Collection (Penalty)</th>
                                    <th>Arrear Collection</th>
                                    <th>Total Collection</th>
                                    <th>Current Balance</th>
                                    <th>Arrear Balance</th>
                                    <th>Total Balance</th>
                                    <th>% Collection</th>
                                </tr>
                            </thead>
                            <tbody id="dcb-list-body"></tbody>
                            <tfoot id="dcb-foot" style="font-weight: bold; background: #f1f5f9;"></tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.populateShops();
        this.populateFinancialYears();
        // Bind Generation
        document.getElementById('btn-gen-dcb').addEventListener('click', () => this.generateDCB());
        document.getElementById('btn-dcb-print').addEventListener('click', () => this.printDCB());
        document.getElementById('btn-dcb-export').addEventListener('click', () => this.exportDCB());
    },

    populateShops() {
        const select = document.getElementById('rep-dcb-shop');
        const shops = Store.getShops();
        shops.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.shopNo;
            // Fallback shop display: prefer shopName, else applicant name, else proprietor name
            const applicants = Store.getApplicants();
            const applicant = applicants.find(a => a.shopNo === s.shopNo);
            const displayName = s.shopName || (applicant && (applicant.applicantName || applicant.proprietorShopName)) || '-';
            opt.textContent = `${s.shopNo} - ${displayName}`;
            select.appendChild(opt);
        });
    },

    populateFinancialYears() {
        const select = document.getElementById('rep-dcb-fy');
        const today = new Date();
        const m = today.getMonth();
        const thisFyStart = m >= 3 ? today.getFullYear() : today.getFullYear() - 1;

        // Generate last 5 years up to current FY (YYYY-YY)
        for (let i = 4; i >= 0; i--) {
            const y = thisFyStart - i;
            const shortNext = (y + 1).toString().slice(-2);
            const fy = `${y}-${shortNext}`;
            const opt = document.createElement('option');
            opt.value = fy;
            opt.textContent = fy;
            // Default select current FY
            if (y === thisFyStart) opt.selected = true;

            select.appendChild(opt);
        }
    },



    generateDCB() {
        const shopNo = document.getElementById('rep-dcb-shop').value;
        const fyVal = document.getElementById('rep-dcb-fy').value;

        if (!fyVal) {
            alert('Please select a Financial Year');
            return;
        }

        // Parse FY (e.g. "2024-25" or "2024-2025")
        // We take the first part as Start Year and calculate End Year arithmetically
        const parts = fyVal.split('-');
        const startYear = parseInt(parts[0]);
        const endYear = startYear + 1;

        // Define Report Period: Apr 1 of StartYear to Mar 31 of EndYear
        const fromDate = new Date(startYear, 3, 1); // Month 3 is April
        const toDate = new Date(endYear, 2, 31);   // Month 2 is March. 31st.

        const parseAsLocal = (dateStr) => {
            if (!dateStr) return null;
            // Handle YYYY-MM-DD explicitly to avoid UTC interpretation
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d); // Local Midnight
            }
            return new Date(dateStr); // Fallback
        };

        const applicants = Store.getApplicants();
        const payments = Store.getPayments();
        const settings = Store.getSettings();
        const penaltyRate = parseFloat(settings.penaltyRate) || 15;
        const implementationDate = parseAsLocal(settings.penaltyDate);

        let targets = applicants;
        if (shopNo !== 'ALL') {
            targets = applicants.filter(a => a.shopNo === shopNo);
        }

        // Calculation Dates (already Date objects)
        // No need to normalize further as we constructed them explicitly as Start and End of FY.

        // Totals per column
        let totalCurrentDemandBase = 0, totalCurrentDemandGst = 0;
        let totalArrearDemandBase = 0, totalArrearDemandGst = 0, totalArrearDemandPenalty = 0;
        let totalTotalDemand = 0;
        let totalCurrentCollection = 0, totalCurrentCollectionPenalty = 0, totalArrearCollection = 0, totalTotalCollection = 0;
        let totalCurrentBalance = 0, totalArrearBalance = 0, totalTotalBalance = 0;

        let html = '';
        let sl = 1;
        const rows = [];

        targets.forEach(app => {
            const result = this.calculateDCBForApplicant(app, fromDate, toDate, payments, penaltyRate, implementationDate);

            totalCurrentDemandBase += result.currentDemandBase;
            totalCurrentDemandGst += result.currentDemandGst;
            totalArrearDemandBase += result.arrearDemandBase;
            totalArrearDemandGst += result.arrearDemandGst;
            totalArrearDemandPenalty += result.arrearDemandPenalty;
            totalTotalDemand += result.totalDemand;

            totalCurrentCollection += result.currentCollection;
            totalCurrentCollectionPenalty += (result.currentCollectionPenalty || 0);
            totalArrearCollection += result.arrearCollection;
            totalTotalCollection += result.totalCollection;

            totalCurrentBalance += result.currentBalance;
            totalArrearBalance += result.arrearBalance;
            totalTotalBalance += result.totalBalance;

            const pct = result.totalDemand > 0 ? ((result.totalCollection / result.totalDemand) * 100).toFixed(2) : '0.00';

            // Fallback: Shop Name -> Applicant Name -> Proprietor Name -> Hyphen
            const displayName = app.shopName || app.applicantName || app.proprietorShopName || '-';

            html += `
                <tr>
                    <td>${sl++}</td>
                    <td>${app.shopNo}</td>
                    <td>${displayName}</td>
                    <td>₹${result.currentDemandBase.toFixed(2)}</td>
                    <td>₹${result.currentDemandGst.toFixed(2)}</td>
                    <td>₹${result.arrearDemandBase.toFixed(2)}</td>
                    <td>₹${result.arrearDemandGst.toFixed(2)}</td>
                    <td>₹${result.arrearDemandPenalty.toFixed(2)}</td>
                    <td>₹${result.totalDemand.toFixed(2)}</td>
                    <td>₹${(result.currentCollection - (result.currentCollectionPenalty || 0)).toFixed(2)}</td>
                    <td>₹${(result.currentCollectionPenalty || 0).toFixed(2)}</td>
                    <td>₹${result.arrearCollection.toFixed(2)}</td>
                    <td>₹${result.totalCollection.toFixed(2)}</td>
                    <td>₹${result.currentBalance.toFixed(2)}</td>
                    <td>₹${result.arrearBalance.toFixed(2)}</td>
                    <td style="color: ${result.totalBalance > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">₹${result.totalBalance.toFixed(2)}</td>
                    <td>${pct}%</td>
                </tr>
            `;

            rows.push({ shop: app.shopNo, shopName: displayName, result });
        });

        document.getElementById('dcb-list-body').innerHTML = html;
        document.getElementById('dcb-foot').innerHTML = `
            <tr>
                <td colspan="3" style="text-align: right;">TOTAL</td>
                <td>₹${totalCurrentDemandBase.toFixed(2)}</td>
                <td>₹${totalCurrentDemandGst.toFixed(2)}</td>
                <td>₹${totalArrearDemandBase.toFixed(2)}</td>
                <td>₹${totalArrearDemandGst.toFixed(2)}</td>
                <td>₹${totalArrearDemandPenalty.toFixed(2)}</td>
                <td>₹${totalTotalDemand.toFixed(2)}</td>
                <td>₹${(totalCurrentCollection - totalCurrentCollectionPenalty).toFixed(2)}</td>
                <td>₹${totalCurrentCollectionPenalty.toFixed(2)}</td>
                <td>₹${totalArrearCollection.toFixed(2)}</td>
                <td>₹${totalTotalCollection.toFixed(2)}</td>
                <td>₹${totalCurrentBalance.toFixed(2)}</td>
                <td>₹${totalArrearBalance.toFixed(2)}</td>
                <td>₹${totalTotalBalance.toFixed(2)}</td>
                <td>${(totalTotalDemand > 0 ? (totalTotalCollection / totalTotalDemand) * 100 : 0).toFixed(2)}%</td>
            </tr>
        `;

        // Save last generated data for export
        this.lastDcbResults = {
            rows, totals: {
                totalCurrentDemandBase, totalCurrentDemandGst, totalArrearDemandBase, totalArrearDemandGst, totalArrearDemandPenalty,
                totalTotalDemand, totalCurrentCollection, totalCurrentCollectionPenalty, totalArrearCollection, totalTotalCollection, totalCurrentBalance, totalArrearBalance, totalTotalBalance,
                totalPct: totalTotalDemand > 0 ? (totalTotalCollection / totalTotalDemand) * 100 : 0
            }, period: {
                fromDate: `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`,
                toDate: `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`,
                fy: document.getElementById('rep-dcb-fy').value
            }
        };

        document.getElementById('dcb-results').style.display = 'block';
    },

    // --- NEW: TENANT STATEMENT / LEDGER ---
    renderStatement(container) {
        // Fix: Target the inner content area
        const target = document.getElementById('report-content');
        if (!target) return;

        // Update active tab styling
        const tabs = document.querySelectorAll('.nav-btn-sub');
        tabs.forEach(t => {
            if (t.textContent.includes('Ledger')) {
                t.style.background = '#e0e7ff'; t.style.color = 'var(--primary-color)'; t.classList.add('active');
            } else {
                t.style.background = 'transparent'; t.style.color = 'var(--text-color)'; t.classList.remove('active');
            }
        });

        target.innerHTML = `
             <div class="glass-panel">
                <!-- Removed duplicate tab buttons here since they are in main render now -->

                <h4 style="margin-bottom: 1rem;">Shop-wise Outstanding Dues Statement</h4>
                <div style="display: flex; gap: 1rem; align-items: flex-end;">
                    <div class="form-group" style="flex: 1; max-width: 300px;">
                        <label class="form-label">Select Shop</label>
                        <select id="rep-stmt-shop" class="form-select">
                            <option value="">-- Select Shop --</option>
                        </select>
                    </div>
                </div>

                <div id="stmt-results" style="margin-top: 2rem; display: none;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;">
                        <button class="btn-primary" id="btn-stmt-print" style="background: #64748b; font-size: 0.8rem;">Print Statement</button>
                    </div>
                    <div class="glass-panel" style="background: #fff; color: #000; border: 1px solid #e2e8f0; padding: 2rem;" id="print-stmt-area">
                        <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #000;">
                             <h3 style="margin: 0; text-transform: uppercase;">Siddipet Urban Development Authority</h3>
                             <p style="margin: 5px 0;">Commercial Shop Lease - Outstanding Dues Statement</p>
                             <p style="margin: 5px 0; font-size: 0.9rem;" id="stmt-date">As on: </p>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                            <div>
                                <strong>Shop No:</strong> <span id="stmt-shop-no"></span><br>
                                <strong>Tenant:</strong> <span id="stmt-name"></span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Contact:</strong> <span id="stmt-contact"></span>
                            </div>
                        </div>

                        <div class="table-container">
                            <table class="data-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #000;">
                                        <th style="text-align: left; padding: 8px;">Sl No</th>
                                        <th style="text-align: left; padding: 8px;">Due Month</th>
                                        <th style="text-align: right; padding: 8px;">Rent + GST</th>
                                        <th style="text-align: right; padding: 8px;">Penalty (Today)</th>
                                        <th style="text-align: right; padding: 8px;">Total Due</th>
                                    </tr>
                                </thead>
                                <tbody id="stmt-list-body"></tbody>
                                <tfoot id="stmt-foot" style="border-top: 2px solid #000; font-weight: bold;"></tfoot>
                            </table>
                        </div>
                        
                        <div style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
                            * Penalty is calculated @ ₹16/day for delay.<br>
                            * This is a computer generated statement.
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Populate Shops
        const select = document.getElementById('rep-stmt-shop');
        const applicants = Store.getApplicants();
        applicants.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.shopNo;
            opt.textContent = `${app.shopNo} - ${app.applicantName}`;
            select.appendChild(opt);
        });

        // Listen for selection
        select.addEventListener('change', () => {
            const shopNo = select.value;
            if (shopNo) this.generateStatement(shopNo);
            else document.getElementById('stmt-results').style.display = 'none';
        });

        document.getElementById('btn-stmt-print').addEventListener('click', () => {
            const content = document.getElementById('print-stmt-area').innerHTML;
            const w = window.open('', '_blank');
            w.document.write(`
                <html>
                <head>
                    <title>Statement - ${document.getElementById('stmt-shop-no').textContent}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; border-bottom: 1px solid #ddd; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>${content}</body>
                </html>
            `);
            w.document.close();
            w.print();
        });
    },

    generateStatement(shopNo) {
        const app = Store.getApplicants().find(a => a.shopNo === shopNo);
        if (!app) return;

        // Use the Single Source of Truth
        const dues = Store.calculateOutstandingDues(app); // Defaults to today

        // Header Info
        document.getElementById('stmt-date').textContent = `As on: ${new Date().toLocaleDateString('en-IN')}`;
        document.getElementById('stmt-shop-no').textContent = app.shopNo;
        document.getElementById('stmt-name').textContent = app.applicantName;
        document.getElementById('stmt-contact').textContent = app.mobileNo || '';

        // Table Body
        const tbody = document.getElementById('stmt-list-body');
        const tfoot = document.getElementById('stmt-foot');
        let html = '';
        let sl = 1;

        if (!dues.details || dues.details.length === 0) {
            html = '<tr><td colspan="5" style="text-align:center; padding: 1rem;">No outstanding dues.</td></tr>';
            tfoot.innerHTML = '';
        } else {
            dues.details.forEach(d => {
                const total = d.rent + d.penalty;
                html += `
                    <tr>
                        <td style="padding: 8px;">${sl++}</td>
                        <td style="padding: 8px;">${d.month} <span style="font-size:0.8rem; color:#666;">(${d.source === 'history' ? 'Arrear' : 'Current'})</span></td>
                        <td style="text-align: right; padding: 8px;">₹${d.rent.toFixed(2)}</td>
                        <td style="text-align: right; padding: 8px; color: #ef4444;">₹${d.penalty.toFixed(2)}</td>
                        <td style="text-align: right; padding: 8px; font-weight: 500;">₹${total.toFixed(2)}</td>
                    </tr>
                `;
            });

            tfoot.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: right; padding: 10px;">TOTAL OUTSTANDING</td>
                    <td style="text-align: right; padding: 10px;">₹${(dues.baseRent + dues.gst).toFixed(2)}</td>
                    <td style="text-align: right; padding: 10px;">₹${dues.penalty.toFixed(2)}</td>
                    <td style="text-align: right; padding: 10px; font-size: 1.1rem;">₹${dues.totalAmount.toFixed(2)}</td>
                </tr>
            `;
        }

        tbody.innerHTML = html;
        document.getElementById('stmt-results').style.display = 'block';
    },

    calculateDCBForApplicant(app, fromDate, toDate, allPayments, rate, impDate) {
        // Calculate detailed current vs arrear demand/collection/balance

        // Ensure inputs are safe
        const penaltyRate = parseFloat(rate) || 15; // default 15 if NaN/missing

        // STRICT FREEZE LOGIC:
        // Filter payments to ignore anything after the report 'toDate' (End of selected FY).
        // This ensures the report shows the status "As of March 31st", even if generated later.
        const payments = allPayments.filter(p => {
            if (!p.paymentDate) return false;
            const pd = new Date(p.paymentDate);
            return pd <= toDate;
        });

        // Determine FY start based on fromDate
        const fd = new Date(fromDate);
        const fdYear = fd.getFullYear();
        const fdMonth = fd.getMonth();
        const fyStartYear = fdMonth < 3 ? fdYear - 1 : fdYear; // if Jan-Mar, FY started Apr of previous year
        const fyStart = new Date(fyStartYear, 3, 1); // Apr 1 of FY start year
        const prevFyEnd = new Date(fyStart);
        prevFyEnd.setDate(prevFyEnd.getDate() - 1); // Last day of previous FY (Mar 31)

        // START DATE: Earliest of Lease Start or Report Start
        // We MUST scan from the very beginning of the lease to calculate "Opening Balance" (Arrear Demand) correctly.
        const parseLocal = (d) => {
            if (!d) return null;
            if (typeof d === 'string' && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, day] = d.split('-').map(Number);
                return new Date(y, m - 1, day);
            }
            return new Date(d);
        };
        const appStart = parseLocal(app.rentStartDate || app.leaseDate);

        // Totals
        let currentDemandBase = 0, currentDemandGst = 0;
        let arrearDemandBase = 0, arrearDemandGst = 0, arrearDemandPenalty = 0;

        let currentCollection = 0, currentCollectionPenalty = 0, arrearCollection = 0;
        let hasWaiverApplied = false;



        // Helper: Get Rent Calculation for specific month
        const getRentDetails = (dateObj) => {
            // Default to current app rent
            let base = Utils.parseNumber(app.rentBase || app.rentBase === 0 ? app.rentBase : null);
            if (base === 0) { // Try fallback if 0
                const rt = Utils.parseNumber(app.rentTotal || app.rentTotal === 0 ? app.rentTotal : null) || Utils.parseNumber(app.rentTotal || app.rent || 0);
                if (rt) base = parseFloat((rt / 1.18).toFixed(2));
            }

            // Check History Blocks for a match
            if (app.leaseHistory && Array.isArray(app.leaseHistory)) {
                const match = app.leaseHistory.find(h => {
                    if (!h || !h.startDate || !h.endDate) return false;
                    const s = new Date(h.startDate);
                    const e = new Date(h.endDate);
                    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && dateObj >= s && dateObj <= e;
                });

                if (match && match.rentBase !== undefined && match.rentBase !== null && match.rentBase !== '') {
                    base = Utils.parseNumber(match.rentBase);
                }
            }

            const gst = parseFloat((base * 0.18).toFixed(2));
            return { base: isNaN(base) ? 0 : base, gst: isNaN(gst) ? 0 : gst };
        };


        // Iterate months from Applicant Start up to Report End Date
        // If appStart is missing, fallback to fromDate (but then arrears won't be calculated)
        const scanStart = (appStart && !isNaN(new Date(appStart).getTime())) ? new Date(appStart) : new Date(fromDate);
        let current = new Date(scanStart);
        current.setDate(1); // Ensure we start at 1st of month

        const reportStart = new Date(fromDate);
        reportStart.setDate(1);

        const end = new Date(toDate);

        // Sanity check loop limits
        if (isNaN(current.getTime()) || isNaN(end.getTime())) {
            return {
                currentDemandBase: 0, currentDemandGst: 0, arrearDemandBase: 0, arrearDemandGst: 0, arrearDemandPenalty: 0, totalDemand: 0,
                currentCollection: 0, arrearCollection: 0, totalCollection: 0, currentBalance: 0, arrearBalance: 0, totalBalance: 0
            };
        }

        // Loop through EVERY month from lease start until report end
        for (; current <= end; current.setMonth(current.getMonth() + 1)) {
            const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

            // DYNAMIC RENT COMPONENTS
            const { base: monthlyBase, gst: monthlyGst } = getRentDetails(current);

            // Find payment for this specific month
            const payment = payments.find(p => p.shopNo === app.shopNo && p.paymentForMonth === monthStr);

            // Determine if this month is "In Report Period" (Current) or "Before Report Period" (Arrear)
            const isArrearMonth = current < reportStart;

            if (isArrearMonth) {
                // ARREAR CALCULATION (Opening Balance Logic)
                // We add to demand, and if paid, we add to collection.
                // NOTE: Using specific requirement: "Arrear Collection" = Collections made for old months.

                // Penalty Logic for Arrears:
                const dueDay = parseInt(app.paymentDay) || 1;
                const dueDate = new Date(current.getFullYear(), current.getMonth(), Math.min(dueDay, 28));
                let countStart = dueDate;
                if (impDate && !isNaN(new Date(impDate).getTime()) && impDate > dueDate) countStart = impDate;

                let penaltyForMonth = 0;
                let isSettledBeforeReport = false;

                // 1. Check Historical Settlement
                if (payment) {
                    const pDateStr = payment.paymentDate || payment.timestamp;
                    if (pDateStr) {
                        const pDate = new Date(pDateStr);
                        if (!isNaN(pDate.getTime()) && pDate < reportStart) {
                            isSettledBeforeReport = true;
                        }
                    }
                }

                // 2. Calculate Theoretical Opening Penalty (Up to Previous FY End)
                // This represents the penalty liability that existed at the START of this report period.
                // We calculate this regardless of whether it was paid *during* this period or not.
                if (!isSettledBeforeReport) {
                    if (prevFyEnd > countStart && !isNaN(prevFyEnd.getTime()) && !isNaN(countStart.getTime())) {
                        const diffDays = Math.ceil((prevFyEnd - countStart) / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                            penaltyForMonth = diffDays * penaltyRate;
                        }
                    }
                }

                if (isNaN(penaltyForMonth)) penaltyForMonth = 0;

                // --- WAIVER CHECK ---
                // If a waiver exists for this specific Shop + Month, we override the Theoretical Penalty.
                // We assume a 'Full Waiver' implies penalty is 0. 
                // Partial waiver support can be added if waiver record has 'amount'.
                // Using YYYY-MM format matching. Use existing outer 'monthStr' (YYYY-MM).
                const allWaivers = Store.getWaivers() || [];
                // const monthStr = ... (Already defined in loop scope at line 1966)

                // Find matching waiver
                // Find matching waiver (Compare strings robustly)
                const waiver = allWaivers.find(w => String(w.shopNo) === String(app.shopNo) && w.month === monthStr);
                if (waiver) {
                    // reduce demand by waiver
                    // For now, let's effectively set it to 0 if waiver exists, 
                    // or maybe we should store the waiver amount? 
                    // The UI asks for "For Month", implies full waiver for that month's penalty.
                    // Let's set to 0.
                    penaltyForMonth = 0;
                    hasWaiverApplied = true;
                }

                // Demand Accumulation (Only if NOT historically settled)
                if (!isSettledBeforeReport) {
                    arrearDemandBase += monthlyBase;
                    arrearDemandGst += monthlyGst;
                    arrearDemandPenalty += penaltyForMonth;

                    // Collection Accumulation
                    if (payment) {
                        const paid = Utils.parseNumber(payment.grandTotal || 0);
                        const monthDemand = monthlyBase + monthlyGst + penaltyForMonth;
                        arrearCollection += Math.min(paid, monthDemand);
                    }
                }

            } else {
                // CURRENT YEAR CALCULATION
                // ...
                // CURRENT REPORT PERIOD
                currentDemandBase += monthlyBase;
                currentDemandGst += monthlyGst;

                if (payment) {
                    const paid = Utils.parseNumber(payment.grandTotal || 0);
                    const pPenalty = Utils.parseNumber(payment.penalty || 0);

                    // Logic Update: Track Current Year Penalty separately.
                    // Do NOT add to Demand. Just track collection.
                    if (pPenalty > 0) {
                        currentCollectionPenalty += pPenalty;
                    }

                    // Allow collection up to base+gst plus any actual penalty in payment
                    const allowed = monthlyBase + monthlyGst + pPenalty;
                    currentCollection += Math.min(paid, allowed);
                }
            }
        }

        // Final Safeties before returning
        const safe = v => isNaN(v) ? 0 : v;

        const totalDemand = safe(currentDemandBase + currentDemandGst + arrearDemandBase + arrearDemandGst + arrearDemandPenalty);
        // Note: totalCollection usually includes all collected money.
        // Should 'currentCollectionPenalty' be added to 'currentCollection'?
        // 'currentCollection' variable tracks total paid for current months (including penalty portion if part of grandTotal).
        // Wait, currentCollection += Math.min(paid, allowed). Allowed INCLUDES penalty.
        // So currentCollection ALREADY has the penalty amount.
        // We just need to RETURN currentCollectionPenalty as a separate metric for display.

        const totalCollection = safe(currentCollection + arrearCollection);
        const currentBalance = safe((currentDemandBase + currentDemandGst) - (currentCollection - currentCollectionPenalty));
        // Logic Check: If Current Collection includes Penalty, and Demand DOES NOT include Penalty.
        // Balance = Demand - (Collection - Penalty). (i.e. Pure Rent/GST Balance).
        // OR: Balance = Demand - Collection. (Then Balance becomes negative if penalty collected).
        // User wants: "Extra column... excess penal amount... should be separately shown".
        // This implies Balance should be 0.
        // So Balance = Demand - (Collection - Penalty). Correct.

        const arrearBalance = safe((arrearDemandBase + arrearDemandGst + arrearDemandPenalty) - arrearCollection);
        const totalBalance = safe(currentBalance + arrearBalance); // recalculate total balance

        return {
            currentDemandBase: safe(currentDemandBase),
            currentDemandGst: safe(currentDemandGst),
            arrearDemandBase: safe(arrearDemandBase),
            arrearDemandGst: safe(arrearDemandGst),
            arrearDemandPenalty: safe(arrearDemandPenalty),
            totalDemand,
            currentCollection: safe(currentCollection),
            currentCollectionPenalty: safe(currentCollectionPenalty), // NEW RETURN
            arrearCollection: safe(arrearCollection),
            totalCollection,
            currentBalance,
            arrearBalance,
            totalBalance,
            hasWaiverApplied // NEW RETURN
        };
    },

    exportDCB() {
        if (!this.lastDcbResults || !Array.isArray(this.lastDcbResults.rows)) {
            alert('Please generate the DCB report first before exporting.');
            return;
        }

        const header = [
            'Sl No', 'Shop No', 'Shop Name', 'Current Demand (Base)', 'Current Demand (GST)', 'Arrear Demand (Base)',
            'Arrear Demand (GST)', 'Arrear Demand (Penalty)', 'Total Demand', 'Current Collection', 'Current Collection (Penalty)', 'Arrear Collection', 'Total Collection',
            'Current Balance', 'Arrear Balance', 'Total Balance', '% Collection'
        ];

        const periodText = (this.lastDcbResults.period && this.lastDcbResults.period.fy)
            ? `For the Financial Year : ${this.lastDcbResults.period.fy}`
            : (this.lastDcbResults.period ? `Period: ${this.lastDcbResults.period.fromDate} to ${this.lastDcbResults.period.toDate}` : 'Period: -');
        const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        const csvRows = [];
        csvRows.push(['SIDDIPET URBAN DEVELOPMENT AUTHORITY'].join(','));
        csvRows.push(['Statement showing the Demand, Collection & Balance (DCB) Report of SUDA Commercial Shops'].join(','));
        csvRows.push([periodText].join(','));
        csvRows.push([`As on ${todayStr}`].join(','));
        csvRows.push([]); // Empty row
        csvRows.push(header.join(','));

        this.lastDcbResults.rows.forEach((r, idx) => {
            const res = r.result;
            const pct = res.totalDemand > 0 ? ((res.totalCollection / res.totalDemand) * 100).toFixed(2) : '0.00';
            const row = [
                idx + 1,
                r.shop,
                '"' + (r.shopName || '-') + '"',
                res.currentDemandBase.toFixed(2),
                res.currentDemandGst.toFixed(2),
                res.arrearDemandBase.toFixed(2),
                res.arrearDemandGst.toFixed(2),
                res.arrearDemandPenalty.toFixed(2),
                res.totalDemand.toFixed(2),
                (res.currentCollection - (res.currentCollectionPenalty || 0)).toFixed(2),
                (res.currentCollectionPenalty || 0).toFixed(2),
                res.arrearCollection.toFixed(2),
                res.totalCollection.toFixed(2),
                res.currentBalance.toFixed(2),
                res.arrearBalance.toFixed(2),
                res.totalBalance.toFixed(2),
                pct + '%'
            ];
            csvRows.push(row.join(','));
        });

        // Totals row
        const t = this.lastDcbResults.totals;
        const totalsRow = [
            '', 'TOTAL', '',
            t.totalCurrentDemandBase.toFixed(2),
            t.totalCurrentDemandGst.toFixed(2),
            t.totalArrearDemandBase.toFixed(2),
            t.totalArrearDemandGst.toFixed(2),
            t.totalArrearDemandPenalty.toFixed(2),
            t.totalTotalDemand.toFixed(2),
            (t.totalCurrentCollection - (t.totalCurrentCollectionPenalty || 0)).toFixed(2),
            (t.totalCurrentCollectionPenalty || 0).toFixed(2),
            t.totalArrearCollection.toFixed(2),
            t.totalTotalCollection.toFixed(2),
            t.totalCurrentBalance.toFixed(2),
            t.totalArrearBalance.toFixed(2),
            t.totalTotalBalance.toFixed(2),
            (t.totalPct || 0).toFixed(2) + '%'
        ];
        csvRows.push(totalsRow.join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `dcb_report_${(this.lastDcbResults.period && this.lastDcbResults.period.fromDate) || new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    printDCB() {
        // Use last generated results if available for a clean print layout
        const results = this.lastDcbResults;
        let contentHtml = '';

        if (results && Array.isArray(results.rows)) {
            const totals = results.totals || {};
            const periodText = (results.period && results.period.fy)
                ? `For the Financial Year : ${results.period.fy}`
                : (results.period ? `Period: ${results.period.fromDate} to ${results.period.toDate}` : '');
            const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            // Build table header
            const header = `
                <tr>
                    <th>Sl No</th>
                    <th>Shop No</th>
                    <th>Shop Name</th>
                    <th>Current Demand (Base)</th>
                    <th>Current Demand (GST)</th>
                    <th>Arrear Demand (Base)</th>
                    <th>Arrear Demand (GST)</th>
                    <th>Arrear Demand (Penalty)</th>
                    <th>Total Demand</th>
                    <th>Current Collection</th>
                    <th>Current Collection (Penalty)</th>
                    <th>Arrear Collection</th>
                    <th>Total Collection</th>
                    <th>Current Balance</th>
                    <th>Arrear Balance</th>
                    <th>Total Balance</th>
                    <th>% Collection</th>
                </tr>
            `;

            // Build rows
            const rowsHtml = results.rows.map((r, idx) => {
                const res = r.result;
                const pct = res.totalDemand > 0 ? ((res.totalCollection / res.totalDemand) * 100).toFixed(2) : '0.00';
                return `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${r.shop}</td>
                        <td>${r.shopName}${res.hasWaiverApplied ? ' <span style="font-size:9px;color:red;">(Waiver)</span>' : ''}</td>
                        <td style="text-align:right;">₹${res.currentDemandBase.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.currentDemandGst.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.arrearDemandBase.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.arrearDemandGst.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.arrearDemandPenalty.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.totalDemand.toFixed(2)}</td>
                        <td style="text-align:right;">₹${(res.currentCollection - (res.currentCollectionPenalty || 0)).toFixed(2)}</td>
                        <td style="text-align:right;">₹${(res.currentCollectionPenalty || 0).toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.arrearCollection.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.totalCollection.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.currentBalance.toFixed(2)}</td>
                        <td style="text-align:right;">₹${res.arrearBalance.toFixed(2)}</td>
                        <td style="text-align:right; font-weight:700;">₹${res.totalBalance.toFixed(2)}</td>
                        <td style="text-align:right;">${pct}%</td>
                    </tr>
                `;
            }).join('');

            // Totals row
            const totalsHtml = `
                <tr style="font-weight:700; background:#f1f5f9;">
                    <td colspan="3" style="text-align:right;">TOTAL</td>
                    <td style="text-align:right;">₹${(totals.totalCurrentDemandBase || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalCurrentDemandGst || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalArrearDemandBase || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalArrearDemandGst || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalArrearDemandPenalty || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalTotalDemand || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${((totals.totalCurrentCollection || 0) - (totals.totalCurrentCollectionPenalty || 0)).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalCurrentCollectionPenalty || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalArrearCollection || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalTotalCollection || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalCurrentBalance || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalArrearBalance || 0).toFixed(2)}</td>
                    <td style="text-align:right;">₹${(totals.totalTotalBalance || 0).toFixed(2)}</td>
                    <td style="text-align:right;">${(totals.totalPct || 0).toFixed(2)}%</td>

                </tr>
            `;

            contentHtml = `
                <div style="margin: 0 8px;">
                    <h2 style="text-align:center; margin-bottom:0.2rem;">SIDDIPET URBAN DEVELOPMENT AUTHORITY</h2>
                    <div style="text-align:center; margin-bottom:0.8rem; font-weight:600;">Statement showing the Demand, Collection & Balance (DCB) Report of SUDA Commercial Shops</div>
                    <div style="text-align:center; margin-bottom:0.2rem;">${periodText}</div>
                    <div style="text-align:center; margin-bottom:1rem; font-size: 11px;">As on  ${todayStr}</div>
                    <table style="width:100%; border-collapse: collapse; font-size: 11px;">
                        <thead>${header}</thead>
                        <tbody>${rowsHtml}</tbody>
                        <tfoot>${totalsHtml}</tfoot>
                    </table>
                    <div style="height: 50px;"></div> <!-- Signature Space -->
                    <div style="text-align:right; margin-top:1.2rem; margin-right:3rem; font-size:12px;">
                        ____________________
                    </div>
                    <div style="text-align:right; margin-top:1.2rem; margin-right:3rem; font-size:12px;">
                        Authorized Signatory
                    </div>
                    <div style="height:200px;"></div>
                    <div style="text-align:left; 
                                margin-top:1rem; 
                                margin-left:3rem;
                                font-family:Courier New, sans-serif; 
                                font-size:11px;
                                font-weight:600;
                                font-style:italic;">
                                Report Generated via ShopLease Manager
                    </div>
                   <div id="timestamp" style="font-size:11px;margin-top:0.3rem; margin-left:3rem;
                            font-family:Courier New, sans-serif;
                            font-weight:600;
                            font-style:italic;">Timestamp: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date().toLocaleTimeString()}</div>
                </div>
            `;
        } else {
            contentHtml = `<div style="padding:1rem;">No DCB data available. Generate report first.</div>`;
        }

        const style = `
            <style>
                @page { size: A4 landscape; margin: 10mm }
                body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cbd5e1; padding: 6px; }
                thead th { background: #f1f5f9; }
                tfoot td { font-weight: 700; }
            </style>
        `;

        const w = window.open('', '_blank');
        if (!w) { alert('Unable to open print window. Please allow popups for this site.'); return; }
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>DCB Report</title>${style}</head><body>${contentHtml}<script>window.onload=function(){setTimeout(()=>{window.print();},200);};</script></body></html>`);
        w.document.close();
    }

};

// ==========================================
// GST MONTH-WISE REPORT MODULE
// ==========================================
const GstMonthwiseReportModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>GST Month-wise Report (SUDA Format)</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary" id="btn-export-gst-excel" style="background: #059669;">📊 Export to Excel</button>
                        <button class="btn-primary" id="btn-export-gst-pdf" style="background: #2563eb;">📄 Export to PDF</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div class="form-group">
                        <label class="form-label">Month</label>
                        <select id="gst-report-month" class="form-select">
                            <option value="">-- All Months --</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Year</label>
                        <select id="gst-report-year" class="form-select">
                            <option value="">-- All Years --</option>
                        </select>
                    </div>
                </div>

                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" id="gst-monthwise-table" style="border-collapse: collapse; width: 100%; font-size: 0.9rem;">
                        <thead style="background: #f1f5f9; border: 1px solid #cbd5e1;">
                            <tr>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Sl No</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Date</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Shop No</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Name of the Lessee</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Payment Method</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Cheque / Receipt / Online No</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">GST No</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Shop Rent</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">GST @ 18%</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Penalty for late payment</th>
                                <th style="border: 1px solid #cbd5e1; padding: 8px;">Total Collection</th>
                            </tr>
                        </thead>
                        <tbody id="gst-monthwise-body" style="border: 1px solid #cbd5e1;">
                            <tr><td colspan="11" style="text-align: center; padding: 1rem; color: var(--text-muted);">No data available. Select month/year to view report.</td></tr>
                        </tbody>
                        <tfoot id="gst-monthwise-footer" style="font-weight: bold; background: #f1f5f9; border: 1px solid #cbd5e1;">
                            <tr>
                                <td colspan="7" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Total:-</td>
                                <td style="border: 1px solid #cbd5e1; padding: 8px;">₹0.00</td>
                                <td style="border: 1px solid #cbd5e1; padding: 8px;">₹0.00</td>
                                <td style="border: 1px solid #cbd5e1; padding: 8px;">₹0.00</td>
                                <td style="border: 1px solid #cbd5e1; padding: 8px;">₹0.00</td>
                            </tr>
                        </tfoot>
                    </table>
                <div id="gst-form58-action" style="margin-top: 1rem; text-align: left; display: none; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                    <button class="btn-primary" id="btn-gen-form58" style="background: #4f46e5; display: flex; align-items: center; gap: 0.5rem;">
                         <span style="font-size: 1.2rem;">📄</span> Generate Form-58
                    </button>
                     <p style="margin-top: 5px; font-size: 0.85rem; color: #64748b;">
                        * Generate TSTC Form-58 for Treasury Submission (Available when Month & Year are selected)
                    </p>
                </div>
            </div >
    `;

        this.setupYearDropdown();
        this.setupEventListeners();
        this.generateReport();
    },

    setupYearDropdown() {
        const payments = Store.getPayments();
        const years = new Set();
        const currentYear = new Date().getFullYear();

        // Add current year and previous 5 years
        for (let i = 0; i <= 5; i++) {
            years.add(currentYear - i);
        }

        // Extract years from payments
        payments.forEach(p => {
            if (p.paymentDate) {
                const year = new Date(p.paymentDate).getFullYear();
                years.add(year);
            }
        });

        const yearSelect = document.getElementById('gst-report-year');
        const sortedYears = Array.from(years).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            yearSelect.appendChild(opt);
        });
    },

    setupEventListeners() {
        document.getElementById('gst-report-month').addEventListener('change', () => this.generateReport());
        document.getElementById('gst-report-year').addEventListener('change', () => this.generateReport());
        document.getElementById('btn-export-gst-excel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('btn-export-gst-pdf').addEventListener('click', () => this.exportToPDF());

        // Form-58 Button Event
        const btnForm58 = document.getElementById('btn-gen-form58');
        if (btnForm58) {
            btnForm58.addEventListener('click', () => this.generateForm58());
        }
    },

    generateReport() {
        const month = document.getElementById('gst-report-month').value;
        const year = document.getElementById('gst-report-year').value;
        const payments = Store.getPayments();
        const applicants = Store.getApplicants();

        // TOGGLE FORM-58 BUTTON VISIBILITY
        // Only show if both Month and Year are selected
        const actionContainer = document.getElementById('gst-form58-action');
        if (actionContainer) {
            if (month && year) {
                actionContainer.style.display = 'block';
            } else {
                actionContainer.style.display = 'none';
            }
        }

        // Filter payments
        const filtered = payments.filter(p => {
            if (!p.paymentDate) return false;
            const pDate = new Date(p.paymentDate);
            if (year && pDate.getFullYear() !== parseInt(year)) return false;
            if (month && pDate.getMonth() + 1 !== parseInt(month)) return false;
            return true;
        });

        // Sort by date
        filtered.sort((a, b) => new Date(a.paymentDate || 0) - new Date(b.paymentDate || 0));

        const tbody = document.getElementById('gst-monthwise-body');
        const tfoot = document.getElementById('gst-monthwise-footer');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 1rem; color: var(--text-muted);">No payment records found for selected period.</td></tr>';
            this.updateFooter(tfoot, 0, 0, 0, 0);
            return;
        }

        let slNo = 1;
        let totalRent = 0, totalGST = 0, totalPenalty = 0, totalCollection = 0;

        tbody.innerHTML = filtered.map(p => {
            const applicant = applicants.find(a => a.shopNo === p.shopNo);
            // Combine both applicant and proprietor names if available
            let applicantName = 'N/A';
            if (applicant) {
                const names = [];
                if (applicant.applicantName) names.push(applicant.applicantName);
                if (applicant.proprietorShopName) names.push(applicant.proprietorShopName);
                applicantName = names.length > 0 ? names.join(' / ') : 'N/A';
            }
            // Check both gstNo and shopGst for backward compatibility
            const gstNo = applicant && (applicant.gstNo || applicant.shopGst) ? (applicant.gstNo || applicant.shopGst) : 'NO GST';

            const rent = parseFloat(p.rentAmount || p.rentBase || 0);
            const gst = parseFloat(p.gstAmount || p.gst || 0);
            const penalty = parseFloat(p.penalty || 0);
            const total = parseFloat(p.grandTotal || rent + gst + penalty);

            totalRent += rent;
            totalGST += gst;
            totalPenalty += penalty;
            totalCollection += total;

            // Format payment method reference
            let methodRef = '';
            if (p.paymentMethod === 'cash') {
                // For cash, try manual receiptNo first, then fall back to receiptId
                methodRef = p.receiptNo || p.receiptId || '';
            } else if (p.paymentMethod === 'dd-cheque') {
                methodRef = `${p.ddChequeNo || ''} (${p.ddChequeDate || ''})`;
            } else if (p.paymentMethod === 'online') {
                methodRef = p.transactionNo || '';
            }

            const paymentMethod = p.paymentMethod ? p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1).replace('-', '/') : '-';

            return `
                <tr style="border: 1px solid #cbd5e1;">
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${slNo++}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.paymentDate || '-'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${p.shopNo}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${applicantName}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${paymentMethod}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${methodRef}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${gstNo}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">₹${rent.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">₹${gst.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">₹${penalty.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">₹${total.toFixed(2)}</td>
                </tr>
    `;
        }).join('');

        this.updateFooter(tfoot, totalRent, totalGST, totalPenalty, totalCollection);
    },

    updateFooter(tfoot, rent, gst, penalty, total) {
        tfoot.innerHTML = `
            <tr style="border: 1px solid #cbd5e1;">
                <td colspan="7" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">Total:-</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">₹${rent.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">₹${gst.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">₹${penalty.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">₹${total.toFixed(2)}</td>
            </tr>
    `;
    },

    exportToExcel() {
        const month = document.getElementById('gst-report-month').value;
        const year = document.getElementById('gst-report-year').value;
        const payments = Store.getPayments();
        const applicants = Store.getApplicants();

        // Filter payments
        const filtered = payments.filter(p => {
            if (!p.paymentDate) return false;
            const pDate = new Date(p.paymentDate);
            if (year && pDate.getFullYear() !== parseInt(year)) return false;
            if (month && pDate.getMonth() + 1 !== parseInt(month)) return false;
            return true;
        });

        filtered.sort((a, b) => new Date(a.paymentDate || 0) - new Date(b.paymentDate || 0));

        // Build CSV
        let csv = [];
        csv.push(['SIDDIPET URBAN DEVELOPMENT AUTHORITY']);
        csv.push(['STATEMENT SHOWING THE RENT PARTICULARS FROM THE SUDA SHOPS']);
        const monthName = month ? new Date(2025, parseInt(month) - 1).toLocaleString('default', { month: 'long' }) : 'All';
        csv.push([`FOR THE MONTH OF ${monthName}${year ? '-' + year : ''} `]);
        csv.push([]);

        csv.push([
            'Sl No',
            'Date',
            'Shop No',
            'Name of the Lessee',
            'Payment Method',
            'Cheque / Receipt / Online No',
            'GST No',
            'Shop Rent',
            'GST @ 18%',
            'Penalty for late payment',
            'Total Collection'
        ]);

        let slNo = 1;
        let totalRent = 0, totalGST = 0, totalPenalty = 0, totalCollection = 0;

        filtered.forEach(p => {
            const applicant = applicants.find(a => a.shopNo === p.shopNo);
            // Combine both applicant and proprietor names if available
            let applicantName = 'N/A';
            if (applicant) {
                const names = [];
                if (applicant.applicantName) names.push(applicant.applicantName);
                if (applicant.proprietorShopName) names.push(applicant.proprietorShopName);
                applicantName = names.length > 0 ? names.join(' / ') : 'N/A';
            }
            // Check both gstNo and shopGst for backward compatibility
            const gstNo = applicant && (applicant.gstNo || applicant.shopGst) ? (applicant.gstNo || applicant.shopGst) : 'NO GST';

            const rent = parseFloat(p.rentAmount || p.rentBase || 0);
            const gst = parseFloat(p.gstAmount || p.gst || 0);
            const penalty = parseFloat(p.penalty || 0);
            const total = parseFloat(p.grandTotal || rent + gst + penalty);

            totalRent += rent;
            totalGST += gst;
            totalPenalty += penalty;
            totalCollection += total;

            let methodRef = '';
            if (p.paymentMethod === 'cash') {
                // For cash, try manual receiptNo first, then fall back to receiptId
                methodRef = p.receiptNo || p.receiptId || '';
            } else if (p.paymentMethod === 'dd-cheque') {
                methodRef = `${p.ddChequeNo || ''} (${p.ddChequeDate || ''})`;
            } else if (p.paymentMethod === 'online') {
                methodRef = p.transactionNo || '';
            }

            const paymentMethod = p.paymentMethod ? p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1).replace('-', '/') : '-';

            csv.push([
                slNo++,
                p.paymentDate || '',
                p.shopNo,
                applicantName,
                paymentMethod,
                methodRef,
                gstNo,
                rent.toFixed(2),
                gst.toFixed(2),
                penalty.toFixed(2),
                total.toFixed(2)
            ]);
        });

        csv.push([]);
        csv.push(['Total:-', '', '', '', '', '', '', totalRent.toFixed(2), totalGST.toFixed(2), totalPenalty.toFixed(2), totalCollection.toFixed(2)]);

        // Convert to CSV
        const csvContent = csv.map(row =>
            row.map(cell => {
                const str = String(cell || '');
                return '"' + str.replace(/"/g, '""') + '"';
            }).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `GST_Report_${month || 'All'}_${year || 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    exportToPDF() {
        // ... (Keep existing PDF export)
        // For brevity, just calling the same logic as previous chunk since I can't effectively 'skip' nicely in this replace tool without context matching issues
        // Actually, since I am replacing the whole block from setupEventListeners down to generateReport, I need to keep exportToPDF unless I want to remove it.
        // Wait, the previous code block ended before exportToPDF.
        // Let's implement generateForm58 here.
        this._exportToPDFImpl();
    },

    _exportToPDFImpl() {
        const month = document.getElementById('gst-report-month').value;
        const year = document.getElementById('gst-report-year').value;
        const payments = Store.getPayments();
        const applicants = Store.getApplicants();

        // Filter payments
        const filtered = payments.filter(p => {
            if (!p.paymentDate) return false;
            const pDate = new Date(p.paymentDate);
            if (year && pDate.getFullYear() !== parseInt(year)) return false;
            if (month && pDate.getMonth() + 1 !== parseInt(month)) return false;
            return true;
        });

        filtered.sort((a, b) => new Date(a.paymentDate || 0) - new Date(b.paymentDate || 0));

        let slNo = 1;
        let totalRent = 0, totalGST = 0, totalPenalty = 0, totalCollection = 0;

        // Build table HTML
        let tableRows = filtered.map(p => {
            const applicant = applicants.find(a => a.shopNo === p.shopNo);
            // Combine both applicant and proprietor names if available
            let applicantName = 'N/A';
            if (applicant) {
                const names = [];
                if (applicant.applicantName) names.push(applicant.applicantName);
                if (applicant.proprietorShopName) names.push(applicant.proprietorShopName);
                applicantName = names.length > 0 ? names.join(' / ') : 'N/A';
            }
            // Check both gstNo and shopGst for backward compatibility
            const gstNo = applicant && (applicant.gstNo || applicant.shopGst) ? (applicant.gstNo || applicant.shopGst) : 'NO GST';

            const rent = parseFloat(p.rentAmount || p.rentBase || 0);
            const gst = parseFloat(p.gstAmount || p.gst || 0);
            const penalty = parseFloat(p.penalty || 0);
            const total = parseFloat(p.grandTotal || rent + gst + penalty);

            totalRent += rent;
            totalGST += gst;
            totalPenalty += penalty;
            totalCollection += total;

            let methodRef = '';
            if (p.paymentMethod === 'cash') {
                // For cash, try manual receiptNo first, then fall back to receiptId
                methodRef = p.receiptNo || p.receiptId || '';
            } else if (p.paymentMethod === 'dd-cheque') {
                methodRef = `${p.ddChequeNo || ''} (${p.ddChequeDate || ''})`;
            } else if (p.paymentMethod === 'online') {
                methodRef = p.transactionNo || '';
            }

            const paymentMethod = p.paymentMethod ? p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1).replace('-', '/') : '-';

            return `
                <tr style="border: 1px solid #000; height: 25px;">
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">${slNo++}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">${p.paymentDate || ''}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px; font-weight: bold;">${p.shopNo}</td>
                    <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${applicantName}</td>
                    <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${paymentMethod}</td>
                    <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${methodRef}</td>
                    <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${gstNo}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 11px;">${rent.toFixed(2)}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 11px;">${gst.toFixed(2)}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 11px;">${penalty.toFixed(2)}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 11px; font-weight: bold;">${total.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const monthName = month ? new Date(2025, parseInt(month) - 1).toLocaleString('default', { month: 'long' }) : 'All';

        const htmlContent = `
            <html>
            <head>
                <title>GST Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 5px 0; font-size: 14px; font-weight: bold; }
                    .header p { margin: 5px 0; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px; font-weight: bold; background: #f0f0f0; }
                    td { border: 1px solid #000; padding: 8px; font-size: 11px; }
                    .total-row { background: #f0f0f0; font-weight: bold; }
                    @media print { body { margin: 0; padding: 10mm; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SIDDIPET URBAN DEVELOPMENT AUTHORITY</h1>
                    <p>STATEMENT SHOWING THE RENT PARTICULARS FROM THE SUDA SHOPS</p>
                    <p>FOR THE MONTH OF ${monthName.toUpperCase()} - ${year || new Date().getFullYear()}</p>
                </div>

                <table>
                    <thead>
                        <tr style="border: 1px solid #000;">
                            <th style="border: 1px solid #000;">Sl No</th>
                            <th style="border: 1px solid #000;">Date</th>
                            <th style="border: 1px solid #000;">Shop No</th>
                            <th style="border: 1px solid #000;">Name of the Lessee</th>
                            <th style="border: 1px solid #000;">Payment Method</th>
                            <th style="border: 1px solid #000;">Cheque / Receipt / Online No</th>
                            <th style="border: 1px solid #000;">GST No</th>
                            <th style="border: 1px solid #000;">Shop Rent</th>
                            <th style="border: 1px solid #000;">GST @ 18%</th>
                            <th style="border: 1px solid #000;">Penalty for late payment</th>
                            <th style="border: 1px solid #000;">Total Collection</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="total-row">
                            <td colspan="7" style="border: 1px solid #000; text-align: right;">Total:-</td>
                            <td style="border: 1px solid #000; text-align: right;">${totalRent.toFixed(2)}</td>
                            <td style="border: 1px solid #000; text-align: right;">${totalGST.toFixed(2)}</td>
                            <td style="border: 1px solid #000; text-align: right;">${totalPenalty.toFixed(2)}</td>
                            <td style="border: 1px solid #000; text-align: right;">${totalCollection.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 40px; text-align: right; padding-right: 50px;">
                    <p>Vice Chairman</p>
                    <p>SUDA, Siddipet</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
    `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
    },

    generateForm58() {
        // 1. Get Selected Data
        const monthVar = document.getElementById('gst-report-month').value;
        const yearVar = document.getElementById('gst-report-year').value;

        if (!monthVar || !yearVar) {
            alert("Please select both Month and Year to generate Form-58.");
            return;
        }

        // 2. Calculate Total GST for the selected month
        const payments = Store.getPayments();
        let totalGST = 0;

        payments.forEach(p => {
            if (!p.paymentDate) return;
            const pd = new Date(p.paymentDate);
            if (pd.getFullYear() === parseInt(yearVar) && (pd.getMonth() + 1) === parseInt(monthVar)) {
                totalGST += parseFloat(p.gstAmount || p.gst || 0);
            }
        });

        if (totalGST === 0) {
            if (!confirm("Total GST collected for this month is 0. Do you still want to generate the form?")) return;
        }

        // 3. Format Strings
        // Logic Update: Month & Year should be the CURRENT generation month/year, not the selected report month.
        const today = new Date();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const periodStr = `${monthNames[today.getMonth()]}-${today.getFullYear()}`;

        // Amount in Words
        const amtInt = Math.floor(totalGST);
        const amtWords = ReceiptModule.numberToWords(amtInt) + " Only";

        // Under Rupees Amount (Net + 1)
        const underRupeesVal = amtInt + 1;
        const underRupeesWords = ReceiptModule.numberToWords(underRupeesVal);

        const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;


        // 4. Construct HTML Template
        const styles = `
            <style>
                @page { size: A4; margin: 0.5in; }
                body { font-family: 'Arial Narrow', Arial, sans-serif; font-size: 10pt; color: #000; box-sizing: border-box; }
                .page-box { 
                    border: 3px solid #000; 
                    padding: 5px; 
                    height: 900px; /* Aggressively reduced to 850px to force 2 pages */
                    position: relative; 
                    display: flex;
                    flex-direction: column;
                    page-break-inside: avoid;
                    margin-left: 30px; 
                }
                .header { text-align: center; font-weight: bold; margin-bottom: 1px; }
                .sub-header { text-align: center; font-size: 9pt; margin-bottom: 10px; }
                table.bordered { 
                    width: 100%; 
                    border-collapse: collapse; 
                    border: 2px solid #000; 
                }
                table.bordered td, table.bordered th { 
                    border: 1px solid #000; 
                    padding: 4px; 
                    vertical-align: middle;
                }
                .box-input {
                    border: 1px solid #000;
                    height: 20px;
                    width: 100%;
                    display: block;
                }
                .account-boxes td { text-align: center; width: 30px; }
                
                .watermark {
                    position: absolute;
                    top: 40%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80pt;
                    color: rgba(0, 0, 0, 0.05);
                    z-index: -1;
                    font-weight: bold;
                }
                .vertical-text {
                    position: absolute;
                    left: -25px; /* Decreased space: Moved closer to border */
                    top: 50%;
                    transform: translate(-50%, -50%) rotate(-90deg);
                    transform-origin: center center;
                    font-weight: bold;
                    font-size: 12pt;
                    white-space: nowrap;
                    z-index: 10;
                    color: #d00;
                    text-transform: uppercase;
                    width: 600px; 
                    text-align: center;
                }

                /* Body Text Compact Styles */
                .body-text-section {
                    border: 2px solid #000; 
                    border-top: 0; 
                    padding: 5px; /* Reduced from 10px */
                    flex: 1; 
                    display: flex; 
                    flex-direction: column;
                }
            </style>
        `;

        const html = `
            <html>
            <head>
                <title>TSTC Form-58 - ${periodStr}</title>
                ${styles}
            </head>
            <body>
            
            <!-- FRONT PAGE -->
            <div class="page-box" style="margin-top: 70px;">
                <!-- Vertical Text -->
                <div class="vertical-text">
                    ( Under Rupees ${underRupeesWords} Only )
                </div>

                <!-- Top Right Refs -->
                <div style="position: absolute; top: -55px; right: 0; display: flex; gap: 0;">
                    <div style="border: 1px solid #000; padding: 5px; width: 100px; height: 30px; font-size: 11px; font-weight: bold;">VR No:</div>
                    <div style="border: 1px solid #000; border-left: 0; padding: 5px; width: 100px; height: 30px; font-size: 11px; font-weight: bold;">Dt:</div>
                </div>

                <div class="header" style="font-size: 14pt; text-decoration: underline; margin-top: 10px;">GOVERNMENT OF TELANGANA STATE</div>
                <div class="header">( TSTC Form - 58 )</div>
                <div class="sub-header">[ FULLY VOUCHED CONTINGENT BILL ]</div>

                <div style="text-align: center; font-size: 10pt;">
                    For the Month & Year : 
                    <span style="border: 1px solid #000; padding: 2px 10px; font-weight: bold; margin-left: 5px;">${periodStr}</span>
                </div>

                <div style="margin-top: 10px;">
                    <table class="bordered">
                        <tr>
                            <td style="width: 15%;">District :</td>
                            <td style="width: 35%; text-align: center; font-weight: bold;">Siddipet</td>
                            <td colspan="2" style="font-size: 9pt; text-align: center; background: #eee;">For Treasury use Only</td>
                        </tr>
                        <tr>
                            <td>Online No. :</td>
                            <td></td>
                            <td style="width: 15%;">Date :</td>
                            <td style="width: 35%;"></td>
                        </tr>
                         <tr>
                            <td>DDO's T.B.R.No.</td>
                            <td></td>
                            <td>Trans ID :-</td>
                            <td></td>
                        </tr>
                         <tr>
                            <td>Date :</td>
                            <td style="text-align: center;">${dateStr}</td>
                            <td colspan="2"></td>
                        </tr>
                    </table>
                </div>

                <!-- Main Grid -->
                <!-- Reduced height of spacers in Main Grid to compact it -->
                <div style="margin-top: 5px; display: flex; border: 2px solid #000; border-top: 0;">
                    <!-- LEFT COLUMN -->
                    <div style="width: 50%; border-right: 2px solid #000; padding: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                             <tr>
                                <td style="padding: 2px 0;">TREASURY / PAQ CODE</td>
                                <td> <div class="box-input"></div> </td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <tr>
                                <td>DDO Code:</td>
                                <td style="text-align: center; font-weight: bold; font-size: 12pt; border: 2px solid #000; padding: 2px;">18011802004</td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <tr>
                                <td>DDO Designation:</td>
                                <td style="text-align: center; font-weight: bold; border-bottom: 1px solid #000;">Vice Chairman</td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <tr>
                                <td>DDO, Office Name:</td>
                                <td style="text-align: center; font-weight: bold; border: 2px solid #000; padding: 4px;">SUDA</td>
                            </tr>
                            <tr><td colspan="2" style="height: 8px;"></td></tr>
                             <tr>
                                <td style="width: 40%;">Bank Branch Code</td>
                                <td> <div class="box-input"></div> </td>
                            </tr>
                             <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <tr>
                                <td>Bank Branch Name:</td>
                                <td> <div class="box-input"></div> </td>
                            </tr>
                        </table>
                    </div>

                    <!-- RIGHT COLUMN (HEADS) -->
                     <div style="width: 50%; padding: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <!-- Major Head -->
                            <tr>
                                <td style="width: 40%">Major Head</td>
                                <td> 
                                    <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                    </div>
                                </td>
                            </tr>
                             <tr><td colspan="2" style="height: 2px;"></td></tr>
                              <!-- Sub Major Head -->
                            <tr>
                                <td>Sub - Major Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:100px; height:20px; margin-left: 10px;"></div>
                                    </div>
                                </td>
                            </tr>
                             <tr><td colspan="2" style="height: 2px;"></td></tr>
                            <!-- Minor Head -->
                            <tr>
                                <td>Minor Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                            <!-- Group Sub Head -->
                             <tr>
                                <td>Group Sub - Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:100px; height:20px; margin-left: 10px;"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <!-- Sub Head -->
                             <tr>
                                <td>Sub - Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:100px; height:20px; margin-left: 10px;"></div>
                                    </div>
                                </td>
                            </tr>
                             <tr><td colspan="2" style="height: 2px;"></td></tr>
                              <!-- Detailed Head -->
                             <tr>
                                <td>Detailed Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:2px solid #000; width:100px; height:30px; margin-left: 10px; font-weight: bold; font-size: 8px; text-align: center; display: flex; align-items: center; justify-content: center;">Remittance of<br>RENT-GST</div>
                                    </div>
                                </td>
                            </tr>
                            <tr><td colspan="2" style="height: 2px;"></td></tr>
                             <!-- Sub Detailed Head -->
                             <tr>
                                <td>Sub - Detailed Head</td>
                                <td>
                                     <div style="display:flex; gap:2px;">
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:20px; height:20px;"></div>
                                        <div style="border:1px solid #000; width:100px; height:20px; margin-left: 10px;"></div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                     </div>
                </div>

                 <!-- Non Plan Row -->
                <div style="display: flex; border: 2px solid #000; border-top: 0; padding: 5px; align-items: center;">
                    <div style="margin-right: 10px;">Non-Plan - N / Plan - P</div>
                    <div style="border: 1px solid #000; width: 40px; height: 20px; margin-right: 20px;"></div>
                    
                    <div style="margin-right: 10px;">Charged - C / Voted - V</div>
                    <div style="border: 1px solid #000; width: 40px; height: 20px; margin-right: 20px;"></div>
                    
                    <div style="margin-right: 10px; font-size: 8pt;">Contingency Fund MH /<br>Service Major Head</div>
                     <div style="display:flex;">
                         <div style="border:1px solid #000; width:20px; height:20px;"></div>
                         <div style="border:1px solid #000; width:20px; height:20px;"></div>
                         <div style="border:1px solid #000; width:20px; height:20px;"></div>
                         <div style="border:1px solid #000; width:20px; height:20px;"></div>
                    </div>
                </div>

                <!-- Amounts -->
                 <div style="display: flex; border: 2px solid #000; border-top: 0; padding: 5px; font-weight: bold; font-size: 11pt; justify-content: space-around;">
                    <div>Gross &nbsp;&nbsp; ₹ &nbsp;&nbsp; ${totalGST.toFixed(2)}</div>
                    <div>Deduction &nbsp;&nbsp; ₹ &nbsp;&nbsp; 0.00</div>
                    <div>Net &nbsp;&nbsp; ₹ &nbsp;&nbsp; ${totalGST.toFixed(2)}</div>
                </div>

                <!-- Words -->
                 <div style="border: 2px solid #000; border-top: 0; padding: 5px; text-align: center; font-weight: bold; font-style: italic;">
                    ( Passed For Rupees ${amtWords.toLowerCase()} )
                </div>

                <!-- Body Text -->
                <!-- Applied compact styling class -->
                <div class="body-text-section">
                     <div style="margin-bottom: 10px;">
                        in favor of <span style="font-weight: bold; text-decoration: underline;">GST Department</span> by <span style="text-decoration: line-through;">Cash</span> / Cheque / <span style="text-decoration: line-through;">Draft</span> / <span style="text-decoration: line-through;">Account Credit</span>
                     </div>
                     
                     <div style="margin-bottom: 20px;">
                        Received Amount &nbsp;&nbsp; ₹
                     </div>

                     <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <div>Drawing Officer</div>
                        <div>Drawing Officer</div>
                     </div>

                     <hr style="border-top: 2px solid #000; margin: 10px 0;">

                     <div style="text-align: center; font-weight: bold; font-size: 9pt; margin-bottom: 5px;">FOR USE IN TREASURY / PAY & ACCOUNTS OFFICE ONLY</div>
                     
                     <div style="line-height: 1.6; font-size: 9pt;">
                        Pay ₹................................ (Rupees...........................................................................................................
                        ................................................ Only) by <span style="text-decoration: line-through;">Cash</span> / Cheque / <span style="text-decoration: line-through;">Draft</span> / <span style="text-decoration: line-through;">Account Credit</span> as under and Rs............
                         (Rupees..........................................................Only) by adjustment.
                     </div>

                     <div style="margin-top: 10px; margin-left: 40%; font-size: 9pt;">
                        1. ₹....................... by transfer credit to the S.B.<br>
                        Accounts of the employee (As per Annexure - 1)<br><br>
                        
                        2. ₹....................... by transfer credit to the D.D.O. Account<br>
                        towards Non - Government deductions.
                     </div>

                     <div style="margin-top: 15px; text-align: right; font-weight: bold;">
                        Treasury Officer / Pay & Accounts Officer
                     </div>
                </div>

                <!-- Watermark Text -->
                <div style="position: absolute; bottom: 5px; right: 5px; font-size: 8px;">Generated by ShopLease Manager</div>
            </div>


             <!-- BACK PAGE with Page Break Before -->
            <div class="page-box" style="page-break-before: always;">
                <div style="text-align: center; font-weight: bold; font-size: 12pt; text-decoration: underline; margin-bottom: 5px;">
                    PARTICULARS OF AMOUNT CLAIMED IN THIS BILL
                </div>

                 <table class="bordered" style="width: 100%; height: 400px;">
                    <thead>
                        <tr>
                            <th style="width: 10%;">No. & Discription of Sub Voucher</th>
                            <th>Details of expenditure and authority for sanction, drawal of amount</th>
                            <th style="width: 20%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="vertical-align: top;">
                            <td style="vertical-align: top; text-align: center; padding-top: 20px;">1</td>
                            <td style="vertical-align: top; padding-top: 20px; padding-left: 20px; padding-right: 20px;">
                                Pay towards remittance of GST Amount received from the<br>
                                Rent Amount paid by the SUDA Commercial Shops Lesse
                                <br><br>
                                <!-- Removed empty rectangle as per request -->
                            </td>
                            <td style="vertical-align: top; text-align: center; font-weight: bold; padding-top: 20px;">
                                ₹ ${totalGST.toFixed(2)}
                                <div style="width: 1px; height: 200px; background: #000; transform: rotate(15deg); margin: 20px auto;"></div>
                            </td>
                        </tr>
                        <tr style="height: 30px;">
                            <td></td>
                            <td style="text-align: center; font-weight: bold;">Total</td>
                            <td style="text-align: center; font-weight: bold;">₹ ${totalGST.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 10px; font-weight: bold;">
                    ( Rupees ${amtWords.toLowerCase()} )
                </div>

                <div style="text-align: right; margin-top: 40px; margin-right: 20px; font-weight: bold; font-size: 9pt;">
                    Drawing Officer
                </div>


                <div style="text-align: center; margin-top: 20px; text-decoration: underline; font-weight: bold;">
                    Non-Drawal certificate
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 10pt;">
                    This is to certify that the amount claimed in this bill was<br>
                    Neither claimed nor drawn previously.
                </div>

                 <div style="text-align: right; margin-top: 40px; margin-right: 20px; font-weight: bold; font-size: 9pt;">
                    Drawing Officer
                </div>

                 <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 20px; padding: 5px;">
                    <div style="text-align: center; font-weight: bold; text-decoration: underline;">BUDGET PARTICULARS</div>
                    <div style="margin-top: 10px; font-size: 10pt; line-height: 1.5;">
                        1 Budget alloted for the financial year-<br>
                        2 contains this bill with expenditure<br>
                        3 Balance
                    </div>
                 </div>

                 <div style="text-align: right; margin-top: 40px; margin-right: 20px; font-weight: bold; font-size: 9pt;">
                    Drawing Officer
                </div>

                 <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
                    <div style="text-align: center; font-weight: bold; text-decoration: underline;">ACCOUNTANT GENERAL OFFICE USE</div>
                    <div style="height: 50px;"></div> 
                 </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
            </body>
            </html>
        `;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
        } else {
            alert("Please allow popups to generate the print window.");
        }
    }
};



// ==========================================
// RECEIPT MODULE
// ==========================================
const ReceiptModule = {
    printReceipt(payment, applicant) {
        if (!payment || !applicant) return;

        // 1. Prepare Data
        // Fix: timestamp might have a suffix like "-0" (e.g. 2024-03-20T10:00:00.000Z-0) which breaks Date parsing
        let validTs = payment.timestamp;
        if (typeof validTs === 'string' && validTs.includes('Z-')) {
            validTs = validTs.split('Z-')[0] + 'Z';
        }

        const dateObj = new Date(validTs);

        // Fix: Logic for uniqueSuffix was grabbing ISO time parts (e.g. 05T12:00:00).
        // For legacy payments without receiptId, generate a DETERMINISTIC suffix from timestamp
        let uniqueSuffix = payment.timestamp.split('-').pop();
        if (uniqueSuffix.length > 5 || uniqueSuffix.includes(':') || uniqueSuffix.includes('T')) {
            // Use a hash of the full timestamp to generate a deterministic 3-digit suffix
            // This ensures the same receipt ID is generated every time for the same payment
            const hash = payment.timestamp.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            uniqueSuffix = (Math.abs(hash) % 1000).toString().padStart(3, '0');
        }

        // Use stored immutable ID if available, else fallback to generated
        const receiptNo = payment.receiptId || `REC-${!isNaN(dateObj.getTime()) ? dateObj.getTime().toString().slice(-6) : 'GEN'}-${uniqueSuffix}`;
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Invalid Date';
        const amount = parseFloat(payment.grandTotal).toFixed(2);
        const amountWords = this.numberToWords(Math.floor(parseFloat(payment.grandTotal)));

        // Fetch Logo
        const settings = Store.getSettings();
        const logoUrl = settings.logoUrl;
        const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; display: block; margin: 0 auto 10px;">` : '';

        // Format Payment Date to DD-MM-YYYY
        let pDateDisplay = dateStr;
        if (payment.paymentDate) {
            const [y, m, d] = payment.paymentDate.split('-');
            if (y && m && d) pDateDisplay = `${d}-${m}-${y}`;
        }

        // 2. Interactive Template
        const content = `
            <div style="padding: 2rem; max-width: 800px; margin: 0 auto; border: 2px solid #333; position: relative;">
                <!-- Header -->
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    ${logoHtml}
                    <h2 style="margin: 0; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 1px;">Siddipet Urban Development Authority</h2>
                    <p style="margin: 5px 0 0; font-size: 1rem; font-weight: 500;">Commercial Shop Lease - Payment Receipt</p>
                </div>

                <!-- Meta -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; font-size: 1.1rem;">
                    <div><strong>Receipt No:</strong> ${receiptNo}</div>
                    <div><strong>Date:</strong> ${dateStr}</div>
                </div>

                <!-- Body -->
                <div style="font-size: 1.1rem; line-height: 1.6;">
                    <p>Received with thanks from <strong>${applicant.applicantName}</strong>,</p>
                    <p>Tenant of Shop No: <strong>${applicant.shopNo}</strong></p>
                    <p>A sum of Rupees <strong>${amountWords} Only</strong> (₹${amount})</p>
                    <p>Towards Rent for the period of: <strong>${payment.paymentForMonth}</strong></p>
                    
                    <div style="margin-top: 2rem; border: 1px solid #ccc; padding: 1rem; background: #f9fafb;">
                        <strong>Payment Details:</strong><br>
                        Payment Date: ${pDateDisplay} <br>
                        Mode: <span style="text-transform: capitalize;">${payment.paymentMethod}</span><br>
                        ${this.getRefDetails(payment)}
                    </div>
                </div>

                <!-- Footer -->
                <div style="margin-top: 4rem; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="font-size: 0.9rem; color: #666;">
                        Generated via ShopLease Manager<br>
                        Timestamp: ${!isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : 'Invalid Timestamp'}
                    </div>
                    <div style="text-align: center;">
                        <div style="height: 50px;"></div> <!-- Signature Space -->
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px; font-weight: bold;">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        `;

        // 3. Print Window
        const w = window.open('', '_blank');
        w.document.write(`
            <!doctype html>
            <html>
            <head>
                <title>Print Receipt - ${receiptNo}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; color: #000; padding: 20px; }
                    @page { size: A4; margin: 10mm; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                ${content}
                <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
            </body>
            </html>
        `);
        w.document.close();
    },

    getRefDetails(p) {
        if (p.paymentMethod === 'cash') return `Receipt Ref: ${p.receiptNo || '-'}`;
        if (p.paymentMethod === 'dd-cheque') return `DD/Cheque No: ${p.ddChequeNo || '-'} (Date: ${p.ddChequeDate})`;
        if (p.paymentMethod === 'online') return `Transaction ID: ${p.transactionNo || '-'}`;
        return '';
    },

    numberToWords(n) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (n === 0) return 'Zero';

        const convertLess1000 = (num) => {
            if (num < 20) return ones[num];
            const d = num % 10;
            const t = Math.floor(num / 10);
            return tens[t] + (d > 0 ? ' ' + ones[d] : '');
        };

        // Simple implementation for receipts up to Lakhs
        let output = '';
        if (n >= 100000) {
            output += convertLess1000(Math.floor(n / 100000)) + ' Lakh ';
            n %= 100000;
        }
        if (n >= 1000) {
            output += convertLess1000(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }
        if (n >= 100) {
            output += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n > 0) {
            output += convertLess1000(n);
        }

        return output;
    }
};

window.ReceiptModule = ReceiptModule;
window.GstMonthwiseReportModule = GstMonthwiseReportModule;

// ==========================================
// PAYMENT REPORT MODULE (Moved from app.js)
// ==========================================
const PaymentReportModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Monthly Payment Reports</h3>
                    <div style="display: flex; gap: 0.5rem;">
                         <button class="btn-primary" id="btn-export-report" style="background: #059669;">Export to Excel</button>
                         <button class="btn-primary" id="btn-print-report" style="background: #64748b;">Print Report</button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Month Paid For</th>
                                <th>Date Paid</th>
                                <th>Shop No</th>
                                <th>Rent (Base)</th>
                                <th>GST (18%)</th>
                                <th>Penalty</th>
                                <th>Total Paid</th>
                                <th>Payment Method</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="report-list-body">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
                
                <div id="report-summary" style="margin-top: 2rem; text-align: right; font-weight: 600;">
                    <!-- Totals -->
                </div>
            </div>
        `;

        // Event Delegation for Delete Payment
        const wrapper = container.querySelector('.glass-panel');
        wrapper.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-pay')) {
                const btn = e.target.closest('.btn-delete-pay');
                const ts = btn.dataset.ts; // timestamp as ID
                if (confirm('Delete this payment record? This will reopen the month for payment.')) {
                    Store.deletePayment(ts);
                    this.renderReport();
                }
            }
        });

        // Print Report Handler
        const printBtn = document.getElementById('btn-print-report');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printReport();
            });
        }

        // Export Report Handler
        const exportBtn = document.getElementById('btn-export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }

        this.renderReport();
    },

    exportReport() {
        const payments = Store.getPayments();

        // Sort by date descending (same as display)
        payments.sort((a, b) => new Date(b.paymentDate || '') - new Date(a.paymentDate || ''));

        // Build CSV data
        let csv = [];
        csv.push([
            'Month Paid For',
            'Date Paid',
            'Shop No',
            'Rent (Base)',
            'GST (18%)',
            'Penalty',
            'Total Paid',
            'Payment Method',
            'Payment Details'
        ]);

        let totalCollected = 0;
        let totalBaseRent = 0;
        let totalGST = 0;
        let totalPenalty = 0;

        payments.forEach(p => {
            const rentAmount = Utils.getPaymentBaseRent(p);
            const gstAmount = Utils.getPaymentGST(p);
            const penalty = Utils.parseNumber(p.penalty);
            const grandTotal = Utils.getPaymentTotal(p);

            totalCollected += grandTotal;
            totalBaseRent += rentAmount;
            totalGST += gstAmount;
            totalPenalty += penalty;

            // Format payment method details
            let paymentMethodText = '';
            let paymentDetailsText = '';
            if (p.paymentMethod === 'cash') {
                paymentMethodText = 'Cash';
                // For cash, try manual receiptNo first, then fall back to receiptId
                paymentDetailsText = p.receiptNo || p.receiptId || '';
            } else if (p.paymentMethod === 'dd-cheque') {
                paymentMethodText = 'DD/Cheque';
                paymentDetailsText = `${p.ddChequeNo || ''} (${p.ddChequeDate || ''})`;
            } else if (p.paymentMethod === 'online') {
                paymentMethodText = 'Online';
                paymentDetailsText = p.transactionNo || '';
            }

            csv.push([
                p.paymentForMonth || '',
                p.paymentDate || '',
                p.shopNo || '',
                rentAmount.toFixed(2),
                gstAmount.toFixed(2),
                penalty > 0 ? penalty.toFixed(2) : '',
                grandTotal.toFixed(2),
                paymentMethodText,
                paymentDetailsText
            ]);
        });

        // Add summary rows
        csv.push([]); // Blank row
        csv.push(['TOTALS']);
        csv.push(['Total Base Rent', '', '', totalBaseRent.toFixed(2)]);
        csv.push(['Total GST Collected', '', '', totalGST.toFixed(2)]);
        csv.push(['Total Penalties', '', '', totalPenalty.toFixed(2)]);
        csv.push(['Grand Total', '', '', totalCollected.toFixed(2)]);

        // Convert to CSV string
        const csvContent = csv.map(row =>
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const str = String(cell || '');
                return '"' + str.replace(/"/g, '""') + '"';
            }).join(',')
        ).join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Payment_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    printReport() {
        // Get all elements that shouldn't print
        const hiddenElements = [];
        const selectors = ['nav', '.sidebar', '.nav-btn', '.navbar', 'header', '.navigation'];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                hiddenElements.push({
                    element: el,
                    display: el.style.display,
                    visibility: el.style.visibility
                });
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            });
        });

        // Hide delete buttons
        document.querySelectorAll('.btn-delete-pay').forEach(btn => {
            hiddenElements.push({
                element: btn,
                display: btn.style.display,
                visibility: btn.style.visibility
            });
            btn.style.display = 'none';
        });

        // Force body to not have padding/margin that causes blank pages
        const origBodyStyle = document.body.style.cssText;
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Trigger print after a very short delay
        setTimeout(() => {
            window.print();

            // Restore elements immediately
            setTimeout(() => {
                hiddenElements.forEach(item => {
                    item.element.style.display = item.display;
                    item.element.style.visibility = item.visibility;
                });
                document.body.style.cssText = origBodyStyle;
            }, 100);
        }, 50);
    },


    renderReport() {
        const payments = Store.getPayments();
        const tbody = document.getElementById('report-list-body');
        const summary = document.getElementById('report-summary');

        // Sort by date descending
        payments.sort((a, b) => new Date(b.paymentDate || '') - new Date(a.paymentDate || ''));

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">No payment records found.</td></tr>';
            return;
        }

        // Helper to format payment method details
        const formatPaymentMethod = (p) => {
            if (!p.paymentMethod) return '-';
            if (p.paymentMethod === 'cash') {
                return `Cash<br><small style="color: #475569;">${p.receiptNo || p.receiptId || ''}</small>`;
            }
            if (p.paymentMethod === 'dd-cheque') {
                return `DD/Cheque<br><small style="color: #475569;">${p.ddChequeNo || ''} (${p.ddChequeDate || ''})</small>`;
            }
            if (p.paymentMethod === 'online') {
                return `Online<br><small style="color: #475569;">${p.transactionNo || ''}</small>`;
            }
            return '-';
        };

        let totalCollected = 0;
        let totalBaseRent = 0;
        let totalGST = 0;
        let totalPenalty = 0;

        tbody.innerHTML = payments.map(p => {
            const rentAmount = Utils.getPaymentBaseRent(p);
            const gstAmount = Utils.getPaymentGST(p);
            const penalty = Utils.parseNumber(p.penalty);
            const grandTotal = Utils.getPaymentTotal(p);

            totalCollected += grandTotal;
            totalBaseRent += rentAmount;
            totalGST += gstAmount;
            totalPenalty += penalty;

            return `
                <tr>
                    <td><strong>${p.paymentForMonth || '-'}</strong></td>
                    <td>${p.paymentDate || '-'}</td>
                    <td><strong>${p.shopNo}</strong></td>
                    <td>${Utils.formatCurrency(rentAmount)}</td>
                    <td>${Utils.formatCurrency(gstAmount)}</td>
                    <td style="color: ${penalty > 0 ? '#ef4444' : 'inherit'};">${penalty > 0 ? Utils.formatCurrency(penalty) : '-'}</td>
                    <td style="font-weight: 500; color: #047857;">${Utils.formatCurrency(grandTotal)}</td>
                    <td style="font-size: 0.9rem;">${formatPaymentMethod(p)}</td>
                    <td>
                        <button class="btn-delete-pay" data-ts="${p.timestamp}" style="background:none; border:none; cursor:pointer;" title="Delete Payment">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        summary.innerHTML = `
            <div style="font-size: 1.1rem; line-height: 1.6;">
                <div>Total Base Rent: <strong>${Utils.formatCurrency(totalBaseRent)}</strong></div>
                <div>Total GST Collected: <strong>${Utils.formatCurrency(totalGST)}</strong></div>
                <div>Total Penalties: <span style="color: #ef4444;">${Utils.formatCurrency(totalPenalty)}</span></div>
                <hr style="margin: 0.5rem 0; opacity: 0.3;">
                <div style="font-size: 1.3rem;">Grand Total: <span style="color: #047857;">${Utils.formatCurrency(totalCollected)}</span></div>
            </div>
        `;
    }
};

window.PaymentReportModule = PaymentReportModule;

// ==========================================
// WAIVER MODULE
// ==========================================
const WaiverModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                <h3>Penalty Waiver Management</h3>
                <div style="margin-top: 1.5rem; display: flex; gap: 2rem;">
                    <!-- LEFT: Form -->
                    <div style="flex: 1; border-right: 1px solid #e2e8f0; padding-right: 2rem;">
                         <h4 style="margin-bottom: 1rem; color: #475569;">Record New Waiver</h4>
                         <form id="waiver-form">
                            <div class="form-group">
                                <label class="form-label">Shop No</label>
                                <select id="waiver-shop" class="form-select" required>
                                    <option value="">-- Select Shop --</option>
                                    <!-- Populated JS -->
                                </select>
                            </div>
                             <div class="form-group">
                                <label class="form-label">For Month(s)</label>
                                <input type="month" id="waiver-month" class="form-input" required>
                                <div id="waiver-calc-preview" style="margin-top:5px; font-weight:bold; color:#ef4444; font-size:0.9rem; display:none;">
                                    Est. Penalty: <span id="waiver-est-amt">0</span>
                                </div>
                                <small style="color:var(--text-muted)">The theoretical penalty for this month will be waived.</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Authorized By</label>
                                <input type="text" id="waiver-auth" class="form-input" placeholder="e.g. VC Sir / Joint Commissioner" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Reason / Reference</label>
                                <textarea id="waiver-reason" class="form-input" rows="3" placeholder="Reference note number..." required></textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width:100%; margin-top:1rem;">Approve Waiver</button>
                         </form>
                    </div>

                    <!-- RIGHT: List -->
                    <div style="flex: 1.5;">
                        <h4 style="margin-bottom: 1rem; color: #475569;">Waiver History</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Month</th>
                                    <th>Auth. By</th>
                                    <th>Reason</th>
                                    <th>Approx. Amount</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="waiver-list-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.populateShops();
        this.renderHistory();

        // Listeners for calc
        const updateCalc = () => {
            const s = document.getElementById('waiver-shop').value;
            const m = document.getElementById('waiver-month').value;
            const p = document.getElementById('waiver-calc-preview');
            const v = document.getElementById('waiver-est-amt');

            if (s && m) {
                const amt = this.calculatePenaltyForDisplay(s, m);
                v.textContent = Utils.formatCurrency(amt);
                p.style.display = 'block';
            } else {
                p.style.display = 'none';
            }
        };

        document.getElementById('waiver-shop').addEventListener('change', updateCalc);
        document.getElementById('waiver-month').addEventListener('change', updateCalc);

        document.getElementById('waiver-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    },

    populateShops() {
        const select = document.getElementById('waiver-shop');
        const shops = Store.getShops(); // or Store.getApplicants to show names
        const applicants = Store.getApplicants();

        // Show only active applicants
        applicants.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.shopNo;
            opt.textContent = `${app.shopNo} - ${app.applicantName}`;
            select.appendChild(opt);
        });
    },

    async handleSave() {
        const shopNo = document.getElementById('waiver-shop').value;
        const monthVal = document.getElementById('waiver-month').value; // YYYY-MM
        const auth = document.getElementById('waiver-auth').value;
        const reason = document.getElementById('waiver-reason').value;

        if (!shopNo || !monthVal) {
            alert("Please select Shop and Month");
            return;
        }

        // Show loading state
        const btn = document.querySelector('#waiver-form button[type="submit"]');
        const origText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        const record = {
            id: Date.now().toString(),
            shopNo,
            month: monthVal, // "2024-05"
            authorizedBy: auth,
            reason: reason,
            amount: this.calculatePenaltyForDisplay(shopNo, monthVal), // Store snapshot of waived amount
            date: new Date().toISOString()
        };

        try {
            await Store.saveWaiver(record);
            alert("Waiver Recorded Successfully!");
            document.getElementById('waiver-form').reset();
            this.renderHistory();
        } catch (e) {
            console.error(e);
            alert("Failed to save waiver.");
        } finally {
            btn.textContent = origText;
            btn.disabled = false;
        }
    },

    renderHistory() {
        const tbody = document.getElementById('waiver-list-body');
        const waivers = Store.getWaivers();
        // sort desc
        waivers.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (waivers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No waivers recorded.</td></tr>';
            return;
        }

        tbody.innerHTML = waivers.map(w => `
            <tr>
                <td><strong>${w.shopNo}</strong></td>
                <td>${w.month}</td>
                <td>${w.authorizedBy}</td>
                <td style="font-size:0.9rem;">${w.reason}</td>
                <td style="font-size:0.8rem;">${w.amount ? Utils.formatCurrency(w.amount) : '-'}</td>
                <td style="font-size:0.8rem;color:#64748b">${new Date(w.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn-delete-waiver" data-id="${w.id}" style="color:red;border:none;background:none;cursor:pointer;">🗑️</button>
                </td>
            </tr>
        `).join('');

        // Attach Delete Listeners
        tbody.querySelectorAll('.btn-delete-waiver').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to deletion this waiver calculation?')) {
                    Store.deleteWaiver(id).then(() => this.renderHistory());
                }
            });
        });
    },

    calculatePenaltyForDisplay(shopNo, monthStr) {
        // Estimate the penalty for this month if it were unpaid
        const app = Store.getApplicants().find(a => String(a.shopNo) === String(shopNo));
        if (!app) return 0;

        // This is an estimation. Real penalty depends on dates. 
        // We assume approx 30 days of penalty ~ 1 month late? 
        // Or better: Just show "Penalty Waived".
        // User asked to "show the penalty amount upon selecting". 
        // Let's try to calculate it using the standard Rate.
        // Penalty = Days Late * Rate.
        // Late from WHEN? Usually from Due Date until Today (Waiver Date).

        const [y, m] = monthStr.split('-').map(Number);
        const dueDay = parseInt(app.paymentDay) || 5;
        const dueDate = new Date(y, m - 1, dueDay); // Due date of that month
        const today = new Date();

        if (today <= dueDate) return 0; // Not late yet? (Unlikely for waiver)

        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const rate = 15; // Standard Rate

        // Return calculated
        return diffDays * rate;
    }
};

window.WaiverModule = WaiverModule;