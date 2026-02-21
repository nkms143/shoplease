
// ==========================================
// SETTINGS MODULE
// ==========================================
const SettingsModule = {
    render(container) {

        const s = Store.getSettings();
        // --- PENALTY CONFIGURATION ---
        const penaltyRate = (s && s.penaltyRate) || 15;
        const penaltyDate = (s && s.penaltyDate) || '';

        // New Policy Fields
        const penaltyPolicyDate = (s && s.penaltyPolicyDate) || '2022-01-01';
        const penaltyMode = (s && s.penaltyMode) || 'MONTHLY'; // 'DAILY' or 'MONTHLY'
        const monthlyPenaltyRate = (s && s.monthlyPenaltyRate) || 500;

        container.innerHTML = `
            <div class="glass-panel" style="max-width: 600px; margin: 0 auto;">
                <h3 style="margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">⚙️ Application Settings</h3>
                
                <form id="settings-form">
                    
                <form id="settings-form">
                    
                    <!-- Penalty Rate History -->
                    <div style="background: #fdf2f8; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #fbcfe8;">
                         <h4 style="margin-top: 0; color: #be185d; margin-bottom: 1rem;">🛑 Penalty Rate History</h4>
                         <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">
                            Define penalty rates over time. The system picks the rate based on the effective date.
                            Default: ₹500/Month (from 2022-01-01).
                         </p>

                         <div class="table-container" style="background: white; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Effective Date</th>
                                        <th>Rate</th>
                                        <th>Mode</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="penalty-history-list">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                         </div>

                         <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                             <h5 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Add New Rate Slab</h5>
                             <div style="display: flex; gap: 0.5rem; align-items: end; flex-wrap: wrap;">
                                <div>
                                    <label class="form-label">Effective From</label>
                                    <input type="date" id="new-penalty-date" class="form-control">
                                </div>
                                 <div style="flex: 1; min-width: 120px;">
                                    <label class="form-label">Rate (₹)</label>
                                    <input type="number" id="new-penalty-rate" class="form-control" placeholder="e.g. 600">
                                </div>
                                <div style="min-width: 120px;">
                                    <label class="form-label">Mode</label>
                                    <select id="new-penalty-mode" class="form-select">
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="DAILY">Daily</option>
                                    </select>
                                </div>
                                <button type="button" onclick="SettingsModule.addPenaltyEntry()" class="btn-primary" style="margin-bottom: 1px; background: #be185d;">+ Add</button>
                             </div>
                         </div>
                    </div>

                    <!-- GST Rate History -->
                    <div style="background: #eff6ff; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #dbeafe;">
                         <h4 style="margin-top: 0; color: #1d4ed8; margin-bottom: 1rem;">🧾 GST Rate History</h4>
                         <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">
                            Define GST rates over time. The system applies the rate effective at the time of invoice/payment.
                            Default: 18%.
                         </p>

                         <div class="table-container" style="background: white; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Effective Date</th>
                                        <th>Rate (%)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="gst-history-list">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                         </div>

                         <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                             <h5 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Add New GST Rate</h5>
                             <div style="display: flex; gap: 0.5rem; align-items: end; flex-wrap: wrap;">
                                <div>
                                    <label class="form-label">Effective From</label>
                                    <input type="date" id="new-gst-date" class="form-control">
                                </div>
                                 <div style="flex: 1; min-width: 120px;">
                                    <label class="form-label">Rate (%)</label>
                                    <input type="number" id="new-gst-rate" class="form-control" placeholder="e.g. 18">
                                </div>
                                <button type="button" onclick="SettingsModule.addGstEntry()" class="btn-primary" style="margin-bottom: 1px; background: #1d4ed8;">+ Add</button>
                             </div>
                         </div>
                    </div>

                    <!-- Logo Configuration -->
                    <div style="background: #fff; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
                        <h4 style="margin-top: 0; color: #334155; margin-bottom: 1rem;">🖼️ Logo Settings</h4>
                        <div class="form-group" style="display: flex; gap: 1rem; align-items: start;">
                           <div style="border: 1px solid #cbd5e1; width: 150px; height: 100px; display: flex; align-items: center; justify-content: center; background: #f1f5f9;">
                                <img id="logo-preview" style="max-width: 100%; max-height: 100%; display: none;">
                                <span id="logo-placeholder" style="color: #94a3b8; font-size: 0.8rem;">No Logo</span>
                           </div>
                           <div style="flex: 1;">
                                <label class="form-label">Upload Logo</label>
                                <input type="file" id="logo-upload" class="form-control" accept="image/*">
                                <input type="hidden" id="set-logo-url"> 
                                <button type="button" id="btn-clear-logo" style="margin-top: 0.5rem; display: none; background: #ef4444; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">Remove Logo</button>
                           </div>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">💾 Save Settings</button>
                </form>

                <!-- Data Management -->
                <div style="margin-top: 3rem; border-top: 2px solid #e2e8f0; padding-top: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">💾 Data Management</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <button id="btn-backup" class="btn-primary" style="background: #3b82f6;">⬇️ Download Backup</button>
                        <button id="btn-restore" class="btn-primary" style="background: #8b5cf6;">⬆️ Restore Backup</button>
                        <button id="btn-cloud-backup" class="btn-primary" style="background: #0ea5e9;">☁️ Cloud Sync</button>
                    </div>
                    <input type="file" id="restore-file-input" style="display: none;" accept=".json">
                </div>

            </div>
        `;



        // Initialize/Load GST History
        SettingsModule.gstHistory = s && s.gstHistory ? s.gstHistory : [];

        // Load Logo
        if (s && s.logoUrl) {
            const preview = document.getElementById('logo-preview');
            const clearBtn = document.getElementById('btn-clear-logo');
            preview.src = s.logoUrl;
            preview.style.display = 'block';
            clearBtn.style.display = 'block';
        }

        // --- SAVE HANDLER ---
        const form = document.getElementById('settings-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get current settings to merge
                const currentFromStore = Store.getSettings() || {};

                const newSettings = {
                    ...currentFromStore,
                    // Remove deprecated fields logic -> We rely on penaltyHistory array in Store
                    // penaltyRate: document.getElementById('set-penalty-rate').value,
                    // penaltyDate: document.getElementById('set-penalty-date').value,
                    // penaltyPolicyDate: document.getElementById('set-policy-date').value,
                    // penaltyMode: document.getElementById('set-penalty-mode').value,
                    // monthlyPenaltyRate: document.getElementById('set-monthly-rate').value,

                    logoUrl: document.getElementById('set-logo-url').value,
                    gstHistory: SettingsModule.gstHistory
                };

                // Helper to save if logo is being uploaded (handled separately usually but ensuring consistency)
                if (SettingsModule.tempLogo !== undefined) {
                    if (SettingsModule.tempLogo === null) {
                        newSettings.logoUrl = '';
                    } else {
                        newSettings.logoUrl = SettingsModule.tempLogo;
                    }
                }

                await Store.saveSettings(newSettings);
                // ALSO Save Penalty History explicitly via Store (it might have been modified in UI)
                // Note: Penalty History is saved immediately on Add/Delete in this new UI logic, 
                // but if we wanted to batch save: Store.savePenaltyHistory(SettingsModule.penaltyHistory);
                // Here we assume immediate save for list items. 

                AppUI.success("Settings Saved Successfully!");
            });
        }


        // Migration: GST
        if ((!s || !s.gstHistory || s.gstHistory.length === 0) && s) {
            if (s.gstBaseRate) {
                SettingsModule.gstHistory.push({ date: '2018-01-01', rate: s.gstBaseRate });
            }
            if (s.gstNewRate && s.gstEffectiveDate) {
                SettingsModule.gstHistory.push({ date: s.gstEffectiveDate, rate: s.gstNewRate });
            }
            // Fallback
            if (SettingsModule.gstHistory.length === 0) {
                SettingsModule.gstHistory.push({ date: '2018-01-01', rate: 18 });
            }
        }

        SettingsModule.renderGstList();

        // Initial Render Penalty List
        SettingsModule.renderPenaltyList();

        // ----------------------------------------
        // Bind Logo Upload Events
        // ----------------------------------------
        const logoInput = document.getElementById('logo-upload');
        const clearLogoBtn = document.getElementById('btn-clear-logo');
        const logoPreview = document.getElementById('logo-preview');

        // Initialize Preview with current setting
        const currentSettings = Store.getSettings() || {};
        // Reset tempLogo on re-render
        SettingsModule.tempLogo = undefined;

        if (currentSettings.logoUrl) {
            logoPreview.src = currentSettings.logoUrl;
            logoPreview.style.display = 'block';
            clearLogoBtn.style.display = 'block';
            const placeholder = document.getElementById('logo-placeholder');
            if (placeholder) placeholder.style.display = 'none';

            // FIX: Restore existing URL to hidden input so it persists on save
            const hiddenUrl = document.getElementById('set-logo-url');
            if (hiddenUrl) hiddenUrl.value = currentSettings.logoUrl;
        }

        if (logoInput) {
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 500 * 1024) { // 500KB limit
                    AppUI.warn("File too large! Max 500KB.");
                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (ev) => {
                    SettingsModule.tempLogo = ev.target.result; // Base64 string
                    logoPreview.src = ev.target.result;
                    logoPreview.style.display = 'block';
                    clearLogoBtn.style.display = 'block';
                    const placeholder = document.getElementById('logo-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            });
        }

        if (clearLogoBtn) {
            clearLogoBtn.addEventListener('click', () => {
                SettingsModule.tempLogo = null;
                if (logoInput) logoInput.value = '';
                logoPreview.src = '';
                logoPreview.style.display = 'none';
                clearLogoBtn.style.display = 'none';
                const placeholder = document.getElementById('logo-placeholder');
                if (placeholder) placeholder.style.display = 'block';
            });
        }

        this.bindDataEvents();
    },

    // --- PENALTY HISTORY LOGIC ---
    renderPenaltyList() {
        // Direct access to Store cache for this list
        const history = Store.cache.penaltyHistory || [];
        const tbody = document.getElementById('penalty-history-list');
        if (!tbody) return;

        // Sort Descending
        history.sort((a, b) => new Date(b.effDate) - new Date(a.effDate));

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #94a3b8;">No history defined. Using Defaults.</td></tr>';
            return;
        }

        tbody.innerHTML = history.map((item, index) => `
            <tr>
                <td>${item.effDate}</td>
                <td>₹${item.rate}</td>
                <td>${item.mode}</td>
                <td style="text-align:right;">
                    <button onclick="SettingsModule.deletePenaltyEntry('${item.effDate}')" style="background:none; border:none; cursor:pointer; font-size:1.1rem;" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    addPenaltyEntry() {
        const date = document.getElementById('new-penalty-date').value;
        const rate = parseFloat(document.getElementById('new-penalty-rate').value);
        const mode = document.getElementById('new-penalty-mode').value;

        if (!date || isNaN(rate)) {
            AppUI.warn("Please enter valid Date and Rate.");
            return;
        }

        // Logic: Add to Store list
        const list = Store.cache.penaltyHistory || [];

        // Remove duplicate date if exists
        const existsRef = list.findIndex(i => i.effDate === date);
        if (existsRef > -1) {
            if (!confirm("A rate for this date already exists. Overwrite?")) return;
            list.splice(existsRef, 1);
        }

        list.push({ effDate: date, rate: rate, mode: mode });

        // Save
        Store.savePenaltyHistory(list);

        // Refresh
        document.getElementById('new-penalty-date').value = '';
        document.getElementById('new-penalty-rate').value = '';
        SettingsModule.renderPenaltyList();
    },

    deletePenaltyEntry(dateStr) {
        if (!confirm(`Delete penalty rate for ${dateStr}?`)) return;

        const list = Store.cache.penaltyHistory || [];
        const newList = list.filter(i => i.effDate !== dateStr);

        if (newList.length === 0) {
            // Prevent deleting the last one? Or auto-restore default?
            // Let's allow empty but warn. Actually Store handles empty fallback.
        }

        Store.savePenaltyHistory(newList);
        SettingsModule.renderPenaltyList();
    },
    // ----------------------------------------

    bindDataEvents() {
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
                AppUI.error('Backup Failed: ' + err.message);
                console.error(err);
            }
        });

        const btnCloud = document.getElementById('btn-cloud-backup');
        if (btnCloud) {
            btnCloud.addEventListener('click', async () => {
                const btn = document.getElementById('btn-cloud-backup');
                const origText = btn.innerHTML;
                try {
                    btn.disabled = true;
                    btn.innerHTML = '<span>⏳</span> Syncing...';
                    await Store.createCloudBackup();
                    AppUI.success("Cloud Backup Sync Successful!");
                } catch (e) {
                    console.error(e);
                    AppUI.error("Cloud Backup Failed: " + (e.message || "Unknown Error"));
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = origText;
                }
            });
        }

        const restoreBtn = document.getElementById('btn-restore');
        const fileInput = document.getElementById('restore-file-input');

        if (restoreBtn) restoreBtn.addEventListener('click', () => fileInput.click());

        if (fileInput) {
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
                        AppUI.success('Data restored successfully! The application will now reload.');
                        location.reload();
                    } catch (err) {
                        AppUI.error('Restore Failed: ' + err.message);
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            });
        }
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
        if (!d || !r) { AppUI.warn("Enter date and rate"); return; }

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
        // Redundant save handler (kept for robust compatibility if called directly)
        // Main logic is now in the form submit handler inside render()
        // But if this is called from console or elsewhere:
        const form = document.getElementById('settings-form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
};

// ==========================================
// NOTICE MODULE
// ==========================================
const NoticeModule = {
    normalizeID(id) {
        return Store.normalizeID(id);
    },

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
                                <th>Email Communication</th>
                            </tr>
                        </thead>
                        <tbody id="notice-list-body">
                             <tr><td colspan="10" style="text-align:center;">Click "Scan" to identify defaulters.</td></tr>
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
            const tenants = Store.getApplicants().filter(t => t.status !== 'Terminated' && t.email);
            const logs = await Store.getNoticeLogs();

            let candidates = [];
            for (const t of tenants) {
                const dues = Store.calculateOutstandingDues(t);
                if (dues.totalAmount > 0) {
                    const esc = this.getEscalationInfo(t.shopNo, logs, dues);
                    candidates.push({ tenant: t, dues, esc });
                }
            }

            if (candidates.length === 0) {
                AppUI.info("No late payment candidates found.");
                return;
            }

            // Create Review Modal
            const overlay = document.createElement('div');
            overlay.style = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;';

            let rows = '';
            candidates.forEach((c, i) => {
                const isSkipped = c.esc.tooRecent;
                const noEmail = !c.tenant.email;
                rows += `
                    <tr style="${isSkipped ? 'opacity: 0.5; background: #f8fafc;' : ''} ${noEmail ? 'background: #fff7ed;' : ''}">
                        <td style="padding: 10px;"><input type="checkbox" class="bulk-check" data-index="${i}" ${isSkipped || noEmail ? 'disabled' : 'checked'}></td>
                        <td style="padding: 10px;"><strong>${c.tenant.shopNo}</strong></td>
                        <td style="padding: 10px;">
                            ${c.tenant.applicantName}
                            ${noEmail ? '<span style="color:#f97316; font-size:0.7rem; display:block;">⚠️ No Email</span>' : ''}
                        </td>
                        <td style="padding: 10px;">₹${c.dues.totalAmount.toFixed(0)}</td>
                        <td style="padding: 10px; color: ${c.esc.color}; font-size: 0.8rem;">${c.esc.currentStatus}</td>
                        <td style="padding: 10px; font-size: 0.7rem; color: #ef4444;">
                            ${isSkipped ? 'Skip (Sent < 7d)' : (noEmail ? 'Skip (Need Manual Service)' : '')}
                        </td>
                    </tr>
                `;
            });

            overlay.innerHTML = `
                <div class="glass-panel" style="width: 100%; max-width: 600px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
                    <h3 style="margin-bottom: 5px;">Review Warnings</h3>
                    <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 20px;">Review and select tenants to receive automated warnings.</p>
                    
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead style="background: #f1f5f9; position: sticky; top: 0;">
                                <tr>
                                    <th style="padding: 10px; text-align: left;">Select</th>
                                    <th style="padding: 10px; text-align: left;">Shop</th>
                                    <th style="padding: 10px; text-align: left;">Tenant</th>
                                    <th style="padding: 10px; text-align: left;">Due</th>
                                    <th style="padding: 10px; text-align: left;">Status</th>
                                    <th style="padding: 10px; text-align: left;">Note</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>

                    <div style="margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="btn-bulk-cancel" class="btn-primary" style="background: #94a3b8;">Cancel</button>
                        <button id="btn-bulk-confirm" class="btn-primary" style="background: #4f46e5;">Send Selected Warnings</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelector('#btn-bulk-cancel').onclick = () => overlay.remove();
            overlay.querySelector('#btn-bulk-confirm').onclick = async () => {
                const checks = overlay.querySelectorAll('.bulk-check:checked');
                if (checks.length === 0) {
                    AppUI.warn("No tenants selected.");
                    return;
                }

                const confirmBtn = overlay.querySelector('#btn-bulk-confirm');
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Processing...';

                let sentCount = 0;
                for (const check of checks) {
                    const c = candidates[check.dataset.index];
                    try {
                        // Re-trigger the email logic for each selected tenant
                        // Since processLatePaymentWarnings in app.js is generic, 
                        // we can either call it with filters or implement local send here.
                        // For consistency, let's call NoticeModule's sendNoticeEmail directly.
                        await this.sendNoticeEmail(c.tenant.shopNo);
                        sentCount++;
                    } catch (e) {
                        console.error(e);
                    }
                }

                AppUI.success(`Bulk Batch Completed: ${sentCount} warnings sent.`);
                overlay.remove();
                this.scanDefaulters();
            };
        });
    },

    formatDateDMY(date) {
        if (!date) return '-';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    },

    getEscalationInfo(shopNo, logs, dues) {
        // Standardize comparison for shops like "01" vs "1"
        const normTarget = this.normalizeID(shopNo);

        // --- FIXED: Only count actual NOTICES (filter out Invoices, Receipts, etc) ---
        const shopNoticeLogs = logs.filter(l => {
            if (this.normalizeID(l.record_id) !== normTarget) return false;

            const isActuallyNotice = l.action_type === 'SEND_NOTICE' || l.action_type === 'SERVE_PHYSICAL';
            const isLegacyNotice = l.action_type === 'SEND_EMAIL' &&
                !String(l.description).includes('Invoice') &&
                !String(l.description).includes('Receipt');

            return isActuallyNotice || isLegacyNotice;
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLogs = shopNoticeLogs.filter(l => new Date(l.created_at) >= thirtyDaysAgo);
        const count = recentLogs.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const tooRecent = recentLogs.some(l => new Date(l.created_at) >= sevenDaysAgo);

        const isPenaltyOnly = (dues.baseRent + dues.gst) <= 0;

        let nextLevel = 1;
        let currentStatus = 'No Notice Sent';
        let color = '#64748b'; // Default Gray

        if (isPenaltyOnly) {
            nextLevel = 0; // Specialty level
            currentStatus = count > 0 ? 'Reminder Sent' : 'No Reminder';
            color = '#0ea5e9';
        } else if (count === 0) {
            nextLevel = 1;
            currentStatus = 'No Notice Sent';
            color = '#64748b';
        } else if (count === 1) {
            nextLevel = 2;
            currentStatus = '1st Notice Sent';
            color = '#f59e0b';
        } else if (count === 2) {
            nextLevel = 3;
            currentStatus = '2nd Notice Sent';
            color = '#f97316'; // Darker Orange
        } else {
            nextLevel = 3; // Stay at Final
            currentStatus = 'Final Notice Sent';
            color = '#ef4444';
        }

        return { nextLevel, currentStatus, color, count, tooRecent, isPenaltyOnly };
    },

    async scanDefaulters() {
        const applicants = Store.getApplicants();
        const tbody = document.getElementById('notice-list-body');
        const settings = Store.getSettings();
        const penaltyRate = parseFloat(settings.penaltyRate) || 15;
        const implementationDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
        const today = new Date();

        // Fetch logs for communication date
        const allLogs = await Store.getNoticeLogs();

        // ONLY count actual Notices for the status/escalation logic
        // We exclude Invoices and Receipts even if they use the old 'SEND_EMAIL' tag
        const noticeLogs = allLogs.filter(l => {
            const isActuallyNotice = l.action_type === 'SEND_NOTICE' || l.action_type === 'SERVE_PHYSICAL';
            const isLegacyNotice = l.action_type === 'SEND_EMAIL' &&
                !String(l.description).includes('Invoice') &&
                !String(l.description).includes('Receipt');
            return isActuallyNotice || isLegacyNotice;
        });

        const lastSentMap = {};
        noticeLogs.forEach(log => {
            const normSNo = this.normalizeID(log.record_id);
            if (!lastSentMap[normSNo]) {
                lastSentMap[normSNo] = this.formatDateDMY(log.created_at);
            }
        });

        // Helper to check dues
        let serial = 1;
        let html = '';

        applicants.forEach(app => {
            const dues = this.calculateApplicantDues(app, penaltyRate, implementationDate, today);

            if (dues.totalAmount > 0) {
                const esc = this.getEscalationInfo(app.shopNo, allLogs, dues);
                const lastSentDate = lastSentMap[this.normalizeID(app.shopNo)] || '-';

                // Count previous-lease months (if any)
                const prevCount = dues.details.filter(d => d.source === 'history').length;
                const monthsDisplay = prevCount > 0
                    ? `${dues.monthsCount} <span style="font-size:0.75rem; color:#6b7280; display:block;">(${prevCount} prev)</span>`
                    : String(dues.monthsCount);

                html += `
                    <tr>
                        <td>${serial++}</td>
                        <td>
                            <strong>${app.shopNo}</strong>
                            <button class="btn-history-notice" title="Communication History" 
                                style="background:none; border:none; cursor:pointer; font-size:1rem; padding:0; margin-left:5px;"
                                data-shop="${app.shopNo}">📜</button>
                        </td>
                        <td>${app.applicantName}</td>
                        <td style="text-align: center; font-weight: bold;">${monthsDisplay}</td>
                        <td>₹${dues.baseRent.toFixed(2)}</td>
                        <td>₹${dues.gst.toFixed(2)}</td>
                        <td style="color: #ef4444;">₹${dues.penalty.toFixed(2)}</td>
                        <td style="font-weight: bold;">₹${dues.totalAmount.toFixed(2)}</td>
                        <td style="display: flex; gap: 5px;">
                            <button class="btn-gen-notice btn-primary" style="padding: 4px 12px; font-size: 0.8rem;"
                                data-shop="${app.shopNo}">
                                Generate
                            </button>
                            <button class="btn-email-notice btn-primary" 
                                style="padding: 4px 12px; font-size: 0.8rem; background: ${esc.tooRecent ? '#94a3b8' : '#4f46e5'};"
                                data-shop="${app.shopNo}" ${esc.tooRecent ? 'disabled title="Wait 7 days between notices"' : ''}>
                                ${esc.tooRecent ? 'Sent ✉️' : '✉️ Email'}
                            </button>
                        </td>
                        <td id="comm-${app.shopNo}" style="font-size: 0.75rem;">
                            <span style="display: block; font-weight: bold; color: ${esc.color};">${esc.currentStatus}</span>
                            <span style="color: #64748b;">${lastSentMap[this.normalizeID(app.shopNo)] ? 'On: ' + lastSentMap[this.normalizeID(app.shopNo)] : ''}</span>
                        </td>
                    </tr>
                `;
            }
        });

        tbody.innerHTML = html || '<tr><td colspan="10" style="text-align:center; color:green;">No defaulters found!</td></tr>';

        // Attach Events
        const buttons = tbody.querySelectorAll('.btn-gen-notice');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.generateNotice(btn.dataset.shop);
            });
        });

        const emailButtons = tbody.querySelectorAll('.btn-email-notice');
        emailButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendNoticeEmail(btn.dataset.shop, btn);
            });
        });

        const historyButtons = tbody.querySelectorAll('.btn-history-notice');
        historyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showHistoryTimeline(btn.dataset.shop);
            });
        });
    },

    async showHistoryTimeline(shopNo) {
        const logs = await Store.getNoticeLogs();
        const normTarget = this.normalizeID(shopNo);
        const shopLogs = logs.filter(l => this.normalizeID(l.record_id) === normTarget).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        let rows = '';
        shopLogs.forEach(log => {
            let label = 'Email Sent';
            let color = '#6366f1'; // Default Indigo

            if (log.action_type === 'SERVE_PHYSICAL') {
                label = 'Physical Notice Served';
                color = '#10b981'; // Emerald
            } else if (log.action_type === 'SEND_NOTICE') {
                label = 'Email Notice Sent';
                color = '#4f46e5';
            } else if (log.action_type === 'SEND_RECEIPT') {
                label = 'Payment Receipt Sent';
                color = '#22c55e'; // Green
            } else if (log.action_type === 'SEND_WELCOME') {
                label = 'Welcome Email Sent';
                color = '#f59e0b'; // Amber
            } else if (log.action_type === 'SEND_INVOICE') {
                label = 'Monthly Invoice Sent';
                color = '#0ea5e9'; // Sky
            }

            rows += `
                <div style="border-left: 2px solid #e2e8f0; margin-left: 10px; padding-left: 15px; padding-bottom: 20px; position: relative;">
                    <span style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></span>
                    <strong style="display: block; font-size: 0.9rem;">${label}</strong>
                    <span style="font-size: 0.8rem; color: #64748b;">${this.formatDateDMY(log.created_at)}</span>
                </div>
            `;
        });

        if (rows === '') {
            rows = '<p style="text-align: center; color: #64748b;">No communication history found.</p>';
        }

        const overlay = document.createElement('div');
        overlay.style = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px);';
        overlay.innerHTML = `
            <div class="glass-panel" style="width: 100%; max-width: 400px; padding: 25px; position: relative; background: #fff;">
                <button id="close-history" style="position: absolute; right: 15px; top: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h3 style="margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">📋 History: Shop ${shopNo}</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${rows}
                </div>
                <div style="margin-top:20px; text-align:center; border-top:1px solid #eee; padding-top:15px;">
                    <button id="btn-clear-history" style="background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; padding:8px 15px; border-radius:4px; font-size:0.8rem; cursor:pointer;">
                        Clear All Communication Logs
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('#close-history').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const clearBtn = overlay.querySelector('#btn-clear-history');
        clearBtn.onclick = async () => {
            if (confirm(`Are you sure you want to clear all sent notice logs for Shop ${shopNo}? This will reset the escalation level to "1st Notice".`)) {
                clearBtn.disabled = true;
                clearBtn.textContent = 'Clearing...';
                const success = await Store.clearNoticeLogs(shopNo);
                if (success) {
                    AppUI.success('History cleared successfully. Please scan again to see changes.');
                    overlay.remove();
                    this.scanDefaulters();
                } else {
                    AppUI.error('Failed to clear history.');
                    clearBtn.disabled = false;
                    clearBtn.textContent = 'Clear All Communication Logs';
                }
            }
        };
    },

    async sendNoticeEmail(shopNo, btn = null, customHtml = null) {
        try {
            const normTarget = this.normalizeID(shopNo);
            const app = Store.getApplicants().find(a => this.normalizeID(a.shopNo) === normTarget);
            if (!app || !app.email) {
                AppUI.error('Error: Applicant or Email not found.');
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Sending...';
            }

            const settings = Store.getSettings();
            const impDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
            const dues = this.calculateApplicantDues(app, parseFloat(settings.penaltyRate) || 15, impDate, new Date());

            // 1. Determine Escalation from Logs
            const logs = await Store.getNoticeLogs();
            const esc = this.getEscalationInfo(app.shopNo, logs, dues);

            // 2. Prepare Subject and Wording
            let subject = `Notice: Rent Outstanding for Shop ${app.shopNo}`;
            let warningType = '1st Notice';

            if (esc.isPenaltyOnly) {
                subject = `Reminder: Pending Penalty Balance - Shop ${app.shopNo}`;
                warningType = 'Penalty Reminder';
            } else if (esc.nextLevel === 2) {
                subject = `Formal Notice: Outstanding Rent Dues - Shop ${app.shopNo}`;
                warningType = '2nd Notice';
            } else if (esc.nextLevel === 3) {
                subject = `URGENT: Final Notice Before Eviction - Shop ${app.shopNo}`;
                warningType = 'Final Notice';
            }

            const noticeHtml = customHtml || this.getNoticeHTMLForEmail(app, dues, settings, warningType);
            const text = `Dear ${app.applicantName},\n\nThis is the ${warningType} regarding your outstanding rent for Shop ${app.shopNo}.\nTotal Amount Due: ₹${dues.totalAmount.toFixed(2)}`;

            await Store.sendEmail(app.email, subject, text, noticeHtml, app.shopNo, 'SEND_NOTICE');

            if (btn) {
                btn.textContent = 'Sent ✅';
                btn.style.background = '#059669';
                btn.disabled = true;
                btn.title = "Notice sent successfully today";
            }

            // Update UI Communication Date and Status cell immediately
            const commCell = document.getElementById(`comm-${shopNo}`);
            if (commCell) {
                commCell.innerHTML = `
                    <span style="display: block; font-weight: bold; color: #059669;">Notice Sent Today</span>
                    <span style="color: #64748b;">On: ${this.formatDateDMY(new Date())}</span>
                `;
            }

            AppUI.success('Notice Message sent successfully');
        } catch (e) {
            console.error(e);
            AppUI.error('Failed to send email: ' + e.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✉️ Email';
            }
        }
    },

    getNoticeHTMLForEmail(app, dues, settings, warningType = 'Notice') {
        const monthsText = dues.details.map(d => d.source === 'history' ? `${d.month} (prev)` : d.month).join(', ');

        const isFinal = warningType.includes('Final');
        const isPenalty = warningType.includes('Penalty');
        const badgeColor = isFinal ? '#b91c1c' : (isPenalty ? '#0ea5e9' : '#b91c1c');
        const badgeText = warningType.toUpperCase();

        // --- Gmail Size Optimization ---
        // Gmail clips at 102KB. If the logo is a large base64, we omit it and use text.
        const logoSizeValid = settings.logoUrl && settings.logoUrl.length < 50000; // ~50KB limit
        let headerHtml = '';

        if (logoSizeValid) {
            headerHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
                    <div style="text-align: left;">
                         <h2 style="margin: 0; font-size: 16px; color: #1e293b;">SUDA SIDDIPET</h2>
                         <p style="margin: 0; font-size: 12px; color: #64748b;">Siddipet District</p>
                    </div>
                    <img src="${settings.logoUrl}" style="height: 60px; max-width: 150px; object-fit: contain;">
                </div>
            `;
        } else {
            // FALLBACK TO INVOICE STYLE HEADER (More reliable for large logos/clipped messages)
            headerHtml = `
                <div style="background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px;">SIDDIPET URBAN DEVELOPMENT AUTHORITY</h2>
                    <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Rent Outstanding Notice</p>
                </div>
            `;
        }

        let noticeLabel = "NOTICE No. 1";
        if (warningType === '2nd Notice') noticeLabel = "NOTICE No. 2";
        else if (warningType === 'Final Notice') noticeLabel = "FINAL NOTICE (No. 3)";
        else if (warningType === 'Penalty Reminder') noticeLabel = "REMINDER";

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; color: #334155;">
                ${headerHtml}
                <div style="padding: 25px; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 5px;">${noticeLabel}</span>
                        <h1 style="margin: 0; font-size: 24px; color: #1e293b; text-decoration: underline;">N O T I C E</h1>
                    </div>

                    <div style="text-align: right; margin-bottom: 15px; font-weight: bold; color: #64748b; font-size: 13px;">
                        Date: ${this.formatDateDMY(new Date())}
                    </div>

                    <div style="margin-bottom: 20px;">
                        <span style="font-size: 18px; font-weight: bold; color: ${badgeColor}; border-bottom: 2px solid #fca5a5; padding-bottom: 2px;">${badgeText}</span>
                    </div>

                    <p style="margin: 0 0 15px 0;"><strong>Sub:</strong> ${warningType} for Shop No. <strong>${app.shopNo}</strong> - Issued.</p>
                    <p style="margin: 0 0 15px 0;">Dear ${app.applicantName},</p>
                    
                    <p style="margin: 0 0 10px 0;">This is to inform you that the rent for Shop No. <strong>${app.shopNo}</strong> is pending for:</p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-weight: 500;">
                        ${monthsText}
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fffcf0; border: 1px solid #fde68a; border-radius: 6px;">
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #fef3c7;">Base Rent + GST:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #fef3c7; text-align: right;">₹${(dues.baseRent + dues.gst).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #fef3c7;">Penalty Amount:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #fef3c7; text-align: right;">₹${dues.penalty.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: bold; color: #b91c1c; font-size: 16px;">
                            <td style="padding: 12px;">Total Outstanding:</td>
                            <td style="padding: 12px; text-align: right;">₹${dues.totalAmount.toFixed(2)}</td>
                        </tr>
                    </table>

                    <p style="margin: 0 0 25px 0; font-size: 14px; color: #475569;">
                        ${isFinal
                ? `<strong>FINAL WARNING:</strong> You are directed to clear the outstanding dues within <strong>3 days</strong> to avoid immediate eviction and legal proceedings.`
                : isPenalty
                    ? `You are requested to clear the pending penalty balance at your earliest convenience.`
                    : `You are directed to clear the outstanding dues within <strong>7 days</strong> from the date of this notice to avoid further proceedings.`
            }
                    </p>

                    ${typeof ShopLedgerModule !== 'undefined' ? ShopLedgerModule.getLedgerHTML(app) : ''}

                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        <div style="float: right; text-align: center;">
                            <strong style="display: block; color: #1e293b;">Vice Chairman</strong>
                            <span style="font-size: 13px; color: #64748b;">SUDA, Siddipet</span>
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    &copy; 2026 Siddipet Urban Development Authority. This is a computer-generated notice.
                </div>
            </div>
        `;
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
                            @page { size: A4 portrait; margin: 10mm; }
                            html, body { height: auto !important; overflow: visible !important; }
                            body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: black; box-sizing: border-box; width: 100%; }
                            .notice-content { width: 100%; max-width: 100%; box-sizing: border-box; }
                            img { max-width: 100% !important; }
                        }
                        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
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

    async generateNotice(shopNo) {
        try {
            const normTarget = this.normalizeID(shopNo);
            const app = Store.getApplicants().find(a => this.normalizeID(a.shopNo) === normTarget);
            if (!app) {
                AppUI.error('Error: Applicant not found for shop ' + shopNo);
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

            // Calculate Display Rate Safely
            const pMode = settings.penaltyMode || 'MONTHLY';
            const mRate = parseFloat(settings.monthlyPenaltyRate) || 500;
            const dRate = parseFloat(settings.penaltyRate) || 15;
            // Strict Mode: If Daily, use legacy rate. If Monthly, use new rate.
            const displayRate = pMode === 'MONTHLY' ? mRate : dRate;

            // Define Logo HTML based on settings
            let logoHtml = '';
            if (settings.logoUrl) {
                logoHtml = `
                    <div style="text-align: right; margin-bottom: 0;">
                        <img src="${settings.logoUrl}" style="height: 90px; max-width: 250px; object-fit: contain; display: inline-block;">
                    </div>
                `;
            } else {
                // FALLBACK LOGO IF NONE UPLOADED
                logoHtml = `
                    <div style="text-align: right; margin-bottom: 0;">
                         <div style="display:inline-block; text-align:center; border: 2px solid #047857; padding: 5px 10px;">
                            <span style="font-weight:900; font-size: 20pt; color: #047857; display:block; line-height:1;">SUDA</span>
                            <span style="font-size: 6pt; letter-spacing: 1px; font-weight: bold;">SIDDIPET URBAN DEVELOPMENT AUTHORITY</span>
                         </div>
                    </div>
                `;
            }

            const logs = await Store.getNoticeLogs();
            const esc = this.getEscalationInfo(shopNo, logs, dues);
            const noticeNo = esc.isPenaltyOnly ? "REMINDER" : `NOTICE No. ${esc.nextLevel}`;

            // --- 1. CORE NOTICE CONTENT (Clean HTML) ---
            const noticeBody = `
                <!-- Logo Header -->
                ${logoHtml}

                <!-- Main Header -->
                <div style="text-align: center; margin-bottom: 0.5rem;">
                    <h2 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Office of the Siddipet Urban Development Authority</h2>
                    <h2 style="margin: 2px 0 0 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">Siddipet District</h2>
                </div>

                <!-- Date -->
                <div style="text-align: right; margin-bottom: 0.5rem; font-weight: bold;">
                    Dt: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
                </div>

                <!-- Notice Title -->
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-size: 10pt; color: #666; margin-bottom: 5px; font-weight: bold;">${noticeNo}</div>
                    <span style="font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 2px;">N O T I C E</span>
                </div>

                <!-- Subject Section with Hanging Indent -->
                <div style="display: flex; align-items: flex-start; margin-bottom: 0.5rem; margin-left: 2.5rem; font-size: 12pt; line-height: 1.5;">
                    <div style="font-weight: bold; white-space: nowrap; width: 3.5rem; text-decoration: underline; flex-shrink: 0;">Sub:-</div>
                    <div style="text-align: justify; line-height: 1.5;">
                         SUDA Siddipet – Letting out of SUDA Shop No. <strong>${app.shopNo}</strong>, in favor of <strong>${app.applicantName}</strong> 
                        being the highest bidder for <u>Rs. ${app.rentTotal}</u> per month plus GST@18% w.e.f 
                        ${new Date(app.rentStartDate || app.leaseDate).toLocaleString('default', { month: 'long', year: 'numeric' })} – 
                        Monthly rent for the months from <strong>${dues.details.length > 0 ? dues.details[0].month : '...'}</strong> to 
                        <strong>${dues.details.length > 0 ? dues.details[dues.details.length - 1].month : '...'}</strong> for 
                        <u>Rs. ${dues.totalAmount.toFixed(2)}</u> pending to be pay attracts 
                        <u>Rs. ${displayRate.toFixed(2)}</u> penalty per ${settings.penaltyMode === 'MONTHLY' ? 'month' : 'day'} 
                        for delay payment to an amount of <u>Rs. ${dues.totalAmount.toFixed(2)}</u> (including Penalty) and 
                        take action to evict from the Shop – notice issued.
                    </div>
                </div>

                <!-- Separator -->
                <div style="text-align: center; margin: 0.5rem 0; letter-spacing: 3px;">
                    &lt;&lt;&lt;&gt;&gt;&gt;
                </div>

                <!-- Body Paragraph 1 -->
                <p style="text-align: justify; text-indent: 2.5rem; margin-bottom: 2rem; margin-top: 0; font-size: 12pt; line-height: 1.5;">
                    It is fact that you had allotted SUDA shop no. <strong>${app.shopNo}</strong> for Rs. ${app.rentTotal} (Including GST) 
                    being the highest bidder. But whereas, you have not been paid the monthly rent for the months from 
                    <strong>${monthsText}</strong> inspite of repeated oral request of this office.
                </p>

                <!-- Body Paragraph 2 -->
                <p style="text-align: justify; text-indent: 2.5rem; margin-bottom: 2rem; font-size: 12pt; line-height: 1.5;">
                    In this connection, you are specifically instructed to pay the pending monthly rents within 7 days from the 
                    date of receipt of this notice. Further, you are remarkably remember that, it is an eviction notice on the part 
                    of your responsibility in payment of monthly rent every month upto 5th of every month. But you have been failed 
                    to pay the monthly rent pertains to the <strong>${dues.monthsCount}</strong> months for the months from 
                    <strong>${dues.details.length > 0 ? dues.details[0].month : ''}</strong> to 
                    <strong>${dues.details.length > 0 ? dues.details[dues.details.length - 1].month : ''}</strong> continuously. 
                    The non-payment of monthly rent will result for eviction from the occupation of shops. Further you are instructed 
                    to pay the <u>${dues.monthsCount}</u> months monthly rent by adding Rs. ${displayRate.toFixed(2)} 
                    penalty per ${settings.penaltyMode === 'MONTHLY' ? 'month' : 'day'} totalling to an amount of 
                    <strong>Rs. ${dues.totalAmount.toFixed(2)}</strong> (Rent ${((dues.baseRent + dues.gst).toFixed(2))} and 
                    Penalty Amount for ${dues.monthsCount} Months Rs. ${dues.penalty.toFixed(2)}).
                </p>

                <!-- Signature & Address Container -->
                <!-- SIGNATURE FIRST (Right Aligned) -->
                <div style="text-align: right; margin-bottom: 2rem; margin-top: 1rem; padding-right: 1rem;">
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

            // --- 2. PREVIEW OVERLAY (Responsive Glass Modal) ---
            overlay.innerHTML = `
                <style>
                    #print-overlay {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(15, 23, 42, 0.9); z-index: 10000;
                        overflow-y: auto; display: flex; flex-direction: column; align-items: center;
                        padding: 20px; box-sizing: border-box; backdrop-filter: blur(8px);
                    }
                    .toolbar {
                        position: sticky; top: 0; display: flex; gap: 10px; z-index: 10001;
                        background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 50px;
                        margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3); flex-wrap: wrap; justify-content: center;
                    }
                    .preview-container {
                        width: 100%; display: flex; justify-content: center;
                    }
                    #preview-page {
                        width: 210mm; min-height: 297mm;
                        padding: 20mm;
                        background: white; border-radius: 2px;
                        font-family: 'Times New Roman', serif; color: black; line-height: 1.5;
                        box-sizing: border-box; overflow: hidden;
                        transform-origin: top center;
                    }
                    @media (max-width: 850px) {
                        #preview-page {
                            transform: scale(0.45); margin-top: -300px; /* Scale for mobile */
                        }
                    }
                    @media (max-width: 450px) {
                        #preview-page {
                            transform: scale(0.35); margin-top: -450px;
                        }
                    }
                    .btn-preview {
                        cursor:pointer; padding: 10px 20px; font-size: 14px; color: white; border: none; border-radius: 25px;
                        font-weight: 600; transition: transform 0.2s;
                    }
                    .btn-preview:active { transform: scale(0.95); }
                    [contenteditable]:hover { outline: 2px dashed #6366f1; cursor: text; }
                </style>
                
                <div class="toolbar">
                    <button id="btn-close-preview" class="btn-preview" style="background: #ef4444;">Close</button>
                    <button id="btn-email-action" class="btn-preview" style="background: #4f46e5;">✉️ Email Notice</button>
                    <button id="btn-print-action" class="btn-preview" style="background: #0ea5e9;">📑 Download PDF</button>
                    <button id="btn-physical-action" class="btn-preview" style="background: #10b981;">🖨️ Record Physical Service</button>
                    <div style="color: white; font-size: 0.8rem; margin: auto 10px;">✍️ <i>Click text to edit</i></div>
                </div>

                <div class="preview-container">
                    <div id="preview-page" contenteditable="true">
                        ${noticeBody}
                    </div>
                </div>
            `;

            // Attach Events
            document.getElementById('btn-close-preview').onclick = () => overlay.remove();

            // PHYSICAL SERVICE LOGGING
            const physicalBtn = document.getElementById('btn-physical-action');
            if (esc.tooRecent) {
                physicalBtn.disabled = true;
                physicalBtn.style.background = '#94a3b8';
                physicalBtn.textContent = 'Recorded 🖨️';
            }

            physicalBtn.onclick = async () => {
                if (confirm("Have you served this notice physically? This will record the action in history.")) {
                    physicalBtn.disabled = true;
                    physicalBtn.textContent = 'Saving...';
                    const ok = await Store.logPhysicalNotice(shopNo);
                    if (ok) {
                        AppUI.success("Physical service recorded successfully.");
                        physicalBtn.textContent = 'Recorded 🖨️';
                        physicalBtn.style.background = '#94a3b8';
                        this.scanDefaulters(); // Refresh list
                    } else {
                        AppUI.error("Failed to record service.");
                        physicalBtn.disabled = false;
                        physicalBtn.textContent = '🖨️ Record Physical Service';
                    }
                }
            };

            // PDF DOWNLOAD ACTION (html2pdf Approach)
            document.getElementById('btn-print-action').onclick = () => {
                const element = document.getElementById('preview-page');
                const opt = {
                    margin: 0,
                    filename: `Notice_Shop_${shopNo}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
            };

            const emailActionBtn = document.getElementById('btn-email-action');
            // Re-use logs/esc from above

            if (esc.tooRecent) {
                emailActionBtn.disabled = true;
                emailActionBtn.style.background = '#94a3b8';
                emailActionBtn.textContent = 'Sent ✉️';
            }

            emailActionBtn.onclick = async () => {
                const customHtml = document.getElementById('preview-page').innerHTML;
                emailActionBtn.disabled = true;
                emailActionBtn.textContent = 'Sending...';

                await this.sendNoticeEmail(shopNo, emailActionBtn, customHtml);
            };

        } catch (e) {
            AppUI.error('Notice Generation Error: ' + e.message);
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
                    <form id="remittance-form" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; align-items: end;">
                        <div class="form-group" style="grid-column: span 1;">
                            <label class="form-label">For Period</label>
                            <div style="display:flex; gap:5px;">
                                <select id="remit-for-month" class="form-select" style="padding: 6px;">
                                    <option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option>
                                    <option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option>
                                    <option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option>
                                    <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                                </select>
                                <select id="remit-for-year" class="form-select" style="padding: 6px;">
                                    <!-- Populated JS -->
                                </select>
                            </div>
                        </div>
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
                            <button type="submit" class="btn-primary" style="width: 100%;">Record</button>
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
                                <th>For Period</th> <!-- Updated Header -->
                                <th>Reference</th>
                                <th>Amount</th>
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
        // ... (existing code for getStats header) ...
        const payments = Store.getPayments();
        const remittances = Store.getRemittances();
        // ...
        // Helper to extract Year/Month from payment
        const getPaymentYearMonth = (p) => {
            // Prefer paymentForMonth (e.g. "2024-04")
            if (p.paymentForMonth) {
                const part = String(p.paymentForMonth).split('-');
                if (part.length >= 2) return { y: parseInt(part[0]), m: parseInt(part[1]) };
            }
            // Fallback to paymentDate
            if (p.paymentDate) {
                const d = new Date(p.paymentDate);
                if (!isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() + 1 };
            }
            return null;
        };

        // Helper: Check if payment matches filter
        const matchesPayment = (p) => {
            if (!month && !year) return true;
            const pm = getPaymentYearMonth(p); // {y, m}
            if (!pm) return false;

            let matches = true;

            if (year) {
                const fy = parseInt(year);
                // Financial Year 'year' spans Apr 'year' to Mar 'year+1'
                if (pm.m >= 4) {
                    if (pm.y !== fy) matches = false;
                } else {
                    if (pm.y !== fy + 1) matches = false;
                }
            }

            if (month) {
                if (pm.m !== parseInt(month)) matches = false;
            }

            return matches;
        };

        // Helper to check remittance match by remittance.date OR forMonth/forYear (Priority)
        const matchesRemit = (r) => {
            if (!month && !year) return true;

            // Determine the calendar period the remittance covers
            let calYear, calMonth;

            if (r.year && r.month) {
                calYear = parseInt(r.year);
                calMonth = parseInt(r.month);
            } else if (r.forYear && r.forMonth) {
                calYear = parseInt(r.forYear);
                calMonth = parseInt(r.forMonth);
            } else if (r.date) {
                const d = new Date(r.date);
                if (!isNaN(d.getTime())) {
                    calYear = d.getFullYear();
                    calMonth = d.getMonth() + 1;
                }
            }

            if (!calYear || !calMonth) return false;

            let matches = true;

            if (year) {
                const fy = parseInt(year);
                // Check if calendar period falls within financial year
                if (calMonth >= 4) {
                    if (calYear !== fy) matches = false;
                } else {
                    if (calYear !== fy + 1) matches = false;
                }
            }

            if (month) {
                if (calMonth !== parseInt(month)) matches = false;
            }

            return matches;
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

        const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        tbody.innerHTML = remittances.map(r => {
            // Format Period
            let periodDisplay = '-';
            // Use standard month/year first
            if (r.month && r.year) {
                periodDisplay = `${monthShort[parseInt(r.month) - 1] || ''} ${String(r.year).slice(-2)}`;
            } else if (r.forMonth && r.forYear) {
                periodDisplay = `${monthShort[parseInt(r.forMonth) - 1] || ''} ${String(r.forYear).slice(-2)}`;
            }

            return `
            <tr>
                <td>${r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-'}</td>
                <td style="font-weight:600; color:#4f46e5;">${periodDisplay}</td>
                <td>${r.notes || r.referenceNo || '-'}</td>
                <td style="font-weight: bold; color: #10b981;">₹${Utils.parseNumber(r.amount).toFixed(2)}</td>
            </tr>
            `;
        }).join('');
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
            // Logic: Determine the effective "Period Date" for this remittance
            let periodDate = null;

            // 1. PRIORITY: Standard `month` and `year` (Mapped to Period)
            if (r.year && r.month) {
                periodDate = new Date(parseInt(r.year), parseInt(r.month) - 1, 15);
            }
            // 2. BACKUP: Explicit Period (Legacy interim)
            else if (r.forYear && r.forMonth) {
                periodDate = new Date(parseInt(r.forYear), parseInt(r.forMonth) - 1, 15);
            }
            // 3. FALLBACK: Remittance Date
            else if (r.date) {
                periodDate = new Date(r.date);
            }

            if (!periodDate || isNaN(periodDate.getTime())) return;

            // If year provided, filter to that financial year
            if (year) {
                if (!inFinancialYear(periodDate, parseInt(year))) return;
            }

            // Assign to the month bucket of the PERIOD DATE
            const m = periodDate.getMonth() + 1;
            if (months[m]) {
                months[m].remitted += Utils.parseNumber(r.amount || 0);
            }
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

        // RESTORED: Populate Year Dropdown (Current -2 to +1)
        const remitYearSel = document.getElementById('remit-for-year');
        if (remitYearSel) {
            const cy = new Date().getFullYear();
            remitYearSel.innerHTML = `
                <option value="${cy - 2}">${cy - 2}</option>
                <option value="${cy - 1}">${cy - 1}</option>
                <option value="${cy}" selected>${cy}</option>
                <option value="${cy + 1}">${cy + 1}</option>
            `;

            // Default to Previous Month (Convenience)
            const remitMonthSel = document.getElementById('remit-for-month');
            if (remitMonthSel) {
                const today = new Date();
                const pm = today.getMonth(); // 0(Jan)..11(Dec)

                if (pm === 0) { // If Jan, Prev is Dec of last year
                    remitMonthSel.value = "12";
                    remitYearSel.value = (today.getFullYear() - 1).toString();
                } else {
                    remitMonthSel.value = pm.toString(); // e.g. Feb(1) -> 1(Jan)
                }
            }
        }
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById('remit-amount').value);
            const date = document.getElementById('remit-date').value;
            const notes = document.getElementById('remit-notes').value;

            if (amount <= 0) {
                AppUI.warn('Please enter a valid amount.');
                return;
            }

            // Define missing variables from DOM
            const forMonth = document.getElementById('remit-for-month').value;
            const forYear = document.getElementById('remit-for-year').value;

            // Extract month and year from the date for database sync (Legacy / Fallback)
            const dateObj = new Date(date);
            // const month = dateObj.getMonth() + 1; // 1-12 (Legacy)
            // const year = dateObj.getFullYear();   // (Legacy)

            // NEW LOGIC: Use user-selected Period as the primary accounting period
            // This maps the explicit 'For Period' to the database 'month'/'year' columns
            const month = forMonth;
            const year = forYear;

            const record = {
                amount: amount,
                date: date,

                // MAPPED: Saving Period into the standard DB columns
                month: month.toString(),
                year: year.toString(),

                // Redundant fields kept just in case local storage needs them explicit, 
                // but db auto-saves 'month'/'year'
                forMonth: forMonth,
                forYear: forYear,

                referenceNo: notes,
                notes: notes,
                bankName: '',
                timestamp: new Date().toISOString()
            };

            Store.saveRemittance(record);
            AppUI.success('Remittance recorded successfully!');

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
                <div class="glass-panel" style="background: white; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto;">
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
        const normTarget = Store.normalizeID(shopNo);
        const app = Store.getApplicants().find(a => Store.normalizeID(a.shopNo) === normTarget);
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
            AppUI.success('Agreement Terminated. Moved to History.');
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

                AppUI.success('Lease Renewed & Synced Successfully!');
                document.getElementById('renewal-modal').style.display = 'none';
                this.renderActiveList();

            } catch (e) {
                console.error(e);
                AppUI.error('Error updating lease: ' + e.message);
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
                <h3>DCB Report</h3>
                <div id="report-content" style="margin-top: 1.5rem;">
                    <!-- DCB View -->
                </div>
            </div>
        `;
        this.renderDCB();
    },

    renderDCB(container) {
        // Target the inner content area
        const targetContainer = document.getElementById('report-content');
        if (!targetContainer) {
            // Ideally should not happen if render() called first.
            // If somehow called directly, fallback to container or content-area but this loses tabs
            console.error("Report content area not found!");
            return;
        }

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

        // Add hidden debug trigger
        window.debugShopPenalty = (shopNo) => {
            window.dcbDebugTarget = shopNo;
            window.dcbDebugLog = [];
            // Trigger generation
            this.generateDCB();
            console.table(window.dcbDebugLog);
            // Summarize for alert
            let msg = `Penalty Analysis for Shop ${shopNo}:\n\n`;
            window.dcbDebugLog.forEach(row => {
                if (row.Penalty > 0) {
                    // Heuristic: If RateUsed >= 100, assume Monthly logic, else Daily.
                    const unitLabel = (row.RateUsed >= 100) ? 'months' : 'days';
                    msg += `${row.Month}: ${row.Days} ${unitLabel} overdue -> ₹${row.Penalty}\n`;
                }
            });
            AppUI.info(msg || "No Arrear Penalty found for this shop.");
            window.dcbDebugTarget = null;
        };
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
            AppUI.warn('Please select a Financial Year');
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
            const result = this.calculateDCBForApplicant(app, fromDate, toDate, payments, settings);

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
                    <td><button onclick="window.debugShopPenalty('${app.shopNo}')" style="font-size:0.7rem; padding:2px 5px;">Analyze</button></td>
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

        const s = Store.getSettings();
        const m = s.penaltyMode || 'MONTHLY';
        const r = m === 'MONTHLY' ? (s.monthlyPenaltyRate || 500) : (s.monthlyPenaltyRate || s.penaltyRate || 15);
        const penaltyText = m === 'MONTHLY' ? `₹${r}/month` : `₹${r}/day`;

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
                            * Penalty is calculated @ ${penaltyText} for delay.<br>
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
        const normTarget = Store.normalizeID(shopNo);
        const app = Store.getApplicants().find(a => Store.normalizeID(a.shopNo) === normTarget);
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

    calculateDCBForApplicant(app, fromDate, toDate, allPayments, settings) {
        // Calculate detailed current vs arrear demand/collection/balance

        // Ensure inputs are safe
        const legacyRate = parseFloat(settings.penaltyRate) || 15;
        const newRate = parseFloat(settings.monthlyPenaltyRate) || 500;
        const policyDateStr = settings.penaltyPolicyDate || '2022-01-01';
        const policyDate = new Date(policyDateStr);
        const mode = settings.penaltyMode || 'MONTHLY';
        const impDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;

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
                const dueDay = parseInt(app.paymentDay) || 5;
                const dueDate = new Date(current.getFullYear(), current.getMonth(), Math.min(dueDay, 28));
                let countStart = dueDate;
                if (impDate && !isNaN(new Date(impDate).getTime()) && impDate > dueDate) countStart = impDate;

                let penaltyForMonth = 0;
                let isSettledBeforeReport = false;

                // 1. Check Historical Settlement
                if (payment) {
                    const pDateStr = payment.paymentDate || payment.timestamp;
                    if (pDateStr) {
                        const pDate = parseLocal(pDateStr);
                        if (!isNaN(pDate.getTime()) && pDate < reportStart) {
                            isSettledBeforeReport = true;
                        }
                    }
                }

                // 2. Calculate Theoretical Opening Penalty (Up to Previous FY End)
                if (!isSettledBeforeReport) {
                    if (prevFyEnd > countStart && !isNaN(prevFyEnd.getTime()) && !isNaN(countStart.getTime())) {
                        const diffDays = Math.ceil((prevFyEnd - countStart) / (1000 * 60 * 60 * 24));

                        if (diffDays > 0) {
                            // Unified Logic using Store SOT
                            const params = Store.getPenaltyParams(dueDate);
                            const pMode = params.mode || 'MONTHLY';
                            const pRate = parseFloat(params.rate) || 500;

                            if (pMode === 'MONTHLY') {
                                // Strict penalty: minimum 1 month for any delay
                                const months = Math.max(1, Math.ceil(diffDays / 30));
                                penaltyForMonth = months * pRate;
                            } else {
                                // Daily logic
                                penaltyForMonth = diffDays * pRate;
                            }
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
                // Find matching waiver (Compare strings robustly)
                // const allWaivers = Store.getWaivers() || []; (Already declared)
                const waiver = allWaivers.find(w => String(w.shopNo) === String(app.shopNo) && w.month === monthStr);

                // DEBUG TRACE HOOK
                if (window.dcbDebugTarget === app.shopNo && window.dcbDebugLog) {
                    window.dcbDebugLog.push({
                        Month: monthStr,
                        DueDate: dueDate.toLocaleDateString(),
                        IsArrear: true,
                        SettledBefore: isSettledBeforeReport,
                        Penalty: penaltyForMonth,
                        Penalty: penaltyForMonth,
                        RateUsed: (dueDate < policyDate ? legacyRate : newRate),
                        Days: (dueDate < policyDate ? legacyRate : newRate) > 0 ? (penaltyForMonth / (dueDate < policyDate ? legacyRate : newRate)).toFixed(1) : 0
                    });
                }

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
            AppUI.warn('Please generate the DCB report first before exporting.');
            return;
        }

        const header = [
            'Sl No', 'Shop No', 'Shop Name', 'Current Demand (Base)', 'Current Demand (GST)', 'Arrear Demand (Base)',
            'Arrear Demand (GST)', 'Arrear Demand (Penalty)', 'Total Demand', 'Current Collection', 'Current Collection (Penalty)', 'Arrear Collection', 'Total Collection',
            'Current Balance', 'Arrear Balance', 'Total Balance', '% Collection', 'Action'
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
        if (!w) { AppUI.warn('Unable to open print window. Please allow popups for this site.'); return; }
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>DCB Report</title>${style}</head><body>${contentHtml}<script>window.onload=function(){setTimeout(()=>{window.print();},200);};</script></body></html>`);
        w.document.close();
    }

};

// ==========================================
// SHOP LEDGER MODULE
// ==========================================
const ShopLedgerModule = {
    render(container) {
        container.innerHTML = `
             <div class="glass-panel">
                <h3>Shop-wise Outstanding Dues Statement</h3>
                <div style="display: flex; gap: 1rem; align-items: flex-end; margin-top: 1.5rem;">
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
                                <strong>Contact:</strong> <span id="stmt-contact"></span><br>
                                <div id="stmt-rpc-summary" style="margin-top: 5px; font-size: 0.85rem; color: #0f766e; background: #ccfbf1; padding: 5px; border-radius: 4px; display: inline-block; text-align: left;">
                                    Fetching server summary...
                                </div>
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
                                <tbody id="stmt-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Populate shop dropdown
        const shops = Store.getShops();
        const applicants = Store.getApplicants();
        const sel = document.getElementById('rep-stmt-shop');
        shops.forEach(s => {
            const applicant = applicants.find(a => a.shopNo === s.shopNo);
            const opt = document.createElement('option');
            opt.value = s.shopId || s.shopNo; // Use shopId if available, fallback to shopNo
            opt.textContent = `Shop ${s.shopNo} - ${applicant ? applicant.applicantName : 'Vacant'}`;
            sel.appendChild(opt);
        });

        sel.addEventListener('change', () => {
            const selectedId = sel.value;
            if (selectedId) this.generateStatement(selectedId);
        });

        const printBtn = document.getElementById('btn-stmt-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                const content = document.getElementById('print-stmt-area').innerHTML;
                const w = window.open('', '_blank');
                if (!w) { AppUI.warn('Please allow popups'); return; }
                w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Shop Ledger</title><style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #000;padding:8px;}</style></head><body>${content}<script>window.onload=function(){setTimeout(()=>{window.print();},200);};</script></body></html>`);
                w.document.close();
            });
        }
    },

    getLedgerHTML(app) {
        const dues = Store.calculateOutstandingDues(app);
        let rows = '';
        if (dues.details && dues.details.length > 0) {
            dues.details.forEach((m, idx) => {
                rows += `
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px;">${m.month}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">₹${m.rent.toFixed(2)}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">₹${m.penalty.toFixed(2)}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right; font-weight: bold;">₹${(m.rent + m.penalty).toFixed(2)}</td>
                </tr>
                `;
            });
            rows += `
            <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="2" style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">TOTAL</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${(dues.baseRent + dues.gst).toFixed(2)}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${dues.penalty.toFixed(2)}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${dues.totalAmount.toFixed(2)}</td>
            </tr>
            `;
        } else {
            rows = '<tr><td colspan="5" style="border: 1px solid #e2e8f0; padding: 20px; text-align: center;">No outstanding dues</td></tr>';
        }

        const dateStr = typeof NoticeModule !== 'undefined' ? NoticeModule.formatDateDMY(new Date()) : new Date().toLocaleDateString('en-GB');

        return `
            <div style="margin-top: 25px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b; text-transform: uppercase;">Detailed Statement (Ledger)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569;">
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">Sl</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Month</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Rent+GST</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Penalty</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">* Penalty is calculated as on ${dateStr}.</p>
            </div>
        `;
    },

    async generateStatement(shopIdOrNo) {
        const shops = Store.getShops();
        const shop = shops.find(s => s.shopId === shopIdOrNo || s.shopNo === shopIdOrNo);
        if (!shop) return;

        const app = Store.getApplicants().find(a => a.shopNo === shop.shopNo);
        if (!app) {
            AppUI.error('No tenant found for this shop');
            return;
        }

        // Populate tenant info
        document.getElementById('stmt-shop-no').textContent = shop.shopNo || 'N/A';
        document.getElementById('stmt-name').textContent = app.applicantName || 'N/A';
        document.getElementById('stmt-contact').textContent = app.contactNo || app.mobileNo || 'N/A';
        document.getElementById('stmt-date').textContent = `As on: ${new Date().toLocaleDateString('en-GB')}`;

        // --- RPC Integration: Instant Server-Side Summary ---
        if (window.supabaseClient) {
            try {
                // Instantly load the basic aggregate, saving massive client-side logic
                const { data, error } = await supabaseClient.rpc('get_shop_ledger_summary', { p_shop_no: shop.shopNo });
                const rpcSummaryDiv = document.getElementById('stmt-rpc-summary');
                if (!error && data && rpcSummaryDiv) {
                    rpcSummaryDiv.innerHTML = `
                        <strong>Total Base Rent Paid:</strong> ₹${parseFloat(data.rent_paid || 0).toLocaleString('en-IN')}<br>
                        <strong>Last Payment Date:</strong> ${data.last_payment_date ? new Date(data.last_payment_date).toLocaleDateString('en-GB') : 'N/A'}
                    `;
                } else if (rpcSummaryDiv) {
                    rpcSummaryDiv.style.display = 'none';
                }
            } catch (e) {
                console.warn('RPC Ledger Summary failed:', e);
                const rpcSummaryDiv = document.getElementById('stmt-rpc-summary');
                if (rpcSummaryDiv) rpcSummaryDiv.style.display = 'none';
            }
        }

        // Calculate outstanding
        const dues = Store.calculateOutstandingDues(app);
        const tbody = document.getElementById('stmt-tbody');

        let html = '';
        if (dues.details && dues.details.length > 0) {
            dues.details.forEach((m, idx) => {
                html += `
                <tr>
                    <td class="data-cell" style="padding: 8px;">${idx + 1}</td>
                    <td class="data-cell" style="padding: 8px;">${m.month}</td>
                    <td class="data-cell" style="text-align: right; padding: 8px;">₹${m.rent.toFixed(2)}</td>
                    <td class="data-cell" style="text-align: right; padding: 8px;">₹${m.penalty.toFixed(2)}</td>
                    <td class="data-cell" style="text-align: right; padding: 8px; font-weight: bold;">₹${(m.rent + m.penalty).toFixed(2)}</td>
                </tr>
            `;
            });
            html += `
                <tr style="border-top: 2px solid #000; font-weight: bold; font-size: 1.05rem;">
                    <td colspan="2" style="text-align: right; padding: 10px;">TOTAL OUTSTANDING</td>
                    <td style="text-align: right; padding: 10px;">₹${(dues.baseRent + dues.gst).toFixed(2)}</td>
                    <td style="text-align: right; padding: 10px;">₹${dues.penalty.toFixed(2)}</td>
                    <td style="text-align: right; padding: 10px; font-size: 1.1rem;">₹${dues.totalAmount.toFixed(2)}</td>
                </tr>
            `;
        } else {
            html = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No outstanding dues</td></tr>';
        }

        tbody.innerHTML = html;
        document.getElementById('stmt-results').style.display = 'block';
    }
};

// ==========================================
// GST MONTH-WISE REPORT MODULE
// ==========================================
const GstMonthwiseReportModule = {
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        // Ensure valid date
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    },

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
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${this.formatDate(p.paymentDate)}</td>
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
                this.formatDate(p.paymentDate),
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
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">${this.formatDate(p.paymentDate)}</td>
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
            AppUI.warn("Please select both Month and Year to generate Form-58.");
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
            AppUI.warn("Please allow popups to generate the print window.");
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
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                         <label style="font-weight: 500; font-size: 0.9rem;">Financial Year:</label>
                         <select id="report-filter-year" class="form-select" style="padding: 6px; width: auto; margin-right: 1rem;">
                              <!-- Populated by JS -->
                         </select>
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
                                <th>Receipt No.</th>
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
                    const yr = document.getElementById('report-filter-year') ? document.getElementById('report-filter-year').value : '';
                    this.renderReport(yr);
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

        // The following block is restored as per instruction, assuming it was intended for this render method.
        // Note: 'clearLogoBtn', 'logoInput', 'logoPreview', 'SettingsModule' are not defined in this scope
        // and typically belong to a settings-related module. This restoration is purely based on the instruction.
        const clearLogoBtn = document.getElementById('btn-clear-logo'); // Assuming this element exists
        const logoInput = document.getElementById('logo-upload'); // Assuming this element exists
        const logoPreview = document.getElementById('logo-preview'); // Assuming this element exists

        if (clearLogoBtn) {
            clearLogoBtn.addEventListener('click', () => {
                // SettingsModule is not defined in this scope, assuming it's globally available or imported
                if (typeof SettingsModule !== 'undefined') {
                    SettingsModule.tempLogo = null; // Explicit null means "remove"
                }
                if (logoInput) logoInput.value = '';
                if (logoPreview) {
                    logoPreview.src = '';
                    logoPreview.style.display = 'none';
                }
                clearLogoBtn.style.display = 'none';
                const placeholder = document.getElementById('logo-placeholder');
                if (placeholder) placeholder.style.display = 'block';
            });
        }

        // Populate Financial Years in dropdown
        const yearSelect = document.getElementById('report-filter-year');
        if (yearSelect) {
            const yearSet = new Set();
            const currentYear = new Date().getFullYear();
            yearSet.add(currentYear);
            yearSet.add(currentYear - 1);

            const payments = Store.getPayments();
            payments.forEach(p => {
                if (p.paymentDate) {
                    const d = new Date(p.paymentDate);
                    const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
                    yearSet.add(y);
                }
            });

            const years = Array.from(yearSet).sort((a, b) => b - a);

            // Allow an "All Time" or "All Years" option
            const allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = 'All Years';
            yearSelect.appendChild(allOpt);

            years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = `${y}-${String(y + 1).slice(2)}`;
                yearSelect.appendChild(opt);
            });

            // Default to current financial year
            const curMonth = new Date().getMonth() + 1;
            const curFY = curMonth >= 4 ? currentYear : currentYear - 1;
            yearSelect.value = curFY.toString();

            yearSelect.addEventListener('change', () => {
                this.renderReport(yearSelect.value);
            });
        }

        // Pass initial value to renderReport
        const initialYear = yearSelect ? yearSelect.value : '';
        this.renderReport(initialYear);
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
            'Receipt No.'
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
            if (p.paymentMethod === 'cash') {
                paymentMethodText = 'Cash';
            } else if (p.paymentMethod === 'dd-cheque') {
                paymentMethodText = `DD/Cheque (${p.ddChequeNo || ''} - ${p.ddChequeDate || ''})`;
            } else if (p.paymentMethod === 'online') {
                paymentMethodText = `Online (${p.transactionNo || ''})`;
            }

            // Extract the proper receipt number, prioritizing SUDA- format
            let receiptNoText = '-';
            if (p.receiptId && p.receiptId.startsWith('SUDA-')) {
                receiptNoText = p.receiptId;
            } else if (p.receiptNo && p.receiptNo.startsWith('SUDA-')) {
                receiptNoText = p.receiptNo;
            } else {
                receiptNoText = p.receiptId || p.receiptNo || '-';
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
                receiptNoText
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


    renderReport(filterYear = '') {
        let payments = Store.getPayments();

        if (filterYear) {
            const fy = parseInt(filterYear);
            payments = payments.filter(p => {
                if (!p.paymentDate) return false;
                const d = new Date(p.paymentDate);
                const pFy = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
                return pFy === fy;
            });
        }

        const tbody = document.getElementById('report-list-body');
        const summary = document.getElementById('report-summary');

        // Sort by date descending
        payments.sort((a, b) => new Date(b.paymentDate || '') - new Date(a.paymentDate || ''));

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color: var(--text-muted);">No payment records found.</td></tr>';
            return;
        }

        // Helper to format payment method details
        const formatPaymentMethod = (p) => {
            if (!p.paymentMethod) return '-';
            if (p.paymentMethod === 'cash') return 'Cash';
            if (p.paymentMethod === 'dd-cheque') {
                return `DD/Cheque<br><small style="color: #475569;">${p.ddChequeNo || ''} (${p.ddChequeDate || ''})</small>`;
            }
            if (p.paymentMethod === 'online') {
                return `Online<br><small style="color: #475569;">${p.transactionNo || ''}</small>`;
            }
            return '-';
        };

        const getReceiptNoText = (p) => {
            if (p.receiptId && p.receiptId.startsWith('SUDA-')) {
                return p.receiptId;
            }
            if (p.receiptNo && p.receiptNo.startsWith('SUDA-')) {
                return p.receiptNo;
            }
            return p.receiptId || p.receiptNo || '-';
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
                    <td style="font-size: 0.9rem; color: #475569; font-family: monospace;">${getReceiptNoText(p)}</td>
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
            AppUI.warn("Please select Shop and Month");
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
            AppUI.success("Waiver Recorded Successfully!");
            document.getElementById('waiver-form').reset();
            this.renderHistory();
        } catch (e) {
            console.error(e);
            AppUI.error("Failed to save waiver.");
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
        const settings = Store.getSettings();
        const legacyRate = parseFloat(settings.penaltyRate) || 15;
        const newRate = parseFloat(settings.monthlyPenaltyRate) || 500;
        const policyDateStr = settings.penaltyPolicyDate || '2022-01-01';
        const policyDate = new Date(policyDateStr);
        const mode = settings.penaltyMode || 'MONTHLY';

        let penaltyAmount = 0;

        if (dueDate < policyDate) {
            // Legacy
            penaltyAmount = diffDays * legacyRate;
        } else {
            // New Policy
            if (mode === 'MONTHLY') {
                // Strict penalty: minimum 1 month for any delay
                const months = Math.max(1, Math.ceil(diffDays / 30));
                penaltyAmount = months * newRate;
            } else {
                // Daily New
                penaltyAmount = diffDays * newRate;
            }
        }

        return penaltyAmount;
    }
};

window.NoticeModule = NoticeModule;
window.ReportModule = ReportModule;
window.WaiverModule = WaiverModule;