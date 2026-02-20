/**
 * SUDA Shop Lease - GST Core
 * Deterministic logic for tax calculations and reconciliation.
 */

const GSTCore = {
    /**
     * Calculate 18% GST on a base amount.
     * @param {number} baseAmount 
     * @returns {number}
     */
    calculateGST(baseAmount) {
        if (!baseAmount || isNaN(baseAmount)) return 0;
        return parseFloat((baseAmount * 0.18).toFixed(2));
    },

    /**
     * Reconciles collected GST against remitted amounts for a period.
     * @param {number} collected - Total GST collected from payments
     * @param {number} remitted - Total GST remitted to department
     * @returns {Object} { status: string, difference: number, color: string }
     */
    reconcileStatus(collected, remitted) {
        const diff = parseFloat((collected - remitted).toFixed(2));

        if (Math.abs(diff) < 0.01) {
            return { status: 'Matched', difference: 0, color: '#10b981' }; // Success Green
        } else if (diff > 0) {
            return { status: 'Shortfall', difference: diff, color: '#ef4444' }; // Error Red
        } else {
            return { status: 'Excess', difference: Math.abs(diff), color: '#f59e0b' }; // Warning Amber
        }
    }
};

// Expose globally
window.GSTCore = GSTCore;
