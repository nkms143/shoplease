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
    HISTORY_KEY: 'suda_shop_history',

    // --- CACHE & INIT ---
    cache: {
        shops: [],
        applicants: [],
        payments: [],
        settings: { penaltyRate: 16, penaltyDate: '2025-01-01', logoUrl: null }, // Default
        remittances: [],
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
                timestamp: row.created_at
            }));

            // Load Settings/Remittances from LocalStorage for now (or move to DB later)
            // Ideally, settings should be in DB too, but let's keep it simple for this phase.
            // We'll stick to LocalStorage for Settings/History to save DB rows.
            const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
            if (savedSettings) this.cache.settings = JSON.parse(savedSettings);

            const savedRemittances = localStorage.getItem(this.REMITTANCE_KEY);
            if (savedRemittances) this.cache.remittances = JSON.parse(savedRemittances);

            // console.log("Store: Data Loaded", this.cache);
        } catch (e) {
            console.error("Store Init Failed:", e);
            alert("Failed to load data from Cloud. Using Offline/Empty state.");
        }
    },


    getRemittances() {
        return this.cache.remittances; // From Cache
    },

    saveRemittance(remittance) {
        this.cache.remittances.push(remittance);
        localStorage.setItem(this.REMITTANCE_KEY, JSON.stringify(this.cache.remittances));
        // TODO: Create 'remittances' table in Supabase
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

    saveSettings(settings) {
        this.cache.settings = settings;
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
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
            receipt_no: payment.receiptId || payment.receiptNo
        };

        try {
            const { error } = await supabaseClient.from('payments').insert(dbPay);
            if (error) throw error;
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
    getNextReceiptNumber() {
        const financialYear = this.getCurrentFinancialYear();
        const counterKey = `receipt_counter_${financialYear}`;

        // Get current counter for this financial year
        let counter = parseInt(localStorage.getItem(counterKey) || '0');
        counter++;

        // Save updated counter
        localStorage.setItem(counterKey, counter.toString());

        // Format: SUDA-0001/2025-26
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
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
    }

    // Close when clicking overlay
    overlay.addEventListener('click', closeMenu);

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Close Menu on Mobile Selection
            closeMenu();

            // Route
            const target = btn.dataset.target;
            handleRoute(target);
        });
    });

    // Default route: Check if already on a route or default to dashboard
    handleRoute('dashboard');
}

function handleRoute(route) {
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    // Fade effect
    contentArea.style.opacity = '0';
    setTimeout(() => {
        contentArea.style.opacity = '1';
    }, 50);

    switch (route) {
        case 'dashboard':
            pageTitle.textContent = 'Dashboard';
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
            ReportModule.renderDCB(contentArea); // Call renderDCB directly
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

        default:
            pageTitle.textContent = 'Dashboard';
            DashboardModule.render(contentArea);
    }
}

