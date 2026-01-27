/**
 * SUDA Shop Lease Model Software
 * Single file version for easy local execution (No Server Required)
 */

// CONFIGURATION
const config = window.CONFIG || { SUPABASE_URL: '', SUPABASE_KEY: '' };
if (!config.SUPABASE_URL) {
    console.error("CRITICAL: Missing js/config.js. Please rename js/config.example.js and add your keys.");
    alert("Configuration Missing! Application may not work.");
}

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_KEY;

// GLOBAL UI HELPERS (For direct access from HTML)
window.openForgotModal = function (e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const m = document.getElementById('forgot-password-modal');
    if (m) {
        m.style.setProperty('display', 'flex', 'important');
        m.style.setProperty('z-index', '2147483647', 'important'); // Max Z-Index
        // Ensure Login Container doesn't cover it (Login is 20000)
        const login = document.getElementById('login-container');
        if (login) login.style.zIndex = '999'; // Lower it below Modal (2Billion)

        console.log("Global: Force Opened Forgot Modal", m.style.display);
    } else {
        console.error("Global: Modal Not Found!");
    }
};

window.closeForgotModal = function () {
    const m = document.getElementById('forgot-password-modal');
    if (m) m.style.display = 'none';
    const login = document.getElementById('login-container');
    if (login) login.style.zIndex = ''; // Restore CSS default (20000)
};

// Use window.supabase to avoid shadowing, and name the client 'supabaseClient'
const _supabase = window.supabase;
const supabaseClient = _supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const AuthModule = {
    async checkSession() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) {
                // Check for "Refresh Token Not Found" or similar
                if (error.message && (error.message.includes('Refresh Token') || error.code === 'refresh_token_not_found')) {
                    console.warn("Invalid Session (Refresh Token), forcing logout.");
                    localStorage.removeItem('supabase.auth.token'); // Hard Clear
                    await this.logout();
                    return false;
                }
                throw error;
            }
            return !!session;
        } catch (e) {
            console.error("Session Check Failed:", e);
            return false;
        }
    },

    async login(email, pass) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: pass
        });
        if (error) {
            console.error('Login Error:', error.message);
            return false;
        }
        return true;
    },

    async sendPasswordReset(email) {
        if (!email) return { error: 'Email is required' };
        try {
            // Use dedicated reset page
            // Logic: github.io/shoplease/ -> github.io/shoplease/reset.html
            // Or localhost:8000/ -> localhost:8000/reset.html

            // Get base path (handles /shoplease/ or /)
            let basePath = window.location.pathname;
            // Remove 'index.html' if present
            basePath = basePath.replace('index.html', '');
            // Ensure trailing slash
            if (!basePath.endsWith('/')) basePath += '/';

            const redirectUrl = window.location.origin + basePath + 'reset.html';

            console.log("Sending Reset for URL:", redirectUrl);

            const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Password Reset Error:', err);
            return { error: err.message };
        }
    },

    async updatePassword(newPassword) {
        try {
            const { data, error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Update Password Error:', err);
            return { error: err.message };
        }
    },

    async logout() {
        try {
            // 1. Sign out from Supabase (clears auth tokens)
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
            }

            // 2. Clear local cache (optional but safer)
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();

            // 3. Small delay to ensure browser flushes storage
            await new Promise(resolve => setTimeout(resolve, 100));

            // 4. Reload page to show login screen
            location.reload();
        } catch (err) {
            console.error('Logout failed:', err);
            // Force reload anyway
            location.reload();
        }
    },

    // --- DATA REPAIR HELPER (Run in Console) ---
    async repairData() {
        console.log("Starting Repair Process...");
        // 1. Get Legacy Data involved in the migration failure
        const rawApps = localStorage.getItem('suda_shop_applicants');

        if (!rawApps) {
            alert("No legacy data found in LocalStorage to repair from!");
            return;
        }

        const applicants = JSON.parse(rawApps);
        let successCount = 0;
        let failCount = 0;

        for (const app of applicants) {
            console.log(`Repiring Shop ${app.shopNo}...`);

            // Map the missing fields
            const updatePayload = {
                expiry_date: app.expiryDate,
                agreement_date: app.agreementDate,
                payment_day: parseInt(app.paymentDay) || 5,
                gst_amount: parseFloat(app.gstAmount || 0),
                rent_base: parseFloat(app.rentBase || app.baseRent || 0),
                rent_total: parseFloat(app.rentTotal || app.totalRent || 0),
                proprietor_name: app.proprietorShopName || app.proprietorName || '',
                // Ensure applicantType (implicit via proprietor_name logic on read, 
                // but good to ensure proprietor_name is set if it was missing)

                // Missing Fields (Reported by User)
                contact_no: app.mobileNo || app.contactNo,
                pan_no: app.panNo || app.pan,
                aadhar_no: app.aadharNo || app.aadhar,
                gst_no: app.gstNo || app.shopGst, // Repair legacy data
                address: app.address,
                // GST No for Proprietors (sometimes stored as shopGst in legacy)
                // Note: We don't have a specific column for 'shop_gst_no' in DB? 
                // Let's check schema. We have 'pan_no', 'aadhar_no'. 
                // If shop_gst is important, we might need a column or reuse one?
                // Wait, 'proprietor_name' is there. 'shop_no' is there.
                // Converting legacy 'shopGst' to put into address or just ensure it's saved.
                // Checking DB schema... we might have missed 'gst_no' column for tenant?
                // If so, let's put it in address for now or leave it. 
                // User said "GST for Shop No 02 and 03". 
                // Maybe they mean GST Amount? "no GST for Shop No 02...".
                // Ah, "Application Details... no GST". likely 'gst_amount'.
                // I have 'gst_amount' mapped above. 
                // Retrying update including contact info.
            };

            const { error } = await supabaseClient
                .from('tenants')
                .update(updatePayload)
                .eq('shop_no', app.shopNo);

            if (error) {
                console.error(`Failed to repair ${app.shopNo}:`, error);
                failCount++;
            } else {
                successCount++;
            }
        }

        alert(`Repair Complete!\nFixed: ${successCount}\nFailed: ${failCount}\n\nPlease Refresh the Page.`);
    }
};
// Expose for Console Use & HTML Inline Access
window.repairData = AuthModule.repairData;
window.logout = AuthModule.logout.bind(AuthModule); // Bind to keep context

document.addEventListener('DOMContentLoaded', async () => {
    // 1. AUTH CHECK
    // 0. INITIALIZE UI EVENTS (Immediate)
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('btn-logout');

    // Forgot Password Event Logic
    const forgotLink = document.getElementById('forgot-password-link');
    const forgotModal = document.getElementById('forgot-password-modal');
    const cancelResetBtn = document.getElementById('btn-cancel-reset');
    const sendResetBtn = document.getElementById('btn-send-reset');
    const resetEmailInput = document.getElementById('reset-email');

    if (forgotLink && forgotModal) {
        // Redundant listeners removed. Handled by global window.openForgotModal & inline onclick.

        cancelResetBtn.addEventListener('click', () => {
            forgotModal.style.display = 'none';
        });

        sendResetBtn.addEventListener('click', async () => {
            const email = resetEmailInput.value.trim();
            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            const originalText = sendResetBtn.textContent;
            sendResetBtn.textContent = 'Sending...';
            sendResetBtn.disabled = true;

            const result = await AuthModule.sendPasswordReset(email);

            sendResetBtn.textContent = originalText;
            sendResetBtn.disabled = false;

            if (result.success) {
                alert(`Password reset link sent to ${email}. Please check your inbox.`);
                forgotModal.style.display = 'none';
                resetEmailInput.value = '';
            } else {
                alert('Error: ' + (result.error || 'Failed to send reset link.'));
            }
        });
    }

    // Password Reset now handled by dedicated reset.html page
    // Removed old PASSWORD_RECOVERY modal logic to prevent duplicate modals

    // 1. AUTH CHECK (Async)

    const isLoggedIn = await AuthModule.checkSession();

    if (isLoggedIn) {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'flex'; // Show Flex container

        // Initialize App Logic ONLY if logged in
        await Store.initData(); // Fetch critical data from Cloud!

        if (Store.normalizePayments) Store.normalizePayments();
        if (Store.normalizeRemittances) Store.normalizeRemittances();
        Store.deduplicatePayments();
        initRouter();

        // Auto-load Dashboard on app initialization
        handleRoute('dashboard');
    } else {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    // Login Event
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const uid = document.getElementById('login-id').value;
            const pass = document.getElementById('login-pass').value;

            // Supabase uses Email/Password, so we treat 'uid' as email if it contains '@', else we might need mapping.
            // For now, let's assume the user enters an email.
            const success = await AuthModule.login(uid, pass);

            if (success) {
                location.reload();
            } else {
                loginError.textContent = "Authentication Failed. Please check email/password.";
                loginError.style.display = 'block';
            }
        });
    }

    // Logout Event
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await AuthModule.logout();
        });
    }


});


