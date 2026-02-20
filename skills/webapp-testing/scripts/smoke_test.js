/**
 * ShopLease - Automated Smoke Test
 * Designed for AI Agent Execution via Browser Tool.
 */

/*
// Suggested Browser Task:
// 1. Visit index.html
// 2. Look for ".portal-title" containing "Shop Lease Manager"
// 3. Look for "#login-form"
// 4. Look for ".visual-badge" containing "Telangana Rising"
// 5. Verify script tags for core modules are in DOM
*/

console.log("Smoke test initialized...");
if (document.querySelector('.portal-title')) {
    console.log("SUCCESS: Portal Title found.");
} else {
    console.error("FAILURE: Portal Title missing.");
}

if (window.ValidatorsCore && window.GSTCore && window.NoticesCore && window.LedgerCore) {
    console.log("SUCCESS: All Core Modules loaded into global scope.");
} else {
    console.error("FAILURE: One or more core modules failed to load.");
}