// ==========================================
// DASHBOARD MODULE [NEW]
// ==========================================
const DashboardModule = {
    render(container) {
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- KPI Cards -->
                <div class="glass-panel" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white;">
                    <h4 style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Total Revenue</h4>
                    <div style="font-size: 2rem; font-weight: bold; margin-top: 0.5rem;">₹<span id="kpi-revenue">0</span></div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.5rem; display:none;">+12% from last month</div>
                </div>

                <div class="glass-panel" style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white;">
                    <h4 style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Total Shops</h4>
                    <div style="font-size: 2rem; font-weight: bold; margin-top: 0.5rem;"><span id="kpi-shops">0</span></div>
                     <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.5rem;">
                        <span id="kpi-occupied">0</span> Occupied / <span id="kpi-available">0</span> Available
                    </div>
                </div>

                <div class="glass-panel" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white;">
                    <h4 style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Pending Dues</h4>
                    <div style="font-size: 2rem; font-weight: bold; margin-top: 0.5rem;">₹<span id="kpi-dues">0</span></div>
                   <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.5rem;">Estimated Arrears</div>
                </div>
            </div>

            <!-- Charts Section -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div class="glass-panel">
                    <h4 style="margin-bottom: 1rem; color: var(--text-color);">Revenue Trend (Last 6 Months)</h4>
                    <div style="height: 300px; position: relative;">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
                <div class="glass-panel">
                    <h4 style="margin-bottom: 1rem; color: var(--text-color);">Shop Occupancy</h4>
                    <div style="height: 250px; position: relative; display: flex; align-items: center; justify-content: center;">
                        <canvas id="occupancyChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="glass-panel">
                <h4 style="margin-bottom: 1rem; color: var(--text-color);">Recent Payments</h4>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Shop No</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="dash-recent-list"></tbody>
                    </table>
                </div>
            </div>
        `;

        this.loadData();
    },

    loadData() {
        const shops = Store.getShops();
        const payments = Store.getPayments();
        const applicants = Store.getApplicants();

        // --- KPI: Shops ---
        const totalShops = shops.length;
        const occupied = shops.filter(s => s.status === 'Occupied').length;
        const available = totalShops - occupied;

        document.getElementById('kpi-shops').textContent = totalShops;
        document.getElementById('kpi-occupied').textContent = occupied;
        document.getElementById('kpi-available').textContent = available;

        // --- KPI: Revenue (Current FY Only) ---
        // Determine Current FY
        const today = new Date();
        const curMonth = today.getMonth(); // 0-11
        const startYear = curMonth >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const fyStart = new Date(startYear, 3, 1); // April 1st
        const fyEnd = new Date(startYear + 1, 2, 31); // March 31st next year

        let totalRev = 0;
        payments.forEach(p => {
            // Use paymentDate if available, else timestamp
            const pDateStr = p.paymentDate || p.timestamp;
            if (pDateStr) {
                const pDate = new Date(pDateStr);
                if (pDate >= fyStart && pDate <= fyEnd) {
                    totalRev += (parseFloat(p.grandTotal || p.totalRent || 0) || 0);
                }
            }
        });
        document.getElementById('kpi-revenue').textContent = totalRev.toLocaleString('en-IN');
        // Update label to reflect scope
        const kpiLabel = document.querySelector('#kpi-revenue').parentNode.previousElementSibling;
        if (kpiLabel) kpiLabel.textContent = `Revenue (FY ${startYear}-${String(startYear + 1).slice(-2)})`;


        // --- KPI: Dues Estimate ---
        const duesEl = document.getElementById('kpi-dues');

        // Calculate Total Pending Dues (Matching DCB Report Logic)
        if (typeof ReportModule !== 'undefined' && ReportModule.calculateDCBForApplicant) {
            const settings = Store.getSettings();
            const penaltyRate = parseFloat(settings.penaltyRate) || 15;
            const impDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;

            let totalPending = 0;
            try {
                applicants.forEach(app => {
                    // Use ReportModule logic to ensure Dashboard matches DCB Report "Total Balance"
                    const res = ReportModule.calculateDCBForApplicant(app, fyStart, fyEnd, payments, penaltyRate, impDate);
                    totalPending += (res.totalBalance || 0);
                });
                duesEl.textContent = totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) {
                console.error("Dashboard dues calc error:", e);
                duesEl.textContent = "View Reports";
            }
        } else {
            console.warn("ReportModule not loaded, falling back to simple view");
            duesEl.textContent = "View Reports";
        }

        duesEl.style.fontSize = "2rem";
        duesEl.style.textDecoration = "none";
        duesEl.style.cursor = "pointer";
        duesEl.title = "Click to view full DCB Report";

        duesEl.parentElement.onclick = () => {
            // Navigate to DCB Report
            const btn = document.querySelector('.nav-btn[data-target="dcb-report"]');
            if (btn) btn.click();
        };

        // --- CHART: Revenue Trend ---


        // --- CHART: Revenue Trend ---
        const ctxRev = document.getElementById('revenueChart');
        if (ctxRev && window.Chart) {
            // Get last 6 months labels
            const labels = [];
            const data = [];
            const today = new Date();

            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                labels.push(label);

                // Sum payments for this month
                const monthlyTotal = payments
                    .filter(p => (p.paymentForMonth === monthStr) || (p.paymentDate && p.paymentDate.startsWith(monthStr)))
                    .reduce((sum, p) => sum + (parseFloat(p.grandTotal || 0) || 0), 0);
                data.push(monthlyTotal);
            }

            new Chart(ctxRev, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: data,
                        backgroundColor: '#6366f1',
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { borderDash: [2, 4], color: '#e2e8f0' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // --- CHART: Occupancy ---
        const ctxOcc = document.getElementById('occupancyChart');
        if (ctxOcc && window.Chart) {
            new Chart(ctxOcc, {
                type: 'doughnut',
                data: {
                    labels: ['Occupied', 'Available'],
                    datasets: [{
                        data: [occupied, available],
                        backgroundColor: ['#10b981', '#cbd5e1'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    cutout: '70%'
                }
            });
        }

        // --- LIST: Recent Payments ---
        // Sort by paymentDate desc (primary)
        const sortedPayments = [...payments].sort((a, b) => {
            const dateA = new Date(a.paymentDate || a.timestamp || 0);
            const dateB = new Date(b.paymentDate || b.timestamp || 0);
            return dateB - dateA;
        }).slice(0, 5); // Take top 5

        const listBody = document.getElementById('dash-recent-list');
        if (sortedPayments.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center">No payments recorded yet.</td></tr>';
        } else {
            listBody.innerHTML = sortedPayments.map(p => {
                let dStr = p.paymentDate || p.timestamp;
                let dateDisplay = '-';
                if (dStr) {
                    const d = new Date(dStr);
                    if (!isNaN(d.getTime())) {
                        // FORCE DD-MM-YYYY format
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        dateDisplay = `${day}-${month}-${year}`;
                    }
                }
                return `
                <tr>
                    <td>${dateDisplay}</td>
                    <td><strong>${p.shopNo}</strong></td>
                    <td>₹${(parseFloat(p.grandTotal || 0)).toFixed(2)}</td>
                    <td><span style="font-size:0.75rem; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px;">Paid</span></td>
                </tr>
            `}).join('');
        }
    }
};

// ==========================================
// SHOP MODULE [NEW]
// ==========================================
const ShopModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
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
            </div>
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
            <div class="glass-panel">
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
            </div>
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
            <div class="glass-panel" style="background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6);">
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
            </div>
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
                if (confirm(`Are you sure you want to PERMANENTLY delete the applicant for Shop ${shopNo}?\n\nThis will:\n1. Remove tenant data.\n2. Mark shop as Available.\n3. Delete associated payments.`)) {
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
                    const filePath = `${shopClean}_${Date.now()}.${fileExt}`;

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
        form.querySelector('[name="mobileNo"]').value = app.contactNo || app.mobileNo;

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
                linkDiv.innerHTML = `<a href="${app.agreementUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">📄 View Current Agreement</a>`;
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
            <div class="glass-panel">
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
                </div>
            </div>

            <!-- PAYMENT HISTORY SECTION -->
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
            <table class="data-table" style="font-size: 0.9rem;">
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

        html += '</tbody></table>';
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

        btnCollect.addEventListener('click', () => {
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

            checkedBoxes.forEach((cb, index) => {
                const monthVal = cb.value; // "YYYY-MM"
                const [year, month] = monthVal.split('-');

                // Construct Target Date: Use the 15th of the month for checking "Applicable Rent"
                // This ensures we check the rent effective during the month.
                // Using NOON (12:00) to avoid any timezone shifting to previous day.
                const targetDate = new Date(parseInt(year), parseInt(month) - 1, 15, 12, 0, 0);
                const targetDueDate = new Date(parseInt(year), parseInt(month) - 1, dueDay); // Keep for penalty calc if needed

                // --- LEASE HISTORY LOOKUP (Renewal Blocks) ---
                let rBase = parseFloat(currentApplicant.rentBase);
                let rGst = parseFloat(currentApplicant.gstAmount);
                let rTotal = parseFloat(currentApplicant.rentTotal);

                // Check History Blocks first
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
                        console.log(`Using Lease History Block [${match.periodLabel}] for ${monthVal}: ${rTotal}`);
                        historyFound = true;
                    }
                }
                // Fallback to old rentHistory if leaseHistory missing (Legacy Support)
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
                        console.log(`Using Legacy Rent History for ${monthVal}: ${rTotal}`);
                        historyFound = true;
                    }
                }

                if (!historyFound) {
                    const currentRentStart = currentApplicant.rentStartDate ? new Date(currentApplicant.rentStartDate + 'T12:00:00') : null;
                    if (currentRentStart && targetDate < currentRentStart) {
                        // Warn user that history is missing for this old month
                        console.warn(`WARNING: No History found for ${monthVal}. Using Current Rent (${rTotal}).`);
                        // Ideally we should show this in UI, but alert might be too intrusive if looping.
                        // Let's rely on the user checking the 'History Blocks' table we are about to build.
                    }
                }

                let p = 0;
                if (!isManual) {
                    // Auto-Calculate if NOT manual
                    if (paymentDate > targetDueDate) {
                        const diffTime = Math.abs(paymentDate - targetDueDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        p = diffDays * rate;
                    }
                }

                // If Manual, we put the ENTIRE manual penalty on the LAST month
                // and 0 on others (since we initialized p=0 above)
                if (isManual && index === checkedBoxes.length - 1) {
                    p = currentInputPenalty;
                }

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
                    // Generate Standardized Receipt ID: SUDA-0001/2025-26
                    receiptId: Store.getNextReceiptNumber(),
                    // Payment Method Details
                    paymentMethod: paymentMethod,
                    receiptNo: paymentMethod === 'cash' ? document.getElementById('receipt-no').value.trim() : null,
                    ddChequeNo: paymentMethod === 'dd-cheque' ? document.getElementById('dd-cheque-no').value.trim() : null,
                    ddChequeDate: paymentMethod === 'dd-cheque' ? document.getElementById('dd-cheque-date').value : null,
                    transactionNo: paymentMethod === 'online' ? document.getElementById('transaction-no').value.trim() : null
                };

                Store.savePayment(payment);
                successCount++;
            });

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
            detailsArea.style.display = 'none';
            currentApplicant = null;
            detailsArea.style.display = 'none';
            currentApplicant = null;

            // Refund/Update Logic
            this.updateRecentList();
            this.renderHistory(currentApplicant.shopNo); // Refresh History
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
// PAYMENT REPORT MODULE (Previously ReportModule)
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

        // Helper to safely parse numeric fields
        const parseNum = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'number') return v;
            const s = String(v).replace(/[^0-9.\-]/g, '');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        };

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
            const rentAmount = parseNum(p.rentAmount || p.rentBase || 0);
            const gstAmount = parseNum(p.gstAmount || p.gst || 0);
            const penalty = parseNum(p.penalty || 0);
            const grandTotal = parseNum(p.grandTotal || p.totalRent || 0);

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

        // Helper to safely parse numeric fields
        const parseNum = (v) => {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'number') return v;
            const s = String(v).replace(/[^0-9.\-]/g, '');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        };

        // Helper to format payment method details
        const formatPaymentMethod = (p) => {
            if (!p.paymentMethod) return '-';
            if (p.paymentMethod === 'cash') {
                // For cash, try manual receiptNo first, then fall back to receiptId
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
            const rentAmount = parseNum(p.rentAmount || p.rentBase || 0);
            const gstAmount = parseNum(p.gstAmount || p.gst || 0);
            const penalty = parseNum(p.penalty || 0);
            const grandTotal = parseNum(p.grandTotal || p.totalRent || 0);

            totalCollected += grandTotal;
            totalBaseRent += rentAmount;
            totalGST += gstAmount;
            totalPenalty += penalty;

            return `
                <tr>
                    <td><strong>${p.paymentForMonth || '-'}</strong></td>
                    <td>${p.paymentDate || '-'}</td>
                    <td><strong>${p.shopNo}</strong></td>
                    <td>₹${rentAmount.toFixed(2)}</td>
                    <td>₹${gstAmount.toFixed(2)}</td>
                    <td style="color: ${penalty > 0 ? '#ef4444' : 'inherit'};">${penalty > 0 ? '₹' + penalty.toFixed(2) : '-'}</td>
                    <td style="font-weight: 500; color: #047857;">₹${grandTotal.toFixed(2)}</td>
                    <td style="font-size: 0.9rem;">${formatPaymentMethod(p)}</td>
                    <td>
                        <button class="btn-delete-pay" data-ts="${p.timestamp}" style="background:none; border:none; cursor:pointer;" title="Delete Payment">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        summary.innerHTML = `
            <div style="font-size: 1.1rem; line-height: 1.6;">
                <div>Total Base Rent: <strong>₹${totalBaseRent.toFixed(2)}</strong></div>
                <div>Total GST Collected: <strong>₹${totalGST.toFixed(2)}</strong></div>
                <div>Total Penalties: <span style="color: #ef4444;">₹${totalPenalty.toFixed(2)}</span></div>
                <hr style="margin: 0.5rem 0; opacity: 0.3;">
                <div style="font-size: 1.3rem;">Grand Total: <span style="color: #047857;">₹${totalCollected.toFixed(2)}</span></div>
            </div>
        `;
    }
};

window.RentModule = RentModule;