// ==========================================
// STORE (Data Persistence)
// ==========================================
const Store = {
    APPLICANTS_KEY: 'suda_shop_applicants',
    PAYMENTS_KEY: 'suda_shop_payments',
    SHOPS_KEY: 'suda_shop_inventory',
    SETTINGS_KEY: 'suda_shop_settings',
    REMITTANCE_KEY: 'suda_shop_remittances',
    WAIVERS_KEY: 'suda_shop_waivers',
    HISTORY_KEY: 'suda_shop_history',

    // --- CACHE & INIT ---
    cache: {
        shops: [],
        applicants: [],
        payments: [],
        settings: { penaltyRate: 16, penaltyDate: '2023-01-01', logoUrl: null }, // Default
        remittances: [],
        waivers: [],
        history: []
    },

    async initData() {
        try {
            // console.log("Store: Initializing Data from Cloud...");
            const [s, t, p] = await Promise.all([
                supabaseClient.from('shops').select('*'),
                supabaseClient.from('tenants').select('*'),
                supabaseClient.from('payments').select('*')
            ]);

            // Try fetch extra tables safely
            let w = { data: [] }, r = { data: [] }, settingsDB = { data: [] };
            try {
                const extra = await Promise.all([
                    supabaseClient.from('waivers').select('*'),
                    supabaseClient.from('remittances').select('*'),
                    supabaseClient.from('settings').select('*').eq('key', 'global_settings')
                ]);
                w = extra[0];
                r = extra[1];
                settingsDB = extra[2];
            } catch (err) {
                console.warn("Optional tables (waivers/remittances/settings) fetch failed:", err);
            }

            // 1. Map Shops
            this.cache.shops = (s.data || []).map(row => ({
                shopNo: row.shop_no,
                dimensions: row.dimensions,
                status: row.status,
                shopId: row.id // Keep DB ID
            }));

            // 2. Map Applicants
            this.cache.applicants = (t.data || []).map(row => ({
                shopNo: row.shop_no,
                // Map contact_no -> mobileNo (UI expects mobileNo)
                mobileNo: row.contact_no,
                email: row.email,
                applicantName: row.applicant_name,
                proprietorShopName: row.proprietor_name, // Map DB prop_name -> JS propShopName
                applicantType: row.proprietor_name ? 'Proprietor' : 'Individual', // Infer Type
                contactNo: row.contact_no,
                aadharNo: row.aadhar_no,
                panNo: row.pan_no,
                gstNo: row.gst_no, // New mapping
                address: row.address,

                // Financials
                rentBase: row.rent_base,       // Correct: rentBase
                gstAmount: row.gst_amount,     // Correct: gstAmount
                rentTotal: row.rent_total,     // Correct: rentTotal

                // Dates
                leaseDate: row.lease_date,
                rentStartDate: row.rent_start_date,
                expiryDate: row.expiry_date,       // Correct: expiryDate
                agreementDate: row.agreement_date, // Correct: agreementDate
                paymentDay: row.payment_day,       // Correct: paymentDay

                occupancyStartDate: row.rent_start_date || row.lease_date,
                status: row.status
            }));

            // 3. Map Payments
            this.cache.payments = (p.data || []).map(row => ({
                shopNo: row.shop_no,
                paymentDate: row.payment_date,
                paymentForMonth: row.payment_for_month,
                rentAmount: row.amount_base,
                gstAmount: row.amount_gst,
                penalty: row.amount_penalty,
                grandTotal: row.amount_total, // Mapped back to JS property
                totalRent: row.amount_total,  // Alias for compatibility
                paymentMode: row.payment_method,
                paymentMethod: row.payment_method,  // Alias for compatibility (new code uses this)
                // Load receipt_no from DB into both fields for backward compatibility
                receiptId: row.receipt_no,  // New standardized field
                receiptNo: row.receipt_no,  // Old manual field (cash payments)

                // Transaction Details
                transactionNo: row.transaction_no,
                ddChequeNo: row.dd_cheque_no,
                ddChequeDate: row.dd_cheque_date,

                timestamp: row.created_at
            }));

            // 4. Map Waivers (if available from DB, else use LocalStorage later)
            if (w.data && w.data.length > 0) {
                this.cache.waivers = w.data.map(row => ({
                    id: row.id,
                    shopNo: row.shop_no,
                    month: row.month,
                    authorizedBy: row.authorized_by,
                    reason: row.reason,
                    date: row.created_at
                }));
            }

            // 5. Map Remittances
            if (r.data && r.data.length > 0) {
                this.cache.remittances = r.data.map(row => ({
                    id: row.id,
                    date: row.remittance_date, // The actual bank remittance date
                    amount: row.amount,
                    month: row.month,
                    year: row.year,
                    referenceNo: row.reference_no,
                    notes: row.notes,
                    bankName: row.bank_name,
                    created_at: row.created_at // Keep original created_at for 'Recorded At' display
                }));
            }

            // 6. Map Settings
            if (settingsDB.data && settingsDB.data.length > 0) {
                // Found in Cloud
                this.cache.settings = settingsDB.data[0].value;
                // Also update local cache for offline availability
                localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.cache.settings));
            } else {
                // Fallback to LocalStorage (First run or offline)
                const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
                if (savedSettings) this.cache.settings = JSON.parse(savedSettings);
            }

            // Merge LocalStorage with DB for Waivers/Remittances (Offline Support)
            // If DB was empty/failed, we rely on LS. If DB had data, we prefer DB but might want to merge unsynced.
            // For simplicity, if DB loaded, we overwrite cache. If not, we load LS.
            if ((!w.data || w.data.length === 0)) {
                const savedWaivers = localStorage.getItem(this.WAIVERS_KEY);
                if (savedWaivers) this.cache.waivers = JSON.parse(savedWaivers);
            }

            if ((!r.data || r.data.length === 0)) {
                const savedRemittances = localStorage.getItem(this.REMITTANCE_KEY);
                if (savedRemittances) this.cache.remittances = JSON.parse(savedRemittances);
            }

            // console.log("Store: Data Loaded", this.cache);
        } catch (e) {
            console.error("Store Init Failed:", e);
            alert("Failed to load data from Cloud. Using Offline/Empty state.");
        }
    },


    getRemittances() {
        return this.cache.remittances; // From Cache
    },

    async saveRemittance(remittance) {
        // Ensure created_at exists in local object
        if (!remittance.created_at) {
            remittance.created_at = new Date().toISOString();
        }

        this.cache.remittances.push(remittance);
        localStorage.setItem(this.REMITTANCE_KEY, JSON.stringify(this.cache.remittances));

        try {
            await supabaseClient.from('remittances').insert([{
                amount: remittance.amount,
                month: remittance.month,
                year: remittance.year,
                reference_no: remittance.referenceNo,
                notes: remittance.notes,
                bank_name: remittance.bankName || '',
                remittance_date: remittance.date, // The actual bank deposit date
                created_at: remittance.created_at
            }]);

            // Log Remittance
            const desc = `Recorded GST Remittance of ₹${remittance.amount}`;
            this.logAction('CREATE_REMITTANCE', 'remittances', 'new', desc, remittance);
        } catch (e) {
            console.error("Remittance Sync Failed:", e);
        }
    },

    getWaivers() {
        return this.cache.waivers;
    },

    async saveWaiver(waiver) {
        this.cache.waivers.push(waiver);
        this.updateLocalWaivers();

        try {
            const { data, error } = await supabaseClient.from('waivers').insert([{
                shop_no: waiver.shopNo,
                month: waiver.month,
                authorized_by: waiver.authorizedBy,
                reason: waiver.reason,
                amount: waiver.amount || 0, // Include amount
                created_at: waiver.date || new Date().toISOString()
            }]).select();

            // Log Waiver
            const desc = `Waived Penalty for Shop ${waiver.shopNo} (${waiver.month})`;
            this.logAction('CREATE_WAIVER', 'waivers', waiver.shopNo, desc, waiver);

            if (data && data[0]) {
                waiver.id = data[0].id; // Update local ID with DB ID
                this.updateLocalWaivers();
            }
        } catch (e) {
            console.error("Waiver Sync Failed:", e);
        }
    },

    async deleteWaiver(waiverId) {
        // 1. Local Delete
        // Ensure type safety (string comparison)
        this.cache.waivers = this.cache.waivers.filter(w => String(w.id) !== String(waiverId));
        this.updateLocalWaivers();

        // 2. Cloud Delete
        try {
            await supabaseClient.from('waivers').delete().eq('id', waiverId);

            // Log Delete
            const desc = `Deleted Waiver ID ${waiverId}`;
            this.logAction('DELETE_WAIVER', 'waivers', String(waiverId), desc, null);
        } catch (e) {
            console.error("Waiver Delete Failed:", e);
        }
    },

    updateLocalWaivers() {
        localStorage.setItem(this.WAIVERS_KEY, JSON.stringify(this.cache.waivers));
    },

    getHistory() {
        // History is less critical, keep in localStorage for now
        return JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
    },

    saveToHistory(record) {
        const list = this.getHistory();
        list.push(record);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(list));
    },

    getSettings() {
        return this.cache.settings;
    },

    // --- AUDIT LOGGING ---
    async logAction(actionType, tableName, recordId, description, metadata = null) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const userEmail = user ? user.email : 'system/offline';

            const logEntry = {
                user_email: userEmail,
                action_type: actionType,
                table_name: tableName,
                record_id: recordId,
                description: description,
                metadata: metadata,
                created_at: new Date().toISOString()
            };

            // Fire and forget - don't block the UI for logging
            supabaseClient.from('audit_logs').insert([logEntry]).then(({ error }) => {
                if (error) console.error("Audit Log Error:", error);
            });

        } catch (e) {
            console.warn("Failed to capture audit log:", e);
        }
    },

    // --- NOTIFICATIONS ---
    async sendEmail(to, subject, text, html = null) {
        if (!to) return;
        console.log(`Sending email to ${to}...`);

        try {
            const { data, error } = await supabaseClient.functions.invoke('send-email', {
                body: {
                    to: to,
                    subject: subject,
                    text: text,
                    html: html || `<p>${text}</p>`
                }
            });

            if (error) throw error;
            console.log("Email Sent:", data);
            this.logAction('SEND_EMAIL', 'system', 'na', `Sent email to ${to}: ${subject}`);
        } catch (e) {
            console.error("Email Sending Failed:", e);
            // Don't alert user - notifications should fail silently
        }
    },

    /**
     * Calculates total outstanding dues for a tenant
     * Reused logic from Notice Module
     * @param {Object} app - Applicant object
     * @param {Date} referenceDate - Optional, defaults to now. Calculation stops at this date.
     */
    calculateOutstandingDues(app, referenceDate = new Date()) {
        const settings = this.getSettings();
        const penaltyRate = parseFloat(settings.penaltyRate) || 15;

        // GST Settings (Legacy Support)
        const globalGstBase = (parseFloat(settings.gstBaseRate) || 18) / 100;
        const globalGstNew = (parseFloat(settings.gstNewRate) || 18) / 100;
        const globalGstEffective = settings.gstEffectiveDate ? new Date(settings.gstEffectiveDate) : null;

        // GST History (New Support)
        // Ensure sorted descending by date (Newest first)
        let gstHistory = settings.gstHistory || [];
        if (gstHistory.length > 0) {
            gstHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const implementationDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
        const today = referenceDate || new Date();

        // 1. Identify Lease Periods
        const periods = [];
        const pushPeriod = (start, end, meta) => {
            if (!start) return;
            periods.push({
                start: new Date(start),
                end: end ? new Date(end) : today,
                meta: meta
            });
        };

        const history = app.leaseHistory || [];
        if (Array.isArray(history) && history.length > 0) {
            history.forEach(h => {
                const s = h.leaseDate || h.rentStartDate || h.startDate;
                const e = h.expiryDate || h.leaseEndDate || h.endDate;
                pushPeriod(s, e, { source: 'history', entry: h });
            });
        }

        const activeStart = app.rentStartDate || app.leaseDate || null;
        pushPeriod(activeStart, null, { source: 'active' });

        // 2. Identify Paid Months
        const payments = this.getShopPayments(app.shopNo) || [];
        const paidMonths = new Set(payments.map(p => String(p.paymentForMonth)));
        const addedMonthKeys = new Set();

        let totalBase = 0;
        let totalGST = 0;
        let totalPenalty = 0;
        const pendingMonths = [];

        periods.forEach(period => {
            const cur = new Date(period.start);
            while (cur <= period.end) {
                const y = cur.getFullYear();
                const mNum = cur.getMonth() + 1;
                const m = String(mNum).padStart(2, '0');
                const monthStr = `${y}-${m}`;

                if (addedMonthKeys.has(monthStr) || paidMonths.has(monthStr)) {
                    cur.setMonth(cur.getMonth() + 1);
                    continue;
                }
                addedMonthKeys.add(monthStr);

                // Penalty Logic
                const dueDay = parseInt(app.paymentDay) || 5;
                const dueDate = new Date(y, cur.getMonth(), Math.min(dueDay, 28));

                // Normalize today to start of day for accurate comparison
                const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (todayMidnight <= dueDate) {
                    cur.setMonth(cur.getMonth() + 1);
                    continue; // Not properly due yet
                }

                let p = 0;
                if (today > dueDate) {
                    let startCounting = dueDate;
                    if (implementationDate && implementationDate > dueDate) {
                        startCounting = implementationDate;
                    }
                    if (today > startCounting) {
                        const diffTime = Math.abs(today - startCounting);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        p = diffDays * penaltyRate;
                    }
                }

                // Rent Logic
                let rentBase = parseFloat(app.rentBase || app.baseRent || app.rentAmount || 0) || 0;
                let gstAmt = 0;

                // --- GST AMENDMENT LOGIC (MULTI-HISTORY) ---
                // Find applicable rate for THIS specific month (curDate)
                const curDate = new Date(cur.getFullYear(), cur.getMonth(), 1); // Start of the current month being processed
                let applicableRate = 0.18; // Default Fallback

                if (gstHistory && gstHistory.length > 0) {
                    // Check history entries (Sorted Descending in initialization)
                    for (const h of gstHistory) {
                        // If curr month is ON or AFTER the effective date
                        const effDate = new Date(h.date);
                        if (curDate >= effDate) {
                            applicableRate = (parseFloat(h.rate) || 0) / 100;
                            break; // Found the most recent applicable rate
                        }
                    }
                } else if (globalGstBase) {
                    // Fallback to legacy settings if history missing
                    applicableRate = globalGstBase;
                    if (globalGstEffective && curDate >= globalGstEffective) applicableRate = globalGstNew;
                }

                if (period.meta && period.meta.entry) {
                    const e = period.meta.entry;
                    rentBase = parseFloat(e.rentBase || e.baseRent || e.rentAmount || rentBase) || rentBase;

                    // Use historical GST if explicitly saved (frozen history)
                    if (e.gstAmount !== undefined && e.gstAmount !== null) {
                        gstAmt = parseFloat(e.gstAmount);
                    } else {
                        // No saved GST? Calculate using the rate applicable for THAT period
                        gstAmt = rentBase * applicableRate;
                    }
                } else {
                    // Active Period: Use the rate applicable for this month
                    gstAmt = rentBase * applicableRate;
                }

                const rentTotal = rentBase + gstAmt;

                totalBase += rentBase;
                totalGST += gstAmt;
                totalPenalty += p;

                pendingMonths.push({
                    month: cur.toLocaleString('default', { month: 'short', year: 'numeric' }),
                    rent: rentTotal,
                    penalty: p,
                    source: period.meta && period.meta.source === 'history' ? 'history' : 'active'
                });

                cur.setMonth(cur.getMonth() + 1);
            }
        });

        return {
            totalAmount: totalBase + totalGST + totalPenalty,
            breakdown: { base: totalBase, gst: totalGST, penalty: totalPenalty },
            details: pendingMonths,
            monthsCount: pendingMonths.length,
            baseRent: totalBase,
            gst: totalGST,
            penalty: totalPenalty
        };
    },

    /**
     * Checks for tenants who have NOT paid for the CURRENT month
     * and sends a warning if today is past their due date.
     */
    async processLatePaymentWarnings() {
        const today = new Date();
        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const tenants = this.getApplicants();
        let sentCount = 0;

        console.log(`Checking Late Payments for ${currentMonthStr}...`);

        for (const tenant of tenants) {
            if (!tenant.email) continue; // Skip if no email

            // 1. Check if paid
            const payments = this.cache.payments.filter(p =>
                this.idsMatch(p.shopNo, tenant.shopNo) &&
                p.paymentForMonth === currentMonthStr
            );

            if (payments.length > 0) continue; // Already paid

            // 2. Check Due Date
            const dueDay = parseInt(tenant.paymentDay) || 5;

            if (today.getDate() > dueDay) {
                // Calculate Total Outstanding
                const outstanding = this.calculateOutstandingDues(tenant);

                // Send Warning
                try {
                    const subject = `Urgent: Rent Overdue for Shop ${tenant.shopNo}`;
                    const text = `Dear ${tenant.applicantName},\n\nThis is a reminder that your rent for ${currentMonthStr} was due on the ${dueDay}th.\n\nWe have not received your payment yet. Please pay immediately.\n\nTotal Outstanding Due: ₹${outstanding.totalAmount.toFixed(2)}\n\nIgnore this if you have already paid today.\n\nSincerely,\nVice Chairman SUDA`;

                    await this.sendEmail(tenant.email, subject, text);
                    sentCount++;
                } catch (e) {
                    console.error(`Failed to warn ${tenant.shopNo}`, e);
                }
            }
        }

        return sentCount;
    },

    async saveSettings(settings) {
        this.cache.settings = settings;
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));

        try {
            // Log the change
            const desc = `Updated Global Settings (Penalty Rate: ${settings.penaltyRate || 'default'})`;
            this.logAction('UPDATE_SETTINGS', 'settings', 'global_settings', desc, settings);

            const { error } = await supabaseClient
                .from('settings')
                .upsert({
                    key: 'global_settings',
                    value: settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
        } catch (e) {
            console.error("Settings Sync Failed:", e);
            alert("Settings saved locally but Cloud Sync failed.");
        }
    },

    // --- CLOUD BACKUP ---
    async createCloudBackup() {
        // 1. Gather Data
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            shops: this.cache.shops,
            applicants: this.cache.applicants,
            payments: this.cache.payments,
            waivers: this.cache.waivers,
            remittances: this.cache.remittances,
            settings: this.cache.settings
        };

        // 2. Prepare File
        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const file = new File([blob], fileName, { type: 'application/json' });

        // 3. Upload to Supabase Storage
        const { data, error } = await supabaseClient
            .storage
            .from('backups')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 4. Log Action
        this.logAction('CREATE_BACKUP', 'storage', fileName, 'Created Full System Cloud Backup', null);

        return data;
    },

    // --- STORAGE ---
    async uploadFile(file, path) {
        try {
            const { data, error } = await supabaseClient
                .storage
                .from('agreements')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('agreements')
                .getPublicUrl(path);

            return publicUrl;
        } catch (e) {
            console.error("Upload Failed:", e);
            throw e;
        }
    },

    // --- SHOPS ---
    getShops() {
        return this.cache.shops;
    },

    async saveShop(shop) {
        // 1. Optimistic Update (Cache)
        const index = this.cache.shops.findIndex(s => s.shopNo === shop.shopNo);
        if (index >= 0) this.cache.shops[index] = shop;
        else this.cache.shops.push(shop);

        // 2. Cloud Sync
        // Map JS -> DB
        const dbShop = {
            shop_no: shop.shopNo,
            dimensions: shop.dimensions,
            status: shop.status
        };

        try {
            const { error } = await supabaseClient.from('shops').upsert(dbShop, { onConflict: 'shop_no' });
            if (error) { throw error; }
        } catch (e) {
            console.error("Save Shop Failed:", e);
            alert("Saved locally, but Cloud Sync failed!");
        }
    },

    async markShopOccupied(shopNo) {
        const shop = this.cache.shops.find(s => s.shopNo === shopNo);
        if (shop) {
            shop.status = 'Occupied';
            // Sync Status Only
            await supabaseClient.from('shops').update({ status: 'Occupied' }).eq('shop_no', shopNo);
        }
    },

    // --- APPLICANTS ---
    getApplicants() {
        return this.cache.applicants;
    },

    async saveApplicant(applicant) {
        // 1. Optimistic Update
        const index = this.cache.applicants.findIndex(a => a.shopNo === applicant.shopNo);
        if (index >= 0) {
            this.cache.applicants[index] = { ...this.cache.applicants[index], ...applicant };
        } else {
            this.cache.applicants.push(applicant);
        }

        // 2. Cloud Sync
        const dbApp = {
            shop_no: applicant.shopNo,
            applicant_name: applicant.applicantName,
            proprietor_name: applicant.proprietorShopName || applicant.proprietorName,
            contact_no: applicant.mobileNo || applicant.contactNo,
            email: applicant.email || null,
            aadhar_no: applicant.aadharNo || applicant.aadhar,
            pan_no: applicant.panNo || applicant.pan,
            gst_no: applicant.gstNo || applicant.shopGst,
            address: applicant.address,
            agreement_url: applicant.agreementUrl || null,

            lease_date: applicant.leaseDate,
            rent_start_date: applicant.rentStartDate,
            expiry_date: applicant.expiryDate,
            agreement_date: applicant.agreementDate,
            payment_day: parseInt(applicant.paymentDay) || 5,

            rent_base: parseFloat(applicant.rentBase || applicant.baseRent || 0),
            gst_amount: parseFloat(applicant.gstAmount || 0),
            rent_total: parseFloat(applicant.rentTotal || applicant.totalRent || 0),

            status: 'Active'
        };

        try {
            // ROBUST STRATEGY: Check if exists first (to avoid deleting data)
            const { data: existingRows, error: fetchError } = await supabaseClient
                .from('tenants')
                .select('id')
                .eq('shop_no', applicant.shopNo);

            if (fetchError) throw fetchError;

            // Log Action
            const action = (existingRows && existingRows.length > 0) ? 'UPDATE_APPLICANT' : 'CREATE_APPLICANT';
            const desc = `${action === 'UPDATE_APPLICANT' ? 'Updated' : 'Created'} Tenant for Shop ${applicant.shopNo}`;
            this.logAction(action, 'tenants', applicant.shopNo, desc, dbApp);

            // --- WELCOME EMAIL ---
            if (action === 'CREATE_APPLICANT' && dbApp.email) {
                try {
                    const subject = `Welcome to SUDA Shop Lease - Shop ${dbApp.shop_no}`;
                    const text = `Dear ${dbApp.applicant_name},\n\nWelcome! You have been successfully registered as the tenant in SUDA for Shop No: ${dbApp.shop_no}.\n\nLease Start Date: ${dbApp.lease_date}\nRent Amount: ₹${dbApp.rent_total}\nPayment Due Day: ${dbApp.payment_day}th of every month.\n\nWe look forward to a great partnership.\n\nSincerely,\nShop Lease Manager`;
                    this.sendEmail(dbApp.email, subject, text);
                } catch (err) {
                    console.warn("Welcome email failed:", err);
                }
            }

            if (existingRows && existingRows.length > 0) {
                // Update the existing record(s) - usually just one
                const idToUpdate = existingRows[0].id;
                const { error: updateError } = await supabaseClient
                    .from('tenants')
                    .update(dbApp)
                    .eq('id', idToUpdate);

                if (updateError) throw updateError;

                // Optional: If duplicates exist (ghost data), warn or clean
                if (existingRows.length > 1) {
                    console.warn(`Duplicate tenants found for shop ${applicant.shopNo}. Updated first, consider cleanup.`);
                }
            } else {
                // Insert new
                const { error: insertError } = await supabaseClient
                    .from('tenants')
                    .insert(dbApp);

                if (insertError) throw insertError;
            }

            await this.markShopOccupied(applicant.shopNo);
        } catch (e) {
            console.error("Save Applicant Failed:", e);
            alert("Saved locally, but Cloud Sync failed! " + (e.message || ""));
        }
    },

    // --- PAYMENTS ---
    getPayments() {
        return this.cache.payments;
    },

    async savePayment(payment) {
        // Check duplicate
        const exists = this.cache.payments.find(p => p.shopNo === payment.shopNo && p.paymentForMonth === payment.paymentForMonth);
        if (exists) {
            alert(`Payment for ${payment.shopNo} for ${payment.paymentForMonth} already exists!`);
            return;
        }

        // 1. Optimistic
        this.cache.payments.push(payment);

        // 2. Cloud Sync
        const dbPay = {
            shop_no: payment.shopNo,
            payment_date: payment.paymentDate,
            payment_for_month: payment.paymentForMonth,
            amount_base: parseFloat(payment.rentAmount || 0),
            amount_gst: parseFloat(payment.gstAmount || 0),
            amount_penalty: parseFloat(payment.penalty || 0),
            amount_total: parseFloat(payment.grandTotal || 0),
            payment_method: payment.paymentMethod || payment.paymentMode,
            // Use new receiptId (SUDA-0001/2025-26) with fallback to old receiptNo for backward compatibility
            receipt_no: payment.receiptId || payment.receiptNo,

            // Transaction Details
            transaction_no: payment.transactionNo || null,
            dd_cheque_no: payment.ddChequeNo || null,
            dd_cheque_date: payment.ddChequeDate || null
        };

        try {
            const { error } = await supabaseClient.from('payments').insert(dbPay);
            if (error) throw error;

            // Log Payment
            const desc = `Received Payment of ₹${dbPay.amount_total} for Shop ${dbPay.shop_no} (${dbPay.payment_for_month})`;
            this.logAction('CREATE_PAYMENT', 'payments', dbPay.receipt_no || 'new', desc, dbPay);

            // --- AUTOMATED EMAIL RECEIPT ---
            try {
                const tenant = this.cache.applicants.find(a => a.shopNo === dbPay.shop_no);
                if (tenant && tenant.email) {
                    const subject = `Payment Receipt: ${dbPay.shop_no} - ${dbPay.payment_for_month}`;
                    const text = `Dear ${tenant.applicantName},\n\nWe have received your payment of ₹${dbPay.amount_total} for Shop ${dbPay.shop_no} for the month of ${dbPay.payment_for_month}.\n\nReceipt No: ${dbPay.receipt_no}\nDate: ${dbPay.payment_date}\n\nThank you,\nShop Lease Manager`;

                    // Fire and forget email
                    this.sendEmail(tenant.email, subject, text);
                }
            } catch (err) {
                console.warn("Auto-email logic failed:", err);
            }

        } catch (e) {
            console.error("Save Payment Failed:", e);
            alert("Payment saved locally but Cloud Sync failed.");
        }
    },


    getShopPayments(shopNo) {
        const payments = this.getPayments();
        return payments.filter(p => this.idsMatch(p.shopNo, shopNo));
    },

    // --- RECEIPT NUMBER GENERATION ---
    /**
     * Generates the next receipt number in format: SUDA-0001/2025-26
     * Counter resets every financial year (April to March)
     */
    // --- ASYNC RECEIPT GENERATION (Cloud-First) ---
    /**
     * Fetches the highest receipt number from Supabase and increments it.
     * Prevents duplicates by ignoring local cache and checking the real database.
     */
    async getNextReceiptNumberAsync() {
        const fy = this.getCurrentFinancialYear();

        // 1. Check Cloud for highest number
        // We look for any receipt starting with "SUDA-" and ending with "/2025-26"
        const { data, error } = await supabaseClient
            .from('payments')
            .select('receipt_no')
            .ilike('receipt_no', `SUDA-%/${fy}`)
            .order('receipt_no', { ascending: false })
            .limit(1);

        let nextNum = 1;

        if (error) {
            console.error("Cloud Receipt Check Failed:", error);
            // Fallback to local if Cloud fails (Safety Net)
            // But warn the user? For now, we silent fail to local.
            return this.getNextReceiptNumber();
        }

        if (data && data.length > 0) {
            const lastReceipt = data[0].receipt_no;
            const match = lastReceipt.match(/SUDA-(\d+)\//);
            if (match) {
                nextNum = parseInt(match[1]) + 1;
            }
        } else {
            // Cloud has 0 receipts for this FY.
            // We should also check LocalStorage just in case Local is ahead (un-synced)
            // to avoid collision if Cloud is empty but Local has 10 awaiting sync.
            const localKey = `receipt_counter_${fy}`;
            const localCount = parseInt(localStorage.getItem(localKey) || '0');
            if (localCount >= nextNum) {
                nextNum = localCount + 1;
            }
        }

        // 2. Update Local Counter to match (Sync)
        const counterKey = `receipt_counter_${fy}`;
        localStorage.setItem(counterKey, nextNum.toString());

        // 3. Return Formatted
        const padded = nextNum.toString().padStart(4, '0');
        return `SUDA-${padded}/${fy}`;
    },

    getNextReceiptNumber() {
        // ... (Keep old sync method as fallback/helper)
        const financialYear = this.getCurrentFinancialYear();
        const counterKey = `receipt_counter_${financialYear}`;
        let counter = parseInt(localStorage.getItem(counterKey) || '0');
        counter++;
        localStorage.setItem(counterKey, counter.toString());
        const paddedCounter = counter.toString().padStart(4, '0');
        return `SUDA-${paddedCounter}/${financialYear}`;
    },

    /**
     * Returns current financial year in format: 2025-26
     * Financial year runs from April to March
     */
    getCurrentFinancialYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12

        // If January-March, FY is (year-1)-(year)
        // If April-December, FY is (year)-(year+1)
        if (month >= 1 && month <= 3) {
            return `${year - 1}-${String(year).slice(-2)}`;
        } else {
            return `${year}-${String(year + 1).slice(-2)}`;
        }
    },

    /**
     * Get financial year from any date (accepts Date object)
     * Used by migration to determine FY for old payments
     */
    getFinancialYearFromDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11

        if (month < 3) { // Jan-Mar (0,1,2)
            return `${year - 1}-${String(year).slice(-2)}`;
        } else { // Apr-Dec (3-11)
            return `${year}-${String(year + 1).slice(-2)}`;
        }
    },

    // Helper: Safely compare IDs (Handle "04" vs 4 vs " 04 ")
    idsMatch(a, b) {
        if (!a || !b) return false;
        const sA = String(a).trim();
        const sB = String(b).trim();
        if (sA === sB) return true;

        // Try numeric comparison if both are valid numbers
        const nA = Number(sA);
        const nB = Number(sB);
        return !isNaN(nA) && !isNaN(nB) && nA === nB;
    },

    // --- DELETE/UPDATE METHODS ---
    async deleteApplicant(shopNo) {
        try {
            console.log(`Attempting to delete applicant for Shop ${shopNo}...`);

            // 1. Local Cache Update
            let applicants = this.getApplicants();

            // Log for debugging
            console.log(`Deleting Applicant for Shop Arg: '${shopNo}'`);

            // Use Robust Helper for local filtering
            this.cache.applicants = applicants.filter(a => !this.idsMatch(a.shopNo, shopNo));

            // Mark Shop as Available locally
            const shop = this.cache.shops.find(s => this.idsMatch(s.shopNo, shopNo));
            if (shop) shop.status = 'Available';

            // PERSIST Local Storage
            localStorage.setItem(this.APPLICANTS_KEY, JSON.stringify(this.cache.applicants));
            localStorage.setItem(this.SHOPS_KEY, JSON.stringify(this.cache.shops));

            // Cleanup Payments (Ghost Data) locally
            this.deletePaymentsForShop(shopNo);

            // 2. Cloud Sync - ROBUST STRATEGY (Fetch UUID then Delete)

            // A. Clean Payments first
            // Normalize inputs for query
            const sId = String(shopNo).trim();
            const nId = Number(sId);
            const isNum = !isNaN(nId);

            // Construct OR filter for likely variations
            let orQuery = `shop_no.eq.${sId}`;
            if (isNum) {
                // If input is "04", add "4". If "4", add "04".
                const altId = String(nId);
                if (altId !== sId) orQuery += `,shop_no.eq.${altId}`; // "4"

                const paddedId = nId < 10 && nId >= 0 ? `0${nId}` : String(nId);
                if (paddedId !== sId && paddedId !== altId) orQuery += `,shop_no.eq.${paddedId}`; // "04"
            }

            console.log(`Cloud Sync: Searching for tenants matching: ${orQuery}`);

            // B. Find Tenant UUIDs to delete
            const { data: tenantsToDelete, error: fetchError } = await supabaseClient
                .from('tenants')
                .select('id, shop_no')
                .or(orQuery);

            if (fetchError) console.warn("Error fetching tenants for delete:", fetchError);

            if (tenantsToDelete && tenantsToDelete.length > 0) {
                const ids = tenantsToDelete.map(t => t.id);
                console.log(`Cloud Sync: Found ${ids.length} tenants to delete via UUID:`, ids);

                const { error: delError } = await supabaseClient
                    .from('tenants')
                    .delete()
                    .in('id', ids); // Delete by UUID

                if (delError) throw delError;
            } else {
                console.warn("Cloud Sync: No matching tenants found to delete on server.");
            }

            // C. Also try to delete payments using the same broad filter
            await supabaseClient.from('payments').delete().or(orQuery);

            // D. Update Shop Status (Broad filter)
            await supabaseClient.from('shops').update({ status: 'Available' }).or(orQuery);

            // C. SCORCHED EARTH FALLBACK
            console.log("Cloud Sync: Executing Fallback Direct Deletions...");
            await supabaseClient.from('tenants').delete().eq('shop_no', shopNo);
            if (String(shopNo).trim() !== String(shopNo)) {
                await supabaseClient.from('tenants').delete().eq('shop_no', String(shopNo).trim());
            }
            // Fallback Payments/Shops
            await supabaseClient.from('payments').delete().eq('shop_no', shopNo);
            await supabaseClient.from('shops').update({ status: 'Available' }).eq('shop_no', shopNo);

            console.log(`Success: Deleted applicant and cleared Shop ${shopNo}.`);
            alert(`Applicant deleted and Shop ${shopNo} is now Available.`);

        } catch (e) {
            console.error("Delete Applicant Failed:", e);
            alert("Error: Deleted locally, but Cloud Sync failed! Check console for details.");
        }
    },

    async deleteShop(shopNo) {
        // 1. Local Cache
        let shops = this.getShops();
        shops = shops.filter(s => !this.idsMatch(s.shopNo, shopNo));
        localStorage.setItem(this.SHOPS_KEY, JSON.stringify(shops));

        // Cleanup payments locally
        this.deletePaymentsForShop(shopNo);

        // 2. Cloud Sync
        try {
            // First, delete related Tenant if it exists (Optional, but safe)
            await supabaseClient.from('tenants').delete().eq('shop_no', shopNo);

            // Delete payments (Cloud)
            await supabaseClient.from('payments').delete().eq('shop_no', shopNo);

            // Finally, delete the Shop
            const { error } = await supabaseClient
                .from('shops')
                .delete()
                .eq('shop_no', shopNo);

            if (error) throw error;

            console.log(`Cloud: Shop ${shopNo} deleted.`);
            alert(`Shop ${shopNo} deleted permanently.`);
        } catch (e) {
            console.error("Delete Shop Failed Check:", e);
            alert("Shop deleted locally, but Cloud Sync failed. It may reappear on refresh.");
        }
    },

    deletePaymentsForShop(shopNo) {
        let payments = this.getPayments();
        const initialCount = payments.length;
        payments = payments.filter(p => !this.idsMatch(p.shopNo, shopNo));

        if (payments.length !== initialCount) {
            localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
            console.log(`Cleaned up payments for deleted Shop/Applicant: ${shopNo}`);
        }
    },

    async terminateApplicant(shopNo, terminationRecord) {
        let applicants = this.getApplicants();
        // Use idsMatch
        const app = applicants.find(a => this.idsMatch(a.shopNo, shopNo));

        if (app) {
            // Save to History (Local only for now, unless extended)
            const historyRecord = {
                ...app,
                terminationDate: terminationRecord.date,
                terminationReason: terminationRecord.reason,
                terminatedAt: new Date().toISOString()
            };
            this.saveToHistory(historyRecord);

            // Use the ROBUST deleteApplicant to handle Cloud Sync/Cleanup
            await this.deleteApplicant(shopNo);
        } else {
            alert("Applicant not found for termination.");
        }
    },

    markShopAvailable(shopNo) {
        const shops = this.getShops();
        const shop = shops.find(s => s.shopNo === shopNo);
        if (shop) {
            shop.status = 'Available';
            localStorage.setItem(this.SHOPS_KEY, JSON.stringify(shops));
        }
    },

    async deletePayment(paymentId) {
        // 1. Local Cache
        let payments = this.getPayments();

        // Find the payment to verify ownership/shop
        const payToDelete = payments.find(p => p.timestamp === paymentId);

        payments = payments.filter(p => p.timestamp !== paymentId);
        localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));

        // 2. Cloud Sync
        const receiptIdentifier = payToDelete?.receiptId || payToDelete?.receiptNo;

        if (receiptIdentifier) {
            try {
                // Delete by receipt_no (which stores either receiptId or old receiptNo)
                const { error } = await supabaseClient
                    .from('payments')
                    .delete()
                    .eq('receipt_no', receiptIdentifier);

                if (error) throw error;
                console.log(`Cloud: Payment ${receiptIdentifier} deleted.`);
                alert("Transaction deleted successfully.");
            } catch (e) {
                console.error("Delete Payment Cloud Failed:", e);
                alert("Deleted locally, but Cloud Sync failed.");
            }
        } else {
            // If no receipt identifier, it might be a very old payment or local-only
            console.warn("Deleted payment had no receipt identifier, skipping Cloud delete (might be local only?)");
            alert("Transaction deleted locally (no cloud sync available).");
        }
    },

    deduplicatePayments() {
        const payments = this.getPayments();
        const unique = {};
        const cleaned = [];

        payments.forEach(p => {
            const key = `${p.shopNo}-${p.paymentForMonth}`;
            // Keep the LATEST one if duplicates exist (assuming newer is correction or just duplicate)
            // But if we want to be safe, just keep the first one found?
            // Actually, if we just overwrite, we keep the last one.
            unique[key] = p;
        });

        // Convert back to array
        for (const key in unique) {
            cleaned.push(unique[key]);
        }

        if (cleaned.length !== payments.length) {
            console.log(`Cleaned up ${payments.length - cleaned.length} duplicate payment records.`);
            localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(cleaned));
        }
    },

    /**
     * ONE-TIME MIGRATION: Assign standardized receipt IDs to old payments
     * This will NOT overwrite existing manual receipt numbers for cash payments
     * Run manually in console: Store.migrateOldReceiptIds()
     */
    async migrateOldReceiptIds() {
        console.log('🔄 Starting receipt ID migration...');

        const payments = this.getPayments();
        let updatedCount = 0;
        let skippedCount = 0;

        // Sort by payment date to assign sequential numbers in chronological order
        const sortedPayments = [...payments].sort((a, b) => {
            const dateA = new Date(a.paymentDate || a.timestamp);
            const dateB = new Date(b.paymentDate || b.timestamp);
            return dateA - dateB;
        });

        // Track counters per financial year
        const fyCounters = {};

        for (const payment of sortedPayments) {
            // Skip if already has receiptId (new payment)
            if (payment.receiptId) {
                skippedCount++;
                continue;
            }

            // Calculate FY from payment date
            const payDate = new Date(payment.paymentDate || payment.timestamp);
            const fy = this.getFinancialYearFromDate(payDate);

            // Initialize counter for this FY if not exists
            if (!fyCounters[fy]) {
                fyCounters[fy] = 0;
            }

            // Increment counter
            fyCounters[fy]++;

            // Generate receipt ID
            const paddedCounter = fyCounters[fy].toString().padStart(4, '0');
            payment.receiptId = `SUDA-${paddedCounter}/${fy}`;

            updatedCount++;
            console.log(`✓ ${payment.shopNo} (${payment.paymentForMonth}) → ${payment.receiptId}`);
        }

        // Save updated payments to localStorage
        this.cache.payments = payments;
        localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));

        // Update cloud database
        console.log('☁️ Syncing to cloud...');
        let cloudUpdated = 0;
        let cloudFailed = 0;

        for (const payment of sortedPayments) {
            if (!payment.receiptId) continue; // Skip ones we didn't update

            try {
                const { error } = await supabaseClient
                    .from('payments')
                    .update({ receipt_no: payment.receiptId })
                    .eq('shop_no', payment.shopNo)
                    .eq('payment_for_month', payment.paymentForMonth);

                if (error) throw error;
                cloudUpdated++;
            } catch (e) {
                console.error(`Failed to update ${payment.shopNo} - ${payment.paymentForMonth}:`, e);
                cloudFailed++;
            }
        }

        // Update localStorage counters for future payments
        console.log('📝 Updating counters for future use...');
        for (const [fy, count] of Object.entries(fyCounters)) {
            const counterKey = `receipt_counter_${fy}`;
            const currentCounter = parseInt(localStorage.getItem(counterKey) || '0');
            // Only update if our migrated count is higher
            if (count > currentCounter) {
                localStorage.setItem(counterKey, count.toString());
                console.log(`Set counter for ${fy}: ${count}`);
            }
        }

        console.log('✅ Migration complete!');
        console.log(`   Updated: ${updatedCount} payments`);
        console.log(`   Skipped: ${skippedCount} (already had receiptId)`);
        console.log(`   Cloud synced: ${cloudUpdated}`);
        if (cloudFailed > 0) {
            console.warn(`   Cloud failed: ${cloudFailed}`);
        }

        alert(`Migration Complete!\n\nUpdated: ${updatedCount} payments\nSkipped: ${skippedCount} (already updated)\nCloud synced: ${cloudUpdated}${cloudFailed > 0 ? `\nFailed: ${cloudFailed}` : ''}`);

        return { updatedCount, skippedCount, cloudUpdated, cloudFailed };
    }
    ,

    // Normalize stored payments to ensure numeric fields and paymentForMonth exist
    normalizePayments() {
        const payments = this.getPayments();
        if (!payments || payments.length === 0) return;

        const parseNumber = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'number') return v;
            const cleaned = String(v).replace(/[^0-9.\-]/g, '');
            const n = parseFloat(cleaned);
            return isNaN(n) ? 0 : n;
        };

        let changed = false;
        payments.forEach(p => {
            // Ensure numeric fields are stored as normalized strings with 2 decimals
            const gst = parseNumber(p.gstAmount || p.gst || 0);
            const rent = parseNumber(p.rentAmount || p.rentAmount || 0);
            const total = parseNumber(p.totalRent || p.grandTotal || 0);
            const penalty = parseNumber(p.penalty || 0);

            if (String(p.gstAmount) !== gst.toFixed(2)) { p.gstAmount = gst.toFixed(2); changed = true; }
            if (String(p.rentAmount) !== rent.toFixed(2)) { p.rentAmount = rent.toFixed(2); changed = true; }
            if (String(p.totalRent) !== total.toFixed(2)) { p.totalRent = total.toFixed(2); changed = true; }
            if (String(p.penalty) !== penalty.toFixed(2)) { p.penalty = penalty.toFixed(2); changed = true; }

            // Ensure paymentForMonth exists (YYYY-MM)
            if (!p.paymentForMonth && p.paymentDate) {
                try {
                    p.paymentForMonth = p.paymentDate.slice(0, 7);
                    changed = true;
                } catch (e) { }
            }

            // Ensure timestamp exists
            if (!p.timestamp) {
                p.timestamp = new Date().toISOString();
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
            // console.log('Store: normalized payments data');
        }
    },

    // Normalize remittances amounts to numeric strings
    normalizeRemittances() {
        const rems = this.getRemittances();
        if (!rems || rems.length === 0) return;

        const parseNumber = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'number') return v;
            const cleaned = String(v).replace(/[^0-9.\-]/g, '');
            const n = parseFloat(cleaned);
            return isNaN(n) ? 0 : n;
        };

        let changed = false;
        rems.forEach(r => {
            const amt = parseNumber(r.amount || 0);
            if (String(r.amount) !== amt.toFixed(2)) { r.amount = amt.toFixed(2); changed = true; }
            if (!r.date && r.timestamp) {
                // try to derive date from timestamp
                r.date = r.timestamp.slice(0, 10);
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(this.REMITTANCE_KEY, JSON.stringify(rems));
            console.log('Store: normalized remittances data');
        }
    },

    // ==========================================
    // BACKUP & RESTORE
    // ==========================================
    getAllData() {
        return {
            applicants: this.getApplicants(),
            payments: this.getPayments(),
            shops: this.getShops(),
            settings: this.getSettings(),
            remittances: this.getRemittances(),
            history: this.getHistory(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    },

    restoreData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid backup file format.');
        }

        // Basic Validation
        if (!Array.isArray(data.shops) || !Array.isArray(data.applicants)) {
            throw new Error('Backup file seems to be missing critical data (shops or applicants).');
        }

        try {
            // Restore Keys
            if (data.shops) localStorage.setItem(this.SHOPS_KEY, JSON.stringify(data.shops));
            if (data.applicants) localStorage.setItem(this.APPLICANTS_KEY, JSON.stringify(data.applicants));
            if (data.payments) localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(data.payments));
            if (data.settings) localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
            if (data.remittances) localStorage.setItem(this.REMITTANCE_KEY, JSON.stringify(data.remittances));
            if (data.history) localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.history));

            return true;
        } catch (e) {
            console.error(e);
            throw new Error('Failed to restore data to LocalStorage.');
        }
    }
};


