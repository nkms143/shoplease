/**
 * SUDA Shop Lease - GST Core
 * Deterministic logic for tax calculations and reconciliation.
 */

const GSTCore = {
    /**
     * Calculate 18% GST on a base amount (Default legacy function).
     * @param {number} baseAmount 
     * @returns {number}
     */
    calculateGST(baseAmount) {
        if (!baseAmount || isNaN(baseAmount)) return 0;
        return parseFloat((baseAmount * 0.18).toFixed(2));
    },

    /**
     * Determine applicable GST rate based on target date and settings history.
     * @param {Date} targetDate - The month/date being calculated
     * @param {Object} settings - The global settings object
     * @returns {number} rate (e.g., 0.18)
     */
    getApplicableRate(targetDate, settings) {
        if (!settings) return 0.18;

        const gstHistory = settings.gstHistory || [];
        // Ensure sorted descending (newest first)
        const sortedHistory = [...gstHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const h of sortedHistory) {
            const effDate = new Date(h.date);
            if (targetDate >= effDate) {
                return (parseFloat(h.rate) || 0) / 100;
            }
        }

        // Legacy Fallback
        const globalGstBase = (parseFloat(settings.gstBaseRate) || 18) / 100;
        const globalGstNew = (parseFloat(settings.gstNewRate) || 18) / 100;
        const globalGstEffective = settings.gstEffectiveDate ? new Date(settings.gstEffectiveDate) : null;

        let applicableRate = globalGstBase || 0.18;
        if (globalGstEffective && targetDate >= globalGstEffective) {
            applicableRate = globalGstNew;
        }

        return applicableRate;
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
