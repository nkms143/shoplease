/**
 * SUDA Shop Lease - Shared Utilities
 * Consolidated helper functions to remove redundancy.
 */

const Utils = {
    /**
     * Safely parses a value to a float number.
     * @param {any} v - Value to parse
     * @returns {number} - 0 if invalid, otherwise the float value
     */
    parseNumber(v) {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        const s = String(v).replace(/[^0-9.-]/g, ''); // Remove currency symbols etc
        const f = parseFloat(s);
        return isNaN(f) ? 0 : f;
    },

    /**
     * Formats a number as Indian Currency (INR).
     * @param {number|string} amount 
     * @returns {string} e.g. "₹ 1,200.00"
     */
    formatCurrency(amount) {
        const n = this.parseNumber(amount);
        return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /**
     * Returns the Financial Year for a given date.
     * FY starts April 1st.
     * @param {Date|string} dateStr - Date object or string
     * @returns {string} e.g. "2025-26"
     */
    getFinancialYear(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return ''; // Invalid date

        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12

        // If Jan(1), Feb(2), Mar(3) -> belongs to Previous Year's FY
        if (month <= 3) {
            return `${year - 1}-${String(year).slice(-2)}`;
        } else {
            return `${year}-${String(year + 1).slice(-2)}`;
        }
    },

    /**
     * Helper to extract GST Amount from a payment object.
     * Handles various legacy field names.
     * @param {Object} p - Payment object
     * @returns {number} GST Amount
     */
    getPaymentGST(p) {
        if (!p) return 0;

        // 1. Valid stored value
        const val = this.parseNumber(p.gstAmount) ||
            this.parseNumber(p.gst) ||
            this.parseNumber(p.amount_gst) ||
            this.parseNumber(p.gstAmt);
        if (val > 0) return val;

        // 2. Derive from Total - Base (if available)
        const base = this.getPaymentBaseRent(p);
        const total = this.getPaymentTotal(p);

        if (base > 0 && total > base) {
            const diff = total - base;
            // Sanity check: Derived GST shouldn't be drastically different from 18%
            // But strict validation might hide data. Let's return the diff if it looks like GST.
            return parseFloat(diff.toFixed(2));
        }

        // 3. Fallback: Calculate 18% of Base
        if (base > 0) {
            return parseFloat((base * 0.18).toFixed(2));
        }

        return 0;
    },

    /**
     * Helper to extract Base Rent Amount from a payment object.
     * @param {Object} p - Payment object
     * @returns {number} Base Rent
     */
    getPaymentBaseRent(p) {
        return this.parseNumber(p.rentAmount) ||
            this.parseNumber(p.baseRent) ||
            this.parseNumber(p.amount_base) ||
            0;
    },

    /**
     * Helper to extract Total Amount from a payment object.
     * @param {Object} p - Payment object
     * @returns {number} Grand Total
     */
    getPaymentTotal(p) {
        return this.parseNumber(p.grandTotal) ||
            this.parseNumber(p.totalRent) ||
            this.parseNumber(p.amount_total) ||
            0;
    }
};

// Expose globally
window.Utils = Utils;