// ==========================================
// ROUTER & CORE
// ==========================================
function initRouter() {
    const navBtns = document.querySelectorAll('.nav-btn');

    // Mobile Menu Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeMenu() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleMenu);
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(btn => {
        btn.addEventListener('click', () => {
            navLinks.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const menu = document.querySelector('.nav-menu');
            if (menu) menu.classList.remove('show');
            const target = btn.dataset.target;
            if (target) handleRoute(target);
        });
    });

    const mobBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('main-nav-menu');
    if (mobBtn && navMenu) {
        mobBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active-mobile');
        });
    }
}

// GLOBAL ROUTER (Exposed for HTML OnClick)
// window.handleRoute is automatically set by the function declaration below in non-module scripts

function handleRoute(route) {
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    contentArea.style.opacity = '0';
    setTimeout(() => {
        contentArea.style.opacity = '1';
    }, 50);

    switch (route) {
        case 'dashboard':
            pageTitle.textContent = 'Dashboard';
            DashboardModule.render(contentArea);
            break;
        case 'shop-module':
            pageTitle.textContent = 'Shop Management';
            ShopModule.render(contentArea);
            break;
        case 'applicant-module':
            pageTitle.textContent = 'Applicant Details';
            ApplicantModule.render(contentArea);
            break;
        case 'rent':
            pageTitle.textContent = 'Rent Collection';
            RentModule.render(contentArea);
            break;
        case 'report':
            pageTitle.textContent = 'Monthly Payment Reports';
            PaymentReportModule.render(contentArea);
            break;
        case 'dcb-report':
            pageTitle.textContent = 'DCB Reports';
            ReportModule.render(contentArea); // Call main render to show tabs
            break;
        case 'shop-ledger':
            pageTitle.textContent = 'Shop Ledger';
            ShopLedgerModule.render(contentArea);
            break;
        case 'gst-monthwise':
            pageTitle.textContent = 'GST Month-wise Report';
            GstMonthwiseReportModule.render(contentArea);
            break;
        case 'notices':
            pageTitle.textContent = 'Notices';
            NoticeModule.render(contentArea); // Assuming NoticeModule exists
            break;
        case 'settings':
            pageTitle.textContent = 'Settings';
            SettingsModule.render(contentArea);
            break;
        case 'gst-remittance':
            pageTitle.textContent = 'GST Remittance';
            GstRemittanceModule.render(contentArea);
            break;
        case 'lease-agreement':
            pageTitle.textContent = 'Lease Agreement Status';
            LeaseStatusModule.render(contentArea);
            break;
        case 'waiver-module':
            pageTitle.textContent = 'Penalty Waivers';
            WaiverModule.render(contentArea);
            break;
        case 'invoices':
            pageTitle.textContent = 'Monthly Invoices';
            InvoiceModule.render(contentArea);
            break;

        default:
            pageTitle.textContent = 'Dashboard';
            DashboardModule.render(contentArea);
    }
}

