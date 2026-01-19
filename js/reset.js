/**
 * RESET PASSWORD ISOLATED LOGIC
 * Handles only the update password flow
 */

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_KEY;

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const btnUpdate = document.getElementById('btn-update');
    const inputPass = document.getElementById('new-password');
    const msgDiv = document.getElementById('message');

    // 1. Check if we have a hash (access token)
    // Supabase puts the token in the URL hash: #access_token=...&type=recovery
    if (!window.location.hash) {
        msgDiv.textContent = "Invalid or expired link. Please request a new one.";
        msgDiv.style.color = 'red';
        btnUpdate.disabled = true;
        return;
    }

    // 2. Handle Update
    btnUpdate.addEventListener('click', async () => {
        const newPassword = inputPass.value;

        if (!newPassword || newPassword.length < 6) {
            msgDiv.textContent = "Password must be at least 6 characters.";
            msgDiv.style.color = 'red';
            return;
        }

        btnUpdate.textContent = "Updating...";
        btnUpdate.disabled = true;
        msgDiv.textContent = "";

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            msgDiv.textContent = "Success! Redirecting to Login...";
            msgDiv.style.color = 'green';

            // Force logout to ensure they login with new credentials
            await supabase.auth.signOut();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (err) {
            console.error("Reset Error:", err);
            msgDiv.textContent = "Error: " + err.message;
            msgDiv.style.color = 'red';
            btnUpdate.textContent = "Update Password";
            btnUpdate.disabled = false;
        }
    });

    // 3. Listen for Supabase Auth Events (Essential to catch the hash state)
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("Reset Page Event:", event);
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
            // Good, session is active from the link
            console.log("Session verified via link.");
        }
    });
});
