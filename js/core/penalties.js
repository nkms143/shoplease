/**
 * Core Penalties Module
 * Pure penalty calculation logic - deterministic and testable
 * No UI dependencies, no Store dependencies
 */

const PenaltiesCore = {
    /**
     * Calculate penalty for a single period
     * @param {Date} dueDate - The due date for the payment
     * @param {Date} paymentDate - The actual or projected payment date
     * @param {number} rate - Penalty rate (e.g., 500 for ₹500/month)
     * @param {string} mode - 'MONTHLY' or 'DAILY'
     * @returns {number} Calculated penalty amount
     */
    calculatePenalty(dueDate, paymentDate, rate, mode) {
        // Normalize dates to midnight for accurate comparison
        const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const pmt = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());

        // Not overdue
        if (pmt <= due) {
            return 0;
        }

        // Calculate days difference
        const diffTime = pmt - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return 0;
        }

        // Apply penalty formula based on mode
        if (mode === 'MONTHLY') {
            // Strict policy: minimum 1 month penalty for any delay
            const monthsOverdue = Math.max(1, Math.ceil(diffDays / 30));
            return monthsOverdue * rate;
        } else if (mode === 'DAILY') {
            return diffDays * rate;
        }

        return 0;
    },

    /**
     * Calculate penalty for a period with grace period support
     * @param {Date} dueDate - Original due date
     * @param {Date} paymentDate - Payment or calculation date
     * @param {number} rate - Penalty rate
     * @param {string} mode - Penalty mode
     * @param {Date|null} gracePeriodStart - Optional grace period start date
     * @returns {number} Penalty amount
     */
    calculatePenaltyWithGrace(dueDate, paymentDate, rate, mode, gracePeriodStart = null) {
        const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const pmt = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());

        // Determine start of penalty counting
        let startCounting = due;

        if (gracePeriodStart) {
            const grace = new Date(gracePeriodStart.getFullYear(), gracePeriodStart.getMonth(), gracePeriodStart.getDate());
            if (grace > startCounting) {
                startCounting = grace;
            }
        }

        // Not overdue from counting start
        if (pmt <= startCounting) {
            return 0;
        }

        // Calculate from counting start
        const diffTime = pmt - startCounting;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return 0;
        }

        if (mode === 'MONTHLY') {
            const monthsOverdue = Math.max(1, Math.ceil(diffDays / 30));
            return monthsOverdue * rate;
        } else if (mode === 'DAILY') {
            return diffDays * rate;
        }

        return 0;
    },

    /**
     * Calculate penalty for multiple months
     * @param {Array} months - Array of {dueDate, paid} objects
     * @param {Date} asOfDate - Date to calculate penalties up to
     * @param {number} rate - Penalty rate
     * @param {string} mode - Penalty mode
     * @returns {{totalPenalty: number, breakdown: Array}} - Total and per-month breakdown
     */
    calculateMultiMonthPenalty(months, asOfDate, rate, mode) {
        const breakdown = [];
        let totalPenalty = 0;

        for (const month of months) {
            if (month.paid) {
                breakdown.push({
                    month: month.monthStr,
                    penalty: 0,
                    reason: 'Paid'
                });
                continue;
            }

            const penalty = this.calculatePenalty(month.dueDate, asOfDate, rate, mode);

            breakdown.push({
                month: month.monthStr,
                penalty: penalty,
                daysOverdue: Math.ceil((asOfDate - month.dueDate) / (1000 * 60 * 60 * 24))
            });

            totalPenalty += penalty;
        }

        return {
            totalPenalty,
            breakdown
        };
    },

    /**
     * Apply waiver to penalty
     * @param {number} penalty - Calculated penalty
     * @param {object|null} waiver - Waiver object with percentage or amount
     * @returns {number} Final penalty after waiver
     */
    applyWaiver(penalty, waiver) {
        if (!waiver) {
            return penalty;
        }

        if (waiver.waiverPercentage !== undefined) {
            const reduction = (penalty * waiver.waiverPercentage) / 100;
            return Math.max(0, penalty - reduction);
        }

        if (waiver.waiverAmount !== undefined) {
            return Math.max(0, penalty - waiver.waiverAmount);
        }

        // Full waiver if no specific amount
        return 0;
    },

    /**
     * Get months overdue count
     * @param {number} days - Days overdue
     * @param {string} mode - Penalty mode
     * @returns {number} Months count for reporting
     */
    getMonthsOverdueCount(days, mode) {
        if (mode === 'MONTHLY') {
            return Math.max(1, Math.ceil(days / 30));
        }
        // For daily mode, convert to approximate months for display
        return Math.ceil(days / 30);
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PenaltiesCore = PenaltiesCore;
}
