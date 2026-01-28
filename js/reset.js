/**
 * RESET PASSWORD ISOLATED LOGIC
 * Handles only the update password flow
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase client inside DOMContentLoaded to ensure config.js has loaded
    const SUPABASE_URL = window.CONFIG.SUPABASE_URL;
    const SUPABASE_KEY = window.CONFIG.SUPABASE_KEY;
    // ---------------------------------------------------------
    // SECURITY HARDENING: WIPE PREVIOUS SESSIONS
    // ---------------------------------------------------------
    // 1. Manually clear Supabase tokens from LocalStorage
    // (This ensures that even if the ephemeral session below "leaks", 
    // the main app on index.html won't find a token in storage).
    for (const key in localStorage) {
        if (key.startsWith('sb-') && key.endsWith('-token')) {
            localStorage.removeItem(key);
            console.log("Security: Wiped existing auth token from storage:", key);
        }
    }
    // Also remove the specific known key if configured differently
    localStorage.removeItem('supabase.auth.token');


    // 2. Initialize ephemeral client
    const supabaseResetClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false, // Memory only
            autoRefreshToken: false,
            detectSessionInUrl: true
        }
    });

    // 3. (Removed explicit signOut here to prevent invalidating the recovery hash)
    // ---------------------------------------------------------

    const btnUpdate = document.getElementById('btn-update');
    const inputPass = document.getElementById('new-password');
    const msgDiv = document.getElementById('message');

    console.log("Reset Page Loaded");
    console.log("Hash:", window.location.hash);

    // Disable button initially until session is verified
    btnUpdate.disabled = true;
    msgDiv.textContent = "Verifying your session...";
    msgDiv.style.color = '#64748b';

    // 1. Check if we have a hash (access token)
    if (!window.location.hash) {
        msgDiv.textContent = "Invalid or expired link. Please request a new one.";
        msgDiv.style.color = 'red';
        console.error("No hash found in URL");
        return;
    }

    // 2. Wait for Supabase to process the hash and establish session
    let sessionReady = false;

    supabaseResetClient.auth.onAuthStateChange((event, session) => {
        console.log("Auth Event:", event, "Session:", session);

        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            if (session) {
                console.log("Session established successfully");
                sessionReady = true;
                btnUpdate.disabled = false;
                msgDiv.textContent = "Ready! Enter your new password above.";
                msgDiv.style.color = 'green';
            }
        }
    });

    // 3. Also try to get session immediately (in case event already fired)
    setTimeout(async () => {
        const { data: { session }, error } = await supabaseResetClient.auth.getSession();
        console.log("Manual session check:", session, error);

        if (session && !sessionReady) {
            console.log("Session found manually");
            sessionReady = true;
            btnUpdate.disabled = false;
            msgDiv.textContent = "Ready! Enter your new password above.";
            msgDiv.style.color = 'green';
        } else if (!session && !sessionReady) {
            msgDiv.textContent = "Session expired. Please request a new reset link.";
            msgDiv.style.color = 'red';
        }
    }, 1000);

    // 4. Handle Update Click
    btnUpdate.addEventListener('click', async () => {
        const newPassword = inputPass.value;

        console.log("Update button clicked, password length:", newPassword.length);

        if (!newPassword || newPassword.length < 6) {
            msgDiv.textContent = "Password must be at least 6 characters.";
            msgDiv.style.color = 'red';
            return;
        }

        if (!sessionReady) {
            msgDiv.textContent = "Session not ready. Please wait or refresh.";
            msgDiv.style.color = 'orange';
            return;
        }

        btnUpdate.textContent = "Updating...";
        btnUpdate.disabled = true;
        msgDiv.textContent = "Updating your password...";
        msgDiv.style.color = '#64748b';

        try {
            console.log("Calling updateUser...");
            const { data, error } = await supabaseResetClient.auth.updateUser({
                password: newPassword
            });

            console.log("Update result:", { data, error });

            if (error) throw error;

            console.log("Password updated successfully!");
            msgDiv.textContent = "Success! Password updated. Redirecting to login...";
            msgDiv.style.color = 'green';

            // Force logout to ensure they login with new credentials
            await supabaseResetClient.auth.signOut();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (err) {
            console.error("Reset Error:", err);
            msgDiv.textContent = "Error: " + (err.message || "Failed to update password");
            msgDiv.style.color = 'red';
            btnUpdate.textContent = "Update Password";
            btnUpdate.disabled = false;
        }
    });

    // 5. Handle "Back to Login" - Ensure Sign Out
    const btnBack = document.getElementById('btn-back-login');
    if (btnBack) {
        btnBack.addEventListener('click', async (e) => {
            e.preventDefault(); // Stop default navigation
            await supabaseResetClient.auth.signOut(); // Kill session
            window.location.href = 'index.html'; // Go to login
        });
    }
});
