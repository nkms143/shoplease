/**
 * Core Dues Calculation Module
 * Pure dues calculation logic - separated from Store class
 * Can be unit tested independently
 */

const DuesCore = {
    /**
     * Calculate outstanding dues for an applicant as of a specific date
     * @param {object} applicant - Applicant/shop object
     * @param {Array} payments - All payments for this shop
     * @param {Array} waivers - All waivers for this shop
     * @param {object} settings - Penalty settings {paymentDay, penaltyHistory}
     * @param {Date} asOfDate - Date to calculate dues up to
     * @returns {object} Dues breakdown
     */
    calculateOutstandingDues(applicant, payments, waivers, settings, asOfDate) {
        const result = {
            shopNo: applicant.shopNo,
            applicantName: applicant.applicantName,
            baseRent: applicant.rentBase || 0,
            gst: 0,
            monthlyTotal: 0,
            months: [],
            monthsCount: 0,
            totalBase: 0,
            totalGST: 0,
            totalRent: 0,
            penalty: 0,
            totalAmount: 0
        };

        // Calculate monthly amounts
        result.gst = Math.round(result.baseRent * 0.18);
        result.monthlyTotal = result.baseRent + result.gst;

        // Determine calculation period
        const allotmentDate = applicant.allotmentDate ? new Date(applicant.allotmentDate) : new Date('2022-01-01');
        const calculationEnd = asOfDate || new Date();

        // Get payment day from settings
        const paymentDay = settings.paymentDay || 5;

        // Build months list
        const current = new Date(allotmentDate);
        const unpaidMonths = [];

        while (current <= calculationEnd) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1; // 1-indexed
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;

            // Due date for this month
            const dueDate = new Date(year, month - 1, paymentDay);

            // Check if this month is paid
            const isPaid = this.isMonthPaid(monthStr, payments);

            if (!isPaid && dueDate <= calculationEnd) {
                unpaidMonths.push({
                    year,
                    month,
                    monthStr,
                    dueDate,
                    baseRent: result.baseRent,
                    gst: result.gst,
                    total: result.monthlyTotal
                });
            }

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        result.months = unpaidMonths;
        result.monthsCount = unpaidMonths.length;

        // Calculate totals
        result.totalBase = result.baseRent * result.monthsCount;
        result.totalGST = result.gst * result.monthsCount;
        result.totalRent = result.totalBase + result.totalGST;

        // Calculate penalties for each unpaid month
        result.penalty = this.calculateTotalPenalty(
            applicant.shopNo,
            unpaidMonths,
            waivers,
            settings,
            calculationEnd
        );

        result.totalAmount = result.totalRent + result.penalty;

        return result;
    },

    /**
     * Check if a specific month is paid
     * @param {string} monthStr - Month in YYYY-MM format
     * @param {Array} payments - All payments
     * @returns {boolean} True if month is paid
     */
    isMonthPaid(monthStr, payments) {
        return payments.some(p => {
            if (!p.months || !Array.isArray(p.months)) {
                return false;
            }
            return p.months.includes(monthStr);
        });
    },

    /**
     * Calculate total penalty for unpaid months
     * @param {string} shopNo - Shop number
     * @param {Array} months - Unpaid months array
     * @param {Array} waivers - All waivers
     * @param {object} settings - Penalty settings
     * @param {Date} asOfDate - Calculation date
     * @returns {number} Total penalty amount
     */
    calculateTotalPenalty(shopNo, months, waivers, settings, asOfDate) {
        let totalPenalty = 0;

        for (const month of months) {
            // Check for waiver first
            const hasWaiver = waivers.some(w =>
                String(w.shopNo) === String(shopNo) && w.month === month.monthStr
            );

            if (hasWaiver) {
                continue; // Skip penalty if waived
            }

            // Get penalty parameters for this month's due date
            const penaltyParams = this.getPenaltyParams(settings, month.dueDate);

            // Calculate penalty using PenaltiesCore
            if (window.PenaltiesCore) {
                const penalty = window.PenaltiesCore.calculatePenalty(
                    month.dueDate,
                    asOfDate,
                    penaltyParams.rate,
                    penaltyParams.mode
                );
                totalPenalty += penalty;
            }
        }

        return totalPenalty;
    },

    /**
     * Get penalty parameters (rate, mode) for a specific date
     * @param {object} settings - Settings object with penaltyHistory
     * @param {Date} date - Date to get parameters for
     * @returns {{rate: number, mode: string}} Penalty parameters
     */
    getPenaltyParams(settings, date) {
        const penaltyHistory = settings.penaltyHistory || [];

        // Find the applicable rate based on effective date
        for (let i = penaltyHistory.length - 1; i >= 0; i--) {
            const entry = penaltyHistory[i];
            const effectiveDate = new Date(entry.effectiveDate);

            if (date >= effectiveDate) {
                return {
                    rate: entry.rate || 500,
                    mode: entry.mode || 'MONTHLY'
                };
            }
        }

        // Default parameters
        return {
            rate: settings.penaltyRate || 500,
            mode: settings.penaltyMode || 'MONTHLY'
        };
    },

    /**
     * Apply waivers to dues
     * @param {object} dues - Calculated dues
     * @param {Array} waivers - Waivers for this shop
     * @returns {object} Updated dues with waivers applied
     */
    applyWaivers(dues, waivers) {
        const updatedDues = { ...dues };
        const shopWaivers = waivers.filter(w => String(w.shopNo) === String(dues.shopNo));

        let totalWaivedPenalty = 0;

        shopWaivers.forEach(waiver => {
            totalWaivedPenalty += waiver.waiverAmount || 0;
        });

        updatedDues.penalty = Math.max(0, updatedDues.penalty - totalWaivedPenalty);
        updatedDues.totalAmount = updatedDues.totalRent + updatedDues.penalty;
        updatedDues.waivers = shopWaivers;

        return updatedDues;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DuesCore = DuesCore;
}