// ==========================================
// DASHBOARD MODULE [NEW - ANALYTICS]
// ==========================================
const DashboardModule = {
    render(container) {
        container.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 0.5rem;">Analytics Overview</h3>
                <p style="color: var(--text-muted);">Real-time financial pulse and tenant performance.</p>
            </div>

            <!-- KEY METRICS GRID -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- 1. Gross Revenue (FY) -->
                <div class="glass-panel" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color: rgba(255,255,255,0.8); font-size: 0.85rem; text-transform: uppercase;">Total Revenue (FY)</h4>
                            <div style="font-size: 1.8rem; font-weight: bold; margin-top: 0.5rem;">₹<span id="kpi-revenue">0</span></div>
                        </div>
                        <span style="font-size: 1.5rem;">💰</span>
                    </div>
                </div>

                <!-- 2. Collection Efficiency -->
                <div class="glass-panel" style="background: white; border-left: 4px solid #10b981;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color: #64748b; font-size: 0.85rem; text-transform: uppercase;" id="kpi-efficiency-title">Collection Efficiency</h4>
                            <div style="font-size: 1.8rem; font-weight: bold; margin-top: 0.5rem; color: #1e293b;"><span id="kpi-efficiency">0</span>%</div>
                            <small id="kpi-efficiency-sub" style="color: #94a3b8; font-size: 0.8rem;">Target: 100%</small>
                        </div>
                        <div style="height: 40px; width: 40px; border-radius: 50%; border: 3px solid #10b981; display:flex; align-items:center; justify-content:center; color:#10b981; font-weight:bold;">%</div>
                    </div>
                </div>

                <!-- 3. Critical Defaulters -->
                <div class="glass-panel" style="background: white; border-left: 4px solid #ef4444;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color: #64748b; font-size: 0.85rem; text-transform: uppercase;">Critical Defaulters</h4>
                            <div style="font-size: 1.8rem; font-weight: bold; margin-top: 0.5rem; color: #ef4444;"><span id="kpi-defaulters">0</span></div>
                            <small style="color: #94a3b8; font-size: 0.8rem;">> 2 Months Pending</small>
                        </div>
                        <span style="font-size: 1.5rem;">⚠️</span>
                    </div>
                </div>

                <!-- 4. Occupancy -->
                <div class="glass-panel" style="background: white; border-left: 4px solid #3b82f6;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color: #64748b; font-size: 0.85rem; text-transform: uppercase;">Occupancy</h4>
                            <div style="font-size: 1.8rem; font-weight: bold; margin-top: 0.5rem; color: #1e293b;"><span id="kpi-occupied">0</span>/<span id="kpi-total">0</span></div>
                            <small style="color: #94a3b8; font-size: 0.8rem;">Shops Occupied</small>
                        </div>
                        <span style="font-size: 1.5rem;">🏪</span>
                    </div>
                </div>
            </div>

            <!-- CHARTS SECTION -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="charts-container">
                <div class="glass-panel">
                    <h4 style="margin-bottom: 1rem; color: var(--text-color);">Monthly Revenue Trend</h4>
                    <div style="height: 300px; position: relative;">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
                <!-- REPLACED PAYMENT MODES WITH RECENT TRANSACTIONS -->
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                        <h4 style="color: var(--text-color);">Last 5 Payments</h4>
                        <button class="btn-primary" onclick="handleRoute('report')" style="padding: 4px 10px; font-size: 0.75rem;">View All</button>
                    </div>
                    <div class="table-container" style="max-height: 250px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th style="text-align:right;">Amount</th>
                                    <th style="text-align:right;">Date</th>
                                </tr>
                            </thead>
                            <tbody id="dash-recent-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- BOTTOM SECTION: TOP DEFAULTERS & EXPIRING LEASES -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- Top Defaulters -->
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                        <h4 style="color: var(--text-color);">Top Defaulters</h4>
                        <button class="btn-primary" onclick="handleRoute('dcb-report')" style="padding: 4px 10px; font-size: 0.75rem;">View All</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Name</th>
                                    <th style="text-align:right;">Pending Due</th>
                                </tr>
                            </thead>
                            <tbody id="dash-defaulters-list"></tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Expiring Leases -->
                 <div class="glass-panel">
                    <h4 style="margin-bottom: 1rem; color: var(--text-color);">Leases Expiring Soon (< 30 Days)</h4>
                    <div class="table-container">
                         <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Expiry Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="dash-expiry-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        this.loadAnalytics();
    },

    loadAnalytics() {
        const shops = Store.getShops();
        const payments = Store.getPayments();
        const applicants = Store.getApplicants();

        // 1. Current FY Logic
        const today = new Date();
        const curMonth = today.getMonth();
        const startYear = curMonth >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const fyYear = startYear; // FY year for calculations
        const fyStart = new Date(startYear, 3, 1);
        const fyEnd = new Date(startYear + 1, 2, 31);

        // --- KPI 1: Revenue ---
        let totalRev = 0;

        payments.forEach(p => {
            const pDate = new Date(p.paymentDate || p.timestamp);
            if (pDate >= fyStart && pDate <= fyEnd) {
                const amt = parseFloat(p.grandTotal || 0);
                totalRev += amt;
            }
        });
        document.getElementById('kpi-revenue').textContent = totalRev.toLocaleString('en-IN'); // Format

        // --- KPI 4: Occupancy ---
        const total = shops.length;
        const occ = shops.filter(s => s.status === 'Occupied').length;
        document.getElementById('kpi-total').textContent = total;
        document.getElementById('kpi-occupied').textContent = occ;

        // --- KPI 2 & 3: Efficiency & Defaulters ---
        // We need 'Expected Monthly Collection' vs 'Actual'.
        // Simple heuristic: Sum of Rent+GST for all Active Tenants = Monthly Demand.
        let monthlyDemand = 0;
        let defaulters = [];
        let totalDues = 0;

        applicants.forEach(app => {
            // Determine monthly rent
            const rent = parseFloat(app.rentTotal || 0);
            monthlyDemand += rent;

            // Check details for defaulters using Unified Logic
            const dues = Store.calculateOutstandingDues(app); // Uses dynamic GST info now
            if (dues.totalAmount > 100) { // Tolerance
                // Check month count
                if (dues.monthsCount > 2) {
                    defaulters.push({ ...app, dues: dues.totalAmount, months: dues.monthsCount });
                }
            }
        });

        // Collection Efficiency (Financial Year)
        // Calculate Total Demand and Total Collection for FY (aligned with DCB logic)
        let totalFyDemand = 0;
        let totalFyCollection = 0;

        // Get settings for penalty calculation
        const settings = Store.getSettings();
        const penaltyRate = settings.penaltyRate || 15;
        const implementationDate = settings.penaltyDate ? new Date(settings.penaltyDate) : new Date('2018-01-01');

        // Define FY dates
        const fromDate = new Date(fyYear, 3, 1); // April 1st
        const toDate = new Date(fyYear + 1, 2, 31); // March 31st

        applicants.forEach(app => {
            // Use ReportModule.calculateDCBForApplicant for same logic as DCB report
            const dcb = ReportModule.calculateDCBForApplicant(app, fromDate, toDate, payments, penaltyRate, implementationDate);
            totalFyDemand += dcb.totalDemand;
            totalFyCollection += dcb.totalCollection;
        });

        const efficiency = totalFyDemand > 0 ? ((totalFyCollection / totalFyDemand) * 100) : 0;
        document.getElementById('kpi-efficiency-title').textContent = `Collection Efficiency (F.Y - ${fyYear}-${String(fyYear + 1).slice(-2)})`;
        document.getElementById('kpi-efficiency').textContent = Math.min(100, efficiency).toFixed(0);
        document.getElementById('kpi-efficiency-sub').textContent = `Collected: ₹${totalFyCollection.toLocaleString('en-IN')} / ₹${totalFyDemand.toLocaleString('en-IN')}`;


        // Defaulters Count
        document.getElementById('kpi-defaulters').textContent = defaulters.length;

        // --- TOP DEFAULTERS TABLE ---
        defaulters.sort((a, b) => b.dues - a.dues); // Descending
        const top5 = defaulters.slice(0, 5);
        document.getElementById('dash-defaulters-list').innerHTML = top5.map(d => `
            <tr>
                <td><strong>${d.shopNo}</strong></td>
                <td>${d.applicantName}</td>
                <td style="text-align:right; color:#ef4444; font-weight:bold;">₹${d.dues.toLocaleString('en-IN')}</td>
            </tr>
        `).join('') || '<tr><td colspan="3" style="text-align:center; color:green;">No critical defaulters.</td></tr>';


        // --- EXPIRING SOON ---
        const expiring = applicants.filter(app => {
            if (!app.expiryDate) return false;
            const exp = new Date(app.expiryDate);
            const diff = (exp - today) / (1000 * 60 * 60 * 24);
            return diff > 0 && diff < 30;
        });
        document.getElementById('dash-expiry-list').innerHTML = expiring.map(d => `
            <tr>
                <td>${d.shopNo}</td>
                <td>${d.expiryDate}</td>
                <td><button class="btn-primary" style="padding:2px 8px; font-size:0.7rem;">Renew</button></td>
            </tr>
        `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No leases expiring soon.</td></tr>';


        // --- CHART 1: REVENUE TREND (Last 6 Months) ---
        const ctxRev = document.getElementById('revenueChart');
        if (ctxRev && window.Chart) {
            const labels = [];
            const data = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                labels.push(d.toLocaleString('default', { month: 'short' }));

                // Sum payments made in this month (Cash Flow)
                const monthTotal = payments
                    .filter(p => p.paymentDate && p.paymentDate.startsWith(mStr))
                    .reduce((sum, p) => sum + (parseFloat(p.grandTotal || 0)), 0);
                data.push(monthTotal);
            }

            new Chart(ctxRev, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cash Flow (₹)',
                        data: data,
                        backgroundColor: '#6366f1',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // --- 3. RECENT TRANSACTIONS LIST (Last 5) ---
        // Sort ALL payments by date descending (Global, not just FY)
        // Create a copy to avoid mutating the original store array if it's a direct reference
        const allPayments = [...payments];

        const sortedPayments = allPayments.sort((a, b) => {
            const dateA = new Date(a.paymentDate || a.timestamp || 0);
            const dateB = new Date(b.paymentDate || b.timestamp || 0);
            return dateB - dateA;
        }).slice(0, 5);

        const listBody = document.getElementById('dash-recent-list');
        if (listBody) {
            if (sortedPayments.length === 0) {
                listBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No recent payments.</td></tr>';
            } else {
                listBody.innerHTML = sortedPayments.map(p => {
                    let dStr = p.paymentDate || p.timestamp;
                    let dateDisplay = '-';
                    if (dStr) {
                        const d = new Date(dStr);
                        if (!isNaN(d.getTime())) {
                            dateDisplay = d.toLocaleDateString('en-GB');
                        }
                    }
                    const shop = shops.find(s => s.id === p.shopId);
                    // PRIORITIZE p.shopNo from record, fallback to lookup
                    const shopNo = p.shopNo || (shop ? shop.shopNo : 'N/A');
                    const amt = parseFloat(p.grandTotal || 0).toFixed(2);

                    return `
                        <tr>
                            <td style="font-weight: 500;">Shop No. ${shopNo}</td>
                            <td style="text-align:right; color: #166534; font-weight: 600;">₹${amt}</td>
                            <td style="text-align:right; font-size: 0.9rem; color: #64748b;">${dateDisplay}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }
};

// ==========================================
// SHOP MODULE [NEW]
// ==========================================
const ShopModule = {
    render(container) {
        container.innerHTML = `
    < div class="glass-panel" >
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Shop Inventory</h3>
                    <button class="btn-primary" id="btn-add-shop">
                        <span style="margin-right: 0.5rem;">+</span> Add Shop
                    </button>
                </div>
                
                <div id="shop-form-container" style="display: none; margin-bottom: 2rem;">
                     <div class="glass-panel" style="background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6);">
                        <h4 style="margin-bottom: 1.5rem; color: var(--primary-color);">Add New Shop</h4>
                        <form id="shop-form">
                            <div class="form-group">
                                <label class="form-label">Shop Number</label>
                                <input type="text" name="shopNo" class="form-input" required placeholder="e.g. S-101">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Shop Area / Dimensions</label>
                                <input type="text" name="dimensions" class="form-input" placeholder="e.g. 200 sqft">
                            </div>
                             <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                <button type="button" class="btn-primary" style="background: #94a3b8;" id="btn-shop-cancel">Cancel</button>
                                <button type="submit" class="btn-primary">Save Shop</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Shop No</th>
                                <th>Dimensions</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="shop-list-body">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
            </div >
    `;

        this.setupLogic();
        this.renderList();
    },

    setupLogic() {
        const formContainer = document.getElementById('shop-form-container');
        const form = document.getElementById('shop-form');

        // Add Logic
        document.getElementById('btn-add-shop').addEventListener('click', () => {
            formContainer.style.display = 'block';
            document.getElementById('btn-add-shop').style.display = 'none';
        });

        document.getElementById('btn-shop-cancel').addEventListener('click', () => {
            formContainer.style.display = 'none';
            document.getElementById('btn-add-shop').style.display = 'block';
        });

        // Save
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.status = 'Available';

            try {
                Store.saveShop(data);
                alert('Shop added!');
                form.reset();
                formContainer.style.display = 'none';
                document.getElementById('btn-add-shop').style.display = 'block';
                this.renderList();
            } catch (err) {
                alert(err.message);
            }
        });

        // Delete Logic (Event Delegation)
        document.getElementById('shop-list-body').addEventListener('click', (e) => {
            const target = e.target;

            // DELETE
            if (target.closest('.btn-delete-shop')) {
                const btn = target.closest('.btn-delete-shop');
                const shopNo = btn.dataset.shop;
                if (confirm(`Are you sure you want to delete Shop ${shopNo}? This cannot be undone.`)) {
                    Store.deleteShop(shopNo);
                    this.renderList();
                }
            }
            // TERMINATE & RENEW REMOVED (Moved to Lease Agreement Status Module)
        });
    },

    renderList() {
        const shops = Store.getShops();
        const tbody = document.getElementById('shop-list-body');

        if (shops.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No shops found. Add one.</td></tr>';
            return;
        }

        tbody.innerHTML = shops.map(s => `
            <tr>
                <td><strong>${s.shopNo}</strong></td>
                <td>${s.dimensions || '-'}</td>
                <td><span style="padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; background: ${s.status === 'Occupied' ? '#fecaca' : '#d1fae5'}; color: ${s.status === 'Occupied' ? '#dc2626' : '#059669'};">${s.status}</span></td>
                <td>
                    <button class="btn-delete-shop" data-shop="${s.shopNo}" style="background:none; border:none; cursor:pointer;" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
    `).join('');
    }
};

// ==========================================
// APPLICANT MODULE
// ==========================================
const ApplicantModule = {
    render(container) {
        container.innerHTML = `
    < div class="glass-panel" >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Applicant Details</h3>
                    <button class="btn-primary" id="btn-add-applicant">
                        <span style="margin-right: 0.5rem;">+</span> New Applicant
                    </button>
                </div>
                
                <div id="applicant-form-container" style="display: none; margin-bottom: 2rem;">
                    <!-- Form injected here -->
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Shop No</th>
                                <th>Applicant Name</th>
                                <th>Type</th>
                                <th>Rent (Total)</th>
                                <th>Lease Expiry</th>
                                <th>Due Day</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="applicant-list-body">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
            </div >
    `;

        document.getElementById('btn-add-applicant').addEventListener('click', () => {
            this.showForm(); // Must render form first
            document.getElementById('applicant-form').reset();
            this.populateShopSelect();
        });

        // Event Delegation for Edit/Delete
        document.getElementById('applicant-list-body').addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-app')) {
                const shopNo = e.target.closest('.btn-delete-app').dataset.shop;
                if (confirm(`Delete applicant and free up shop ${shopNo}?`)) {
                    Store.deleteApplicant(shopNo);
                    this.renderList();
                }
            }
            if (e.target.closest('.btn-edit-app')) {
                const shopNo = e.target.closest('.btn-edit-app').dataset.shop;
                this.loadApplicantForEdit(shopNo);
            }
        });

        this.renderList();
    },



    populateShopSelect() {
        const shops = Store.getShops();
        // Filter AVAILABLE shops
        const availableShops = shops.filter(s => s.status === 'Available');

        const select = document.getElementById('applicant-shop-select');
        select.innerHTML = '<option value="">-- Select Shop --</option>';

        if (availableShops.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = 'No Shops Available (Create in Shop Master)';
            select.appendChild(opt);
            return;
        }

        availableShops.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.shopNo;
            opt.textContent = `${s.shopNo} (${s.dimensions || 'Std'})`;
            select.appendChild(opt);
        });
    },

    showForm() {
        const container = document.getElementById('applicant-form-container');
        container.style.display = 'block';
        document.getElementById('btn-add-applicant').style.display = 'none';

        container.innerHTML = `
    < div class="glass-panel" style = "background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6);" >
                <h4 style="margin-bottom: 1.5rem; color: var(--primary-color);">New Shop Lease Registration</h4>
                <form id="applicant-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        
                        <!-- Shop Details -->
                        <div class="form-group">
                            <label class="form-label">Select Shop (Available)</label>
                            <select name="shopNo" id="applicant-shop-select" class="form-select" required>
                                <option value="">-- Select Shop --</option>
                                <!-- Dynamic Options -->
                            </select>
                            <small class="form-label" style="color: var(--text-muted); margin-top: 4px;">Only available shops are shown.</small>
                        </div>
                         <div class="form-group">
                            <label class="form-label">Zone / Authority</label>
                            <input type="text" class="form-input" value="Siddipet Urban Development Authority" readonly>
                        </div>

                        <!-- Applicant Basic -->
                        <div class="form-group">
                            <label class="form-label">Applicant Name</label>
                            <input type="text" name="applicantName" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mobile Number</label>
                            <input type="text" name="mobileNo" class="form-input" pattern="\\d{10}" title="10 Digit Mobile Number" placeholder="9876543210" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input type="email" name="email" class="form-input" placeholder="tenant@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Applicant Type</label>
                            <select name="applicantType" id="applicantType" class="form-select">
                                <option value="Individual">Individual</option>
                                <option value="Proprietor">Proprietor</option>
                            </select>
                        </div>

                        <!-- Proprietor Specific -->
                        <div class="form-group type-proprietor" style="display: none;">
                            <label class="form-label">Shop Name (Proprietor)</label>
                            <input type="text" name="proprietorShopName" class="form-input">
                        </div>
                        <div class="form-group type-proprietor" style="display: none;">
                            <label class="form-label">Shop GST Number</label>
                            <input type="text" name="shopGst" class="form-input">
                        </div>

                        <!-- ID Proofs -->
                        <div class="form-group">
                            <label class="form-label">PAN Number</label>
                            <input type="text" name="pan" class="form-input" placeholder="ABCDE1234F">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Aadhar Number (12 Digits)</label>
                            <input type="text" name="aadhar" class="form-input" pattern="\\d{12}" title="12 Digit Aadhar Number" placeholder="1234 5678 9012">
                        </div>

                        <div class="form-group" style="grid-column: span 2;">
                            <label class="form-label">Address</label>
                            <textarea name="address" class="form-input" rows="2"></textarea>
                        </div>

                        <!-- Financials -->
                        <div class="form-group">
                            <label class="form-label">Rent Amount (Excl. GST)</label>
                            <input type="number" name="rentBase" id="rentBase" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">GST Amount (18%)</label>
                            <input type="number" name="gstAmount" id="gstAmount" class="form-input" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Total Rent</label>
                            <input type="number" name="rentTotal" id="rentTotal" class="form-input" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Monthly Payment Due Date</label>
                            <select name="paymentDay" class="form-select" required>
                                <option value="">Select Day (1-31)</option>
                                ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Dates -->
                        <div class="form-group">
                            <label class="form-label">Lease Start Date</label>
                            <input type="date" name="leaseDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Lease Expiry Date</label>
                            <input type="date" name="expiryDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Agreement Date</label>
                            <input type="date" name="agreementDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Rent Applicable From</label>
                            <input type="date" name="rentStartDate" class="form-input" id="rent-start-date">
                        </div>
                        <div class="form-group" id="group-occupancy-date" style="display: none;">
                            <label class="form-label">Original Occupancy Date (History)</label>
                            <input type="date" name="occupancyStartDate" class="form-input" id="occupancy-start-date" title="This is only for fixing historical data issues.">
                        </div>
                        <div class="form-group" id="group-rent-history" style="display: none; grid-column: span 2;">
                            <label class="form-label">Rent History (Advanced JSON)</label>
                            <textarea name="rentHistoryJSON" class="form-input" rows="3" placeholder='[{"startDate":"2023-01-01","endDate":"2024-01-01","rentTotal":1000}]'></textarea>
                            <small style="color:red;">WARNING: Only edit if you know what you are doing.</small>
                        </div>

                        <!-- AGREEMENT UPLOAD -->
                        <div class="form-group" style="grid-column: span 2; border-top: 1px dashed #cbd5e1; padding-top: 1rem; margin-top: 1rem;">
                            <label class="form-label">Upload Lease Agreement (PDF/Image)</label>
                            <input type="file" id="agreement-upload" class="form-input" accept=".pdf,image/*">
                            <small style="color: var(--text-muted);">Max 5MB. Will be stored securely in cloud.</small>
                            <div id="current-agreement-link" style="margin-top: 5px; font-size: 0.9rem;"></div>
                        </div>

                    </div>

                    <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="btn-primary" style="background: #94a3b8;" id="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">Save Applicant</button>
                    </div>
                </form>
            </div >
    `;

        this.setupFormLogic();
        this.setupListEvents();
    },

    setupListEvents() {
        const tbody = document.getElementById('applicant-list-body');
        if (!tbody) return;

        // Use Event Delegation
        tbody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-app');
            const editBtn = e.target.closest('.btn-edit-app');

            if (deleteBtn) {
                const shopNo = deleteBtn.dataset.shop;
                if (confirm(`Are you sure you want to PERMANENTLY delete the applicant for Shop ${shopNo} ?\n\nThis will: \n1.Remove tenant data.\n2.Mark shop as Available.\n3.Delete associated payments.`)) {
                    Store.deleteApplicant(shopNo);
                    this.renderList();
                    // Refill Shop Select (since a shop became available)
                    this.populateShopSelect();
                }
            } else if (editBtn) {
                const shopNo = editBtn.dataset.shop;
                this.loadApplicantForEdit(shopNo);
            }
        });
    },

    setupFormLogic() {
        const form = document.getElementById('applicant-form');
        const container = document.getElementById('applicant-form-container');

        // Reset form state when closed
        const resetUI = () => {
            container.style.display = 'none';
            document.getElementById('btn-add-applicant').style.display = 'block';
            // Re-enable shop select
            const shopSel = form.querySelector('[name="shopNo"]');
            shopSel.style.pointerEvents = 'auto';
            shopSel.style.background = 'white';
            form.reset();
        };

        // Cancel
        document.getElementById('btn-cancel').addEventListener('click', resetUI);

        // Type Toggle
        const typeSelect = form.querySelector('#applicantType');
        const propFields = form.querySelectorAll('.type-proprietor');

        typeSelect.addEventListener('change', () => {
            const isProp = typeSelect.value === 'Proprietor';
            propFields.forEach(el => el.style.display = isProp ? 'block' : 'none');
        });

        // Rent Calc
        const rentBase = form.querySelector('#rentBase');
        const gstAmount = form.querySelector('#gstAmount');
        const rentTotal = form.querySelector('#rentTotal');

        rentBase.addEventListener('input', () => {
            const val = parseFloat(rentBase.value) || 0;
            const gst = val * 0.18;
            const total = val + gst;

            gstAmount.value = gst.toFixed(2);
            rentTotal.value = total.toFixed(2);
        });

        // Submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveApplicantForm(new FormData(form));
        });
    },

    saveApplicantForm(formData) {
        const data = Object.fromEntries(formData.entries());
        data.createdAt = new Date().toISOString();

        // Map shopGst field to gstNo
        if (data.shopGst) {
            data.gstNo = data.shopGst;
            delete data.shopGst;
        }

        // Handle Lease History JSON if present (for manual fixes)
        // Note: Field name is still 'rentHistoryJSON' in HTML but we map it to leaseHistory
        if (data.rentHistoryJSON) {
            try {
                // If empty or just whitespace, ignore
                if (!data.rentHistoryJSON.trim()) {
                    delete data.rentHistoryJSON;
                } else {
                    const history = JSON.parse(data.rentHistoryJSON);
                    if (Array.isArray(history)) {
                        data.leaseHistory = history;
                    } else {
                        alert('Invalid History format: Must be an array [].');
                        return;
                    }
                    delete data.rentHistoryJSON;
                }
            } catch (e) {
                alert('Invalid JSON in History field: ' + e.message);
                return;
            }
        }

        if (data.aadhar && !/^\d{12}$/.test(data.aadhar)) {
            alert('Aadhar number must be exactly 12 digits.');
            return;
        }

        // --- FILE UPLOAD LOGIC ---
        const fileInput = document.getElementById('agreement-upload');
        const file = fileInput.files[0];

        const proceedWithSave = async () => {
            try {
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const shopClean = data.shopNo.replace(/[^a-zA-Z0-9]/g, '');
                    const filePath = `${shopClean}_${Date.now()}.${fileExt} `;

                    // Upload via Store helper
                    // Note: uploadFile returns the public URL
                    data.agreementUrl = await Store.uploadFile(file, filePath);
                }

                Store.saveApplicant(data);

                // Success Response
                alert('Applicant saved successfully!');

                // Close Form
                const container = document.getElementById('applicant-form-container');
                const form = document.getElementById('applicant-form');

                container.style.display = 'none';
                document.getElementById('btn-add-applicant').style.display = 'block';

                // Reset styling and form
                if (form) {
                    const shopSel = form.querySelector('[name="shopNo"]');
                    if (shopSel) {
                        shopSel.style.pointerEvents = 'auto';
                        shopSel.style.background = 'white';
                    }
                    form.reset();
                }

                this.renderList();

            } catch (err) {
                console.error(err);
                alert('Save Failed: ' + (err.message || 'Unknown error'));
            }
        };

        proceedWithSave();
    },

    loadApplicantForEdit(shopNo) {
        console.log("Loading for Edit:", shopNo);
        const app = Store.getApplicants().find(a => a.shopNo === shopNo);
        if (!app) { console.error("App not found"); return; }

        this.showForm();
        this.populateShopSelect(); // Ensure connection to master list

        const form = document.getElementById('applicant-form');

        // Populate
        const shopSel = form.querySelector('[name="shopNo"]');

        console.log("Current Shop Value:", app.shopNo, "Select Options:", shopSel.options.length);

        // FIX: If the shop is Occupied, it won't be in the 'Available' list.
        // We must manually add it as an option so the value can be set.
        let optionExists = Array.from(shopSel.options).some(opt => opt.value === String(app.shopNo));
        if (!optionExists) {
            console.log("Option missing, adding manually.");
            const opt = document.createElement('option');
            opt.value = app.shopNo;
            opt.textContent = `${app.shopNo} (Current)`;
            shopSel.appendChild(opt);
        } else {
            console.log("Option exists.");
        }

        shopSel.value = app.shopNo;
        shopSel.style.pointerEvents = 'none';
        shopSel.style.background = '#f1f5f9';

        form.querySelector('[name="applicantName"]').value = app.applicantName;
        form.querySelector('[name="applicantName"]').value = app.applicantName;
        form.querySelector('[name="mobileNo"]').value = app.contactNo || app.mobileNo;
        if (form.elements['email']) form.elements['email'].value = app.email || '';

        const typeSel = form.querySelector('[name="applicantType"]');
        typeSel.value = app.applicantType || 'Individual';
        typeSel.dispatchEvent(new Event('change'));

        form.querySelector('[name="proprietorShopName"]').value = app.proprietorName || app.proprietorShopName || '';
        form.querySelector('[name="shopGst"]').value = app.gstNo || '';

        form.querySelector('[name="pan"]').value = app.panNo || '';
        form.querySelector('[name="aadhar"]').value = app.aadharNo || '';
        form.querySelector('[name="address"]').value = app.address || '';

        const rBase = form.querySelector('#rentBase');
        rBase.value = app.rentBase;
        rBase.dispatchEvent(new Event('input')); // Trigger GST calc

        form.querySelector('[name="paymentDay"]').value = app.paymentDay;
        form.querySelector('[name="leaseDate"]').value = app.leaseDate;
        form.querySelector('[name="expiryDate"]').value = app.expiryDate;
        form.querySelector('[name="agreementDate"]').value = app.agreementDate;
        form.querySelector('[name="rentStartDate"]').value = app.rentStartDate;

        if (app.occupancyStartDate) {
            form.querySelector('[name="occupancyStartDate"]').value = app.occupancyStartDate;
            document.getElementById('group-occupancy-date').style.display = 'block';
        }

        // Show Current Agreement Link if exists
        const linkDiv = document.getElementById('current-agreement-link');
        if (linkDiv) {
            if (app.agreementUrl) {
                linkDiv.innerHTML = `< a href = "${app.agreementUrl}" target = "_blank" style = "color: #2563eb; text-decoration: underline;" >📄 View Current Agreement</a > `;
            } else {
                linkDiv.innerHTML = '';
            }
        }
    },

    renderList() {
        const applicants = Store.getApplicants();
        const tbody = document.getElementById('applicant-list-body');

        if (applicants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No applicants info found.</td></tr>';
            return;
        }

        tbody.innerHTML = applicants.map(app => `
            <tr>
                <td><strong>${app.shopNo}</strong></td>
                <td>${app.applicantName}</td>
                <td><span style="font-size: 0.85rem; padding: 2px 8px; background: #e0e7ff; border-radius: 4px; color: #4338ca;">${app.applicantType}</span></td>
                <td>₹${app.rentTotal}</td>
                <td>${app.expiryDate}</td>
                <td>${app.paymentDay}th</td>
                 <td>
                    <button class="btn-edit-app" data-shop="${app.shopNo}" style="background:none; border:none; cursor:pointer; margin-right:8px;" title="Edit">✏️</button>
                    <button class="btn-delete-app" data-shop="${app.shopNo}" style="background:none; border:none; cursor:pointer; color:#dc2626;" title="Delete">🗑️</button>
                 </td>
            </tr>
    `).join('');
    }
};

// ==========================================
// RENT MODULE
// ==========================================
const RentModule = {
    render(container) {
        container.innerHTML = `
    < div class="glass-panel" >
                <h3>Rent Collection</h3>
                
                <div style="margin-top: 1.5rem; max-width: 600px;">
                    <div class="form-group">
                        <label class="form-label">Select Shop / Applicant</label>
                        <select id="shop-select" class="form-select">
                            <option value="">-- Select Shop --</option>
                        </select>
                    </div>

                    <div id="payment-details-area" style="display: none; animation: fadeIn 0.3s ease;">
                        <div class="glass-panel" style="background: rgba(255,255,255,0.5); padding: 1.5rem;">
                            <h4 style="margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">Payment Details</h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                <div>
                                    <label class="form-label">Shop No</label>
                                    <input type="text" id="disp-shop-no" class="form-input" readonly>
                                </div>
                                <div>
                                    <label class="form-label">Applicant Name</label>
                                    <input type="text" id="disp-name" class="form-input" readonly>
                                </div>
                                 <div>
                                    <label class="form-label">Rent (Base)</label>
                                    <input type="text" id="disp-rent" class="form-input" readonly>
                                </div>
                                <div>
                                    <label class="form-label">GST (18%)</label>
                                    <input type="text" id="disp-gst" class="form-input" readonly>
                                </div>
                                <div style="grid-column: span 2;">
                                    <label class="form-label">Total Monthly Rent</label>
                                    <input type="text" id="disp-total" class="form-input" style="font-weight: bold; color: var(--primary-color);" readonly>
                                </div>
                            </div>

                            <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 1.5rem 0;">

                            <div class="form-group">
                                <label class="form-label">Payment For Months (Select Multiple)</label>
                                <div id="month-checkboxes" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 0.5rem; border-radius: 4px; background: rgba(255,255,255,0.8);">
                                    <!-- Checkboxes -->
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Payment Date</label>
                                <input type="date" id="payment-date" class="form-input">
                                <small id="due-date-hint" style="color: var(--text-muted); display: block; margin-top: 4px;"></small>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="penalty-amount">Total Delay Penalty (₹15/day)</label>
                                <input type="number" id="penalty-amount" class="form-input" style="color: #ef4444;" value="0">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Total Payable Amount</label>
                                <input type="text" id="final-payable" class="form-input" style="font-size: 1.2rem; font-weight: bold; color: #047857;" readonly>
                            </div>

                            <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 1.5rem 0;">

                            <div class="form-group">
                                <label class="form-label">Payment Method</label>
                                <select id="payment-method" class="form-select" style="font-weight: 500;">
                                    <option value="">-- Select Payment Method --</option>
                                    <option value="cash">Cash</option>
                                    <option value="dd-cheque">DD/Cheque</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>

                            <!-- Conditional Fields Container -->
                            <div id="payment-method-fields">
                                <!-- Cash: SUDA Receipt No -->
                                <div id="cash-fields" style="display: none;">
                                    <div class="form-group">
                                        <label class="form-label">SUDA Receipt No.</label>
                                        <input type="text" id="receipt-no" class="form-input" placeholder="e.g., RCP-2025-001">
                                    </div>
                                </div>

                                <!-- DD/Cheque: DD/Cheque No & Date -->
                                <div id="dd-cheque-fields" style="display: none;">
                                    <div class="form-group">
                                        <label class="form-label">DD/Cheque No.</label>
                                        <input type="text" id="dd-cheque-no" class="form-input" placeholder="e.g., CHQ123456">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">DD/Cheque Date</label>
                                        <input type="date" id="dd-cheque-date" class="form-input">
                                    </div>
                                </div>

                                <!-- Online: Transaction No -->
                                <div id="online-fields" style="display: none;">
                                    <div class="form-group">
                                        <label class="form-label">Online Transaction No.</label>
                                        <input type="text" id="transaction-no" class="form-input" placeholder="e.g., TXN20251223001">
                                    </div>
                                </div>
                            </div>

                            <button id="btn-collect-payment" class="btn-primary" style="width: 100%; margin-top: 1rem;">Record Payment</button>
                        </div>
                    </div>
                </div>
            </div>
                </div >
            </div >

            < !--PAYMENT HISTORY SECTION-- >
            <div id="payment-history-area" style="display: none; margin-top: 2rem; max-width: 800px;">
                <div class="glass-panel">
                    <h4 style="margin-bottom: 1rem;">Payment History</h4>
                    <div id="payment-history-list"></div>
                </div>
            </div>

            <div style="margin-top: 2rem; max-width: 800px;">
                <div class="glass-panel">
                    <h4>Recent Payments (Today)</h4>
                    <div id="recent-payments-list" style="margin-top: 1rem;">
                        <p class="text-muted">No payments recorded today.</p>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
`;

        this.populateShopSelect();
        this.setupLogic();
        this.updateRecentList();
    },

    updateRecentList() {
        const container = document.getElementById('recent-payments-list');
        if (!container) return;

        const payments = Store.getPayments();
        const todayStr = new Date().toISOString().split('T')[0];
        // Filter for payments made TODAY
        const recent = payments.filter(p => p.paymentDate === todayStr || (p.timestamp && p.timestamp.startsWith(todayStr))).reverse(); // Show newest first

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 1rem;">No payments recorded today.</p>';
            return;
        }

        let html = `
    < table class="data-table" style = "font-size: 0.9rem;" >
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Shop</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        recent.forEach(p => {
            // Fix: timestamp might have a suffix like "-0" (e.g. 2024-03-20T10:00:00.000Z-0) which breaks Date parsing
            let validTs = p.timestamp;
            if (typeof validTs === 'string' && validTs.includes('Z-')) {
                validTs = validTs.split('Z-')[0] + 'Z';
            }
            const time = !isNaN(new Date(validTs).getTime()) ? new Date(validTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            html += `
                <tr>
                    <td>${time}</td>
                    <td>${p.shopNo}</td>
                    <td>${p.paymentForMonth}</td>
                    <td>₹${p.grandTotal}</td>
                    <td>
                        <button class="btn-primary" style="padding: 2px 8px; font-size: 0.8rem; background: #64748b;" onclick="RentModule.printReceiptFor('${p.timestamp}')">
                            🖨 Print Receipt
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table > ';
        container.innerHTML = html;

        // Helper exposed globally now as a static method
    },

    printReceiptFor(ts) {
        const allPayments = Store.getPayments();
        const target = allPayments.find(p => p.timestamp === ts);
        if (target) {
            const app = Store.getApplicants().find(a => a.shopNo === target.shopNo);
            if (window.ReceiptModule) {
                window.ReceiptModule.printReceipt(target, app);
            } else {
                alert('Receipt Module not loaded yet.');
            }
        }
    },

    populateShopSelect() {
        const applicants = Store.getApplicants();
        const select = document.getElementById('shop-select');

        applicants.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.shopNo;
            opt.textContent = `${app.shopNo} - ${app.applicantName}`;
            select.appendChild(opt);
        });
    },

    setupLogic() {
        const select = document.getElementById('shop-select');
        const monthContainer = document.getElementById('month-checkboxes'); // CHANGED
        const detailsArea = document.getElementById('payment-details-area');
        const dateInput = document.getElementById('payment-date');
        const penaltyInput = document.getElementById('penalty-amount');
        const finalInput = document.getElementById('final-payable');
        const btnCollect = document.getElementById('btn-collect-payment');
        const paymentMethodSelect = document.getElementById('payment-method');

        let currentApplicant = null;

        // Payment Method dropdown listener
        paymentMethodSelect.addEventListener('change', () => {
            const method = paymentMethodSelect.value;
            document.getElementById('cash-fields').style.display = method === 'cash' ? 'block' : 'none';
            document.getElementById('dd-cheque-fields').style.display = method === 'dd-cheque' ? 'block' : 'none';
            document.getElementById('online-fields').style.display = method === 'online' ? 'block' : 'none';

            // Clear fields when switching methods
            if (method !== 'cash') document.getElementById('receipt-no').value = '';
            if (method !== 'dd-cheque') {
                document.getElementById('dd-cheque-no').value = '';
                document.getElementById('dd-cheque-date').value = '';
            }
            if (method !== 'online') document.getElementById('transaction-no').value = '';
        });

        select.addEventListener('change', () => {
            const shopNo = select.value;
            if (!shopNo) {
                detailsArea.style.display = 'none';
                currentApplicant = null;
                return;
            }

            const applicants = Store.getApplicants();
            currentApplicant = applicants.find(a => a.shopNo === shopNo);

            if (currentApplicant) {
                if (document.getElementById('disp-shop-no')) document.getElementById('disp-shop-no').value = currentApplicant.shopNo;
                if (document.getElementById('disp-name')) document.getElementById('disp-name').value = currentApplicant.applicantName;
                if (document.getElementById('disp-rent')) document.getElementById('disp-rent').value = currentApplicant.rentBase;
                if (document.getElementById('disp-gst')) document.getElementById('disp-gst').value = currentApplicant.gstAmount;
                if (document.getElementById('disp-total')) document.getElementById('disp-total').value = currentApplicant.rentTotal;

                this.populateMonths(currentApplicant, monthContainer); // CHANGED

                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
                if (document.getElementById('due-date-hint')) document.getElementById('due-date-hint').textContent = '';

                detailsArea.style.display = 'block';
                penaltyInput.value = '0';
                finalInput.value = '0.00'; // Reset total

                // Initial Calc
                this.calcPenalty(currentApplicant, monthContainer, dateInput, penaltyInput, finalInput);

                // Show History
                this.renderHistory(currentApplicant.shopNo);
                document.getElementById('payment-history-area').style.display = 'block';
            }
        });

        const settings = Store.getSettings();
        const lbl = document.querySelector('label[for="penalty-amount"]');
        if (lbl) lbl.textContent = `Total Delay Penalty (₹${settings.penaltyRate}/day)`;

        // Recalc triggers: Checkbox Change, Date Change, Penalty Input
        monthContainer.addEventListener('change', () => {
            if (currentApplicant) this.calcPenalty(currentApplicant, monthContainer, dateInput, penaltyInput, finalInput);
        });

        dateInput.addEventListener('change', () => {
            if (currentApplicant) this.calcPenalty(currentApplicant, monthContainer, dateInput, penaltyInput, finalInput);
        });

        penaltyInput.addEventListener('input', () => {
            if (currentApplicant) {
                // When manual penalty input, we just add it to Base TOTAL of selected months
                // We need to know Base first.
                // Re-run calc but override penalty? No, easier to just sum base + new penalty
                this.calcPenalty(currentApplicant, monthContainer, dateInput, penaltyInput, finalInput, true);
            }
        });

        btnCollect.addEventListener('click', async () => {
            if (!currentApplicant) { return; }

            const checkedBoxes = Array.from(monthContainer.querySelectorAll('input[type="checkbox"]:checked'));
            if (checkedBoxes.length === 0) {
                alert('Please select at least one month to pay.');
                return;
            }

            // We need to calculate finalized amounts for EACH month.
            // Logic: Distribute the Total Penalty? 
            // Or better: Calculate individually like we do in calcPenalty loop.

            // If user manually edited Penalty, how do we distribute it?
            // Simple rule: If manual edit, split equally or just apply to first?
            // Let's assume standard auto-calc for save unless we want complex logic.
            // User requirement: "Option to select multiple months".
            // If user changes penalty manually, it's a "Total Penalty".
            // We will save it as a "Bulk Payment" or individal?
            // Store format is per-month.
            // Strategy: Save individual records. If total penalty is manual, we might lose per-month accuracy.
            // Let's stick to Auto-Calc for individual records to keep integrity.
            // If user overrides, we apply the override to the BATCH (e.g. add to last month or split).

            const settings = Store.getSettings();
            const rate = parseFloat(settings.penaltyRate) || 15;
            const paymentDateVal = dateInput.value;
            const paymentDate = new Date(paymentDateVal);
            const dueDay = parseInt(currentApplicant.paymentDay);

            // Check Manual Penalty Override
            const currentAutoPenalty = parseFloat(penaltyInput.dataset.autoVal || 0); // specific to our logic
            const currentInputPenalty = parseFloat(penaltyInput.value) || 0;
            const isManual = Math.abs(currentAutoPenalty - currentInputPenalty) > 0.1;

            // If manual, we split the difference among selected months?
            // Or just add difference to the last one.
            let difference = isManual ? (currentInputPenalty - currentAutoPenalty) : 0;

            // Validate payment method
            const paymentMethod = paymentMethodSelect.value;
            if (!paymentMethod) {
                alert('Please select a Payment Method.');
                return;
            }

            // Validate payment method specific fields
            if (paymentMethod === 'cash' && !document.getElementById('receipt-no').value.trim()) {
                alert('Please enter SUDA Receipt No. for Cash payment.');
                return;
            }
            if (paymentMethod === 'dd-cheque') {
                if (!document.getElementById('dd-cheque-no').value.trim()) {
                    alert('Please enter DD/Cheque No.');
                    return;
                }
                if (!document.getElementById('dd-cheque-date').value) {
                    alert('Please enter DD/Cheque Date.');
                    return;
                }
            }
            if (paymentMethod === 'online' && !document.getElementById('transaction-no').value.trim()) {
                alert('Please enter Online Transaction No.');
                return;
            }

            let successCount = 0;

            // Async Save Loop
            // Show Loading State
            const originalText = btnCollect.textContent;
            btnCollect.textContent = "Saving... (Syncing Cloud)";
            btnCollect.disabled = true;

            try {
                for (const [index, cb] of checkedBoxes.entries()) {
                    const monthVal = cb.value; // "YYYY-MM"
                    const [year, month] = monthVal.split('-');

                    // Construct Target Date
                    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 15, 12, 0, 0);
                    const targetDueDate = new Date(parseInt(year), parseInt(month) - 1, dueDay);

                    // --- LEASE HISTORY LOOKUP ---
                    let rBase = parseFloat(currentApplicant.rentBase);
                    let rGst = parseFloat(currentApplicant.gstAmount);
                    let rTotal = parseFloat(currentApplicant.rentTotal);

                    let historyFound = false;

                    if (currentApplicant.leaseHistory && currentApplicant.leaseHistory.length > 0) {
                        const match = currentApplicant.leaseHistory.find(block => {
                            const start = block.startDate ? new Date(block.startDate + 'T12:00:00') : new Date('1900-01-01');
                            const end = block.endDate ? new Date(block.endDate + 'T12:00:00') : new Date('2999-12-31');
                            return targetDate >= start && targetDate < end;
                        });

                        if (match) {
                            rBase = parseFloat(match.rentBase);
                            rGst = parseFloat(match.gstAmount);
                            rTotal = parseFloat(match.rentTotal);
                            // console.log(`Using Lease History Block [${match.periodLabel}] for ${monthVal}: ${rTotal}`);
                            historyFound = true;
                        }
                    } else if (currentApplicant.rentHistory && currentApplicant.rentHistory.length > 0) {
                        const match = currentApplicant.rentHistory.find(h => {
                            const start = h.startDate ? new Date(h.startDate + 'T12:00:00') : new Date('1900-01-01');
                            const end = h.endDate ? new Date(h.endDate + 'T12:00:00') : new Date('2999-12-31');
                            return targetDate >= start && targetDate < end;
                        });

                        if (match) {
                            rBase = parseFloat(match.rentBase);
                            rGst = parseFloat(match.gstAmount);
                            rTotal = parseFloat(match.rentTotal);
                            // console.log(`Using Legacy Rent History for ${monthVal}: ${rTotal}`);
                            historyFound = true;
                        }
                    }

                    if (!historyFound) {
                        const currentRentStart = currentApplicant.rentStartDate ? new Date(currentApplicant.rentStartDate + 'T12:00:00') : null;
                        if (currentRentStart && targetDate < currentRentStart) {
                            console.warn(`WARNING: No History for ${monthVal}. Using current rent.`);
                        }
                    }

                    // --- PENALTY CALC ---
                    let p = 0;
                    if (!isManual) {
                        // Auto-Calculate if NOT manual
                        const paymentDateObj = new Date(paymentDateVal); // Use parsed val
                        if (paymentDateObj > targetDueDate) {
                            const diffTime = Math.abs(paymentDateObj - targetDueDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            // Calc: Flat Rate (Days * Rate)
                            p = diffDays * rate;
                        }
                    }

                    // Manual Penalty Distribution (Add to last item)
                    if (isManual && index === checkedBoxes.length - 1) {
                        p = currentInputPenalty;
                    }

                    // --- ASYNC ID GENERATION ---
                    // This waits for Cloud to confirm ID
                    const newReceiptId = await Store.getNextReceiptNumberAsync();

                    const payment = {
                        shopNo: currentApplicant.shopNo,
                        rentAmount: rBase.toFixed(2),
                        gstAmount: rGst.toFixed(2),
                        totalRent: rTotal.toFixed(2),
                        paymentForMonth: monthVal,
                        paymentDate: paymentDateVal,
                        penalty: p.toFixed(2),
                        grandTotal: (rTotal + p).toFixed(2),
                        timestamp: new Date().toISOString() + '-' + index, // Unique ID

                        receiptId: newReceiptId, // Using the new Cloud ID

                        paymentMethod: paymentMethod,
                        receiptNo: paymentMethod === 'cash' ? document.getElementById('receipt-no').value.trim() : null,
                        ddChequeNo: paymentMethod === 'dd-cheque' ? document.getElementById('dd-cheque-no').value.trim() : null,
                        ddChequeDate: paymentMethod === 'dd-cheque' ? document.getElementById('dd-cheque-date').value : null,
                        transactionNo: paymentMethod === 'online' ? document.getElementById('transaction-no').value.trim() : null
                    };

                    await Store.savePayment(payment);
                    successCount++;
                } // End Loop

            } catch (err) {
                console.error("Payment Save Error:", err);
                alert("Error saving payment. Check internet connection.");
            } finally {
                btnCollect.textContent = originalText;
                btnCollect.disabled = false;
            }

            if (successCount > 0) {
                alert(`Successfully recorded payments for ${successCount} months!`);

                // Reset UI
                select.value = '';
                paymentMethodSelect.value = '';
                document.getElementById('receipt-no').value = '';
                document.getElementById('dd-cheque-no').value = '';
                document.getElementById('dd-cheque-date').value = '';
                document.getElementById('transaction-no').value = '';
                document.getElementById('cash-fields').style.display = 'none';
                document.getElementById('dd-cheque-fields').style.display = 'none';
                document.getElementById('online-fields').style.display = 'none';
                const savedShopNo = currentApplicant.shopNo;

                detailsArea.style.display = 'none';
                currentApplicant = null;

                // Refund/Update Logic
                this.updateRecentList();
                if (savedShopNo) {
                    this.renderHistory(savedShopNo); // Refresh History
                }
            }
        });
    },

    renderHistory(shopNo) {
        const container = document.getElementById('payment-history-list');
        if (!container) return;

        const payments = Store.getShopPayments(shopNo).reverse(); // Newest first

        if (payments.length === 0) {
            container.innerHTML = '<p class="text-muted">No payment history found.</p>';
            return;
        }

        let html = `
            <table class="data-table" style="font-size: 0.9rem;">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Receipt No</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        payments.forEach(p => {
            // Fix timestamp for date display if needed
            let dateDisplay = p.paymentDate;

            // Receipt ID Display (Fallback if missing)
            const recId = p.receiptId || 'REC-OLD';

            html += `
                <tr>
                    <td>${dateDisplay}</td>
                    <td>${p.paymentForMonth}</td>
                    <td>₹${p.grandTotal}</td>
                    <td><span style="font-family:monospace; font-size:0.85rem;">${recId}</span></td>
                    <td>
                        <button class="btn-primary" style="padding: 2px 8px; font-size: 0.8rem; background: #64748b;" onclick="RentModule.printReceiptFor('${p.timestamp}')">
                            🖨 Print
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    populateMonths(applicant, container) {
        container.innerHTML = ''; // Clear

        // Fix: Use occupancyStartDate if available to show full history, otherwise fallback to rentStart or leaseDate
        const start = applicant.occupancyStartDate ? new Date(applicant.occupancyStartDate) : (applicant.rentStartDate ? new Date(applicant.rentStartDate) : new Date(applicant.leaseDate));

        const expiry = new Date(applicant.expiryDate);
        const today = new Date();
        const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        let end = currentMonthEnd < expiry ? currentMonthEnd : expiry;

        const payments = Store.getShopPayments(applicant.shopNo);
        const paidMonths = new Set(payments.map(p => p.paymentForMonth));

        let current = new Date(start);
        current.setDate(1);

        while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const val = `${year}-${month}`;

            const display = current.toLocaleString('default', { month: 'long', year: 'numeric' });

            const isPaid = paidMonths.has(val);

            if (isPaid) {
                // User wants to FILTER OUT paid months completely
                current.setMonth(current.getMonth() + 1);
                continue;
            }

            const div = document.createElement('div');
            div.style.marginBottom = '4px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = val;
            checkbox.id = `chk-${val}`;


            const label = document.createElement('label');
            label.htmlFor = `chk-${val}`;
            label.style.marginLeft = '8px';
            label.textContent = `${display} ${isPaid ? '(✅ PAID)' : '(Pending)'}`;
            label.style.color = isPaid ? 'green' : 'inherit';

            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);

            current.setMonth(current.getMonth() + 1);
        }
    },

    calcPenalty(currentApplicant, monthContainer, dateInput, penaltyInput, finalInput, manualOverride = false) {
        // If manualOverride is true, we ONLY update finalInput based on penaltyInput value.
        // We do NOT recalculate penalty from dates.

        const checkedBoxes = Array.from(monthContainer.querySelectorAll('input[type="checkbox"]:checked:not([disabled])'));

        let totalBaseRent = 0;
        let totalPenalty = 0;
        let lateInfo = [];
        let totalLateDays = 0;

        // PREPARATION
        const paymentDateVal = dateInput.value;
        const paymentDate = paymentDateVal ? new Date(paymentDateVal) : null;
        const settings = Store.getSettings();
        const rate = parseFloat(settings.penaltyRate) || 15;
        const dueDay = parseInt(currentApplicant.paymentDay);

        // ALWAYS calculate Base Rent correctly (History Aware)
        let lastSeenBase = currentApplicant.rentBase;
        let lastSeenGst = currentApplicant.gstAmount;
        let lastSeenTotal = currentApplicant.rentTotal;

        checkedBoxes.forEach(cb => {
            const [year, month] = cb.value.split('-');

            // --- RENT LOOKUP (History Aware) ---
            const targetDate = new Date(parseInt(year), parseInt(month) - 1, 15, 12, 0, 0);

            let rBase = parseFloat(currentApplicant.rentBase); // Default
            let rGst = parseFloat(currentApplicant.gstAmount);
            let rTotal = parseFloat(currentApplicant.rentTotal);

            if (currentApplicant.leaseHistory && currentApplicant.leaseHistory.length > 0) {
                const match = currentApplicant.leaseHistory.find(block => {
                    const start = block.startDate ? new Date(block.startDate + 'T12:00:00') : new Date('1900-01-01');
                    const end = block.endDate ? new Date(block.endDate + 'T12:00:00') : new Date('2999-12-31');
                    return targetDate >= start && targetDate < end;
                });
                if (match) {
                    rBase = parseFloat(match.rentBase);
                    rGst = parseFloat(match.gstAmount);
                    rTotal = parseFloat(match.rentTotal);
                }
            }
            else if (currentApplicant.rentHistory && currentApplicant.rentHistory.length > 0) {
                const match = currentApplicant.rentHistory.find(h => {
                    const start = h.startDate ? new Date(h.startDate + 'T12:00:00') : new Date('1900-01-01');
                    const end = h.endDate ? new Date(h.endDate + 'T12:00:00') : new Date('2999-12-31');
                    return targetDate >= start && targetDate < end;
                });
                if (match) {
                    rBase = parseFloat(match.rentBase);
                    rGst = parseFloat(match.gstAmount);
                    rTotal = parseFloat(match.rentTotal);
                }
            }

            lastSeenBase = rBase;
            lastSeenGst = rGst;
            lastSeenTotal = rTotal;

            totalBaseRent += rTotal;

            // --- PENALTY CALC (Accumulate Auto) ---
            if (!manualOverride && paymentDate) {
                const targetDueDate = new Date(parseInt(year), parseInt(month) - 1, dueDay);
                if (paymentDate > targetDueDate) {
                    const diffTime = Math.abs(paymentDate - targetDueDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const p = diffDays * rate;
                    totalPenalty += p;
                    totalLateDays += diffDays;
                    lateInfo.push(`${cb.value}: ${diffDays} days`);
                }
            }
        });

        // --- DYNAMIC UI UPDATES ---
        if (checkedBoxes.length === 1) {
            if (document.getElementById('disp-rent')) document.getElementById('disp-rent').value = lastSeenBase;
            if (document.getElementById('disp-gst')) document.getElementById('disp-gst').value = lastSeenGst;
            if (document.getElementById('disp-total')) document.getElementById('disp-total').value = lastSeenTotal;
        } else {
            // Revert to Current Applicant Default
            if (document.getElementById('disp-rent')) document.getElementById('disp-rent').value = currentApplicant.rentBase;
            if (document.getElementById('disp-gst')) document.getElementById('disp-gst').value = currentApplicant.gstAmount;
            if (document.getElementById('disp-total')) document.getElementById('disp-total').value = currentApplicant.rentTotal;
        }

        // Handle Manual Penalty Override
        if (manualOverride) {
            totalPenalty = parseFloat(penaltyInput.value) || 0;
            finalInput.value = (totalBaseRent + totalPenalty).toFixed(2);
            return;
        }

        penaltyInput.value = totalPenalty.toFixed(2);
        penaltyInput.dataset.autoVal = totalPenalty; // Store for ref

        finalInput.value = (totalBaseRent + totalPenalty).toFixed(2);

        // Update hint
        const hint = document.getElementById('due-date-hint');
        if (hint) {
            if (lateInfo.length > 0) {
                hint.textContent = `Total Delay: ${totalLateDays} Days. Penalty included.`;
                hint.style.color = '#ef4444';
            } else {
                hint.textContent = 'No penalties.';
                hint.style.color = 'green';
            }
        }
    }
};

// ==========================================
// REPORT MODULE
// ==========================================
// ==========================================


window.RentModule = RentModule;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.checkSession();
});
