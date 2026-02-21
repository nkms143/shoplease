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
        const penaltyRate = parseFloat(settings.penaltyRate) || 15;
        const today = asOfDate || new Date();

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

        const history = applicant.leaseHistory || [];
        if (Array.isArray(history) && history.length > 0) {
            history.forEach(h => {
                const s = h.leaseDate || h.rentStartDate || h.startDate;
                const e = h.expiryDate || h.leaseEndDate || h.endDate;
                pushPeriod(s, e, { source: 'history', entry: h });
            });
        }

        const activeStart = applicant.rentStartDate || applicant.leaseDate || null;
        pushPeriod(activeStart, null, { source: 'active' });

        // 2. Identify Paid Months
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

                // --- PENALTY LOGIC (HISTORY AWARE) ---
                const dueDay = parseInt(applicant.paymentDay) || 5;
                let dueDate = new Date(y, cur.getMonth(), Math.min(dueDay, 28));

                // 2026-02-21: Adjustment for first month penalty
                // If occupancy starts AFTER the due date of that month, penalty shouldn't start until next month's due date.
                const leaseStart = period.start;
                if (leaseStart.getFullYear() === y && leaseStart.getMonth() === cur.getMonth()) {
                    if (leaseStart > dueDate) {
                        // User Scenario: 19th Feb start, 5th Feb due date. 
                        // Penalty should only start after 5th March.
                        dueDate = new Date(y, cur.getMonth() + 1, Math.min(dueDay, 28));
                    }
                }

                // Get Config from History for this specific due date
                const penaltyParams = this.getPenaltyParams(settings, dueDate);
                const pMode = penaltyParams.mode || 'MONTHLY';
                const pRate = parseFloat(penaltyParams.rate) || 500;

                // Normalize today to start of day for accurate comparison
                const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                // If not due yet, skip
                if (todayMidnight <= dueDate) {
                    cur.setMonth(cur.getMonth() + 1);
                    continue;
                }

                let p = 0;
                if (today > dueDate) {
                    const impDate = settings.penaltyDate ? new Date(settings.penaltyDate) : null;
                    if (window.PenaltiesCore) {
                        p = window.PenaltiesCore.calculatePenaltyWithGrace(dueDate, today, pRate, pMode, impDate);
                    }
                }

                // Rent Logic
                let rentBase = parseFloat(applicant.rentBase || applicant.baseRent || applicant.rentAmount || 0) || 0;
                let gstAmt = 0;

                // --- GST AMENDMENT LOGIC (MULTI-HISTORY) ---
                const curDate = new Date(cur.getFullYear(), cur.getMonth(), 1);
                let applicableRate = 0.18;
                if (window.GSTCore) {
                    applicableRate = window.GSTCore.getApplicableRate(curDate, settings);
                }

                if (period.meta && period.meta.entry) {
                    const e = period.meta.entry;
                    rentBase = parseFloat(e.rentBase || e.baseRent || e.rentAmount || rentBase) || rentBase;

                    // Use historical GST if explicitly saved (frozen history)
                    if (e.gstAmount !== undefined && e.gstAmount !== null) {
                        gstAmt = parseFloat(e.gstAmount);
                    } else {
                        // No saved GST? Calculate using the rate applicable for THAT period
                        gstAmt = window.GSTCore ? window.GSTCore.calculateGST(rentBase) * (applicableRate / 0.18) : Math.round(rentBase * applicableRate);
                    }
                } else {
                    // Active Period: Use the rate applicable for this month
                    gstAmt = window.GSTCore ? window.GSTCore.calculateGST(rentBase) * (applicableRate / 0.18) : Math.round(rentBase * applicableRate);
                }

                const rentTotal = rentBase + gstAmt;

                // --- WAIVER CHECK (Centralized) ---
                // Apply waiver BEFORE adding to totals
                const mStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
                const hasWaiver = waivers.some(w => String(w.shopNo) === String(applicant.shopNo) && w.month === mStr);

                if (hasWaiver) {
                    p = 0;
                }

                totalBase += rentBase;
                totalGST += gstAmt;
                totalPenalty += p;

                pendingMonths.push({
                    month: cur.toLocaleString('default', { month: 'short', year: 'numeric' }),
                    rent: rentTotal,
                    penalty: p,
                    monthStr: monthStr,
                    source: period.meta && period.meta.source === 'history' ? 'history' : 'active',
                    year: y, // Needed by invoice module mapping fallback
                    dueDate: dueDate
                });

                cur.setMonth(cur.getMonth() + 1);
            }
        });

        return {
            shopNo: applicant.shopNo,
            applicantName: applicant.applicantName,
            totalAmount: totalBase + totalGST + totalPenalty,
            breakdown: { base: totalBase, gst: totalGST, penalty: totalPenalty },
            details: pendingMonths,
            months: pendingMonths, // Backwards compatibility with calculateTotalPenalty
            monthsCount: pendingMonths.length,
            baseRent: totalBase,
            gst: totalGST,
            penalty: totalPenalty,
            totalBase: totalBase,
            totalGST: totalGST,
            totalRent: totalBase + totalGST
        };
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
    },

    /**
     * Generate monthly invoice object for a shop
     * @param {object} applicant - Applicant/shop object
     * @param {Array} payments - All payments for this shop
     * @param {Array} waivers - All waivers for this shop
     * @param {object} settings - Configuration settings 
     * @param {number} month - Invoice month (1-12)
     * @param {number} year - Invoice year
     * @returns {object} Invoice breakdown
     */
    generateInvoice(applicant, payments, waivers, settings, month, year) {
        const rent = parseFloat(applicant.rentBase || 0);

        // Core business logic: Use GSTCore if available, otherwise apply generic 18%
        let gst = 0;
        if (window.GSTCore) {
            const gstRate = window.GSTCore.getApplicableRate(new Date(year, month - 1, 1), settings);
            gst = window.GSTCore.calculateGST(rent, gstRate);
        } else {
            gst = Math.round(rent * 0.18);
        }

        // Calculate Arrears (Up to END of Previous Month)
        const prevMonthEnd = new Date(year, month - 1, 0);
        const duesObj = this.calculateOutstandingDues(applicant, payments, waivers, settings, prevMonthEnd);

        // Ensure waivers are applied securely at the core level
        const finalDues = this.applyWaivers(duesObj, waivers);
        const arrears = finalDues.totalAmount || 0;

        const total = rent + gst + arrears;

        return {
            shopNo: applicant.shopNo,
            name: applicant.applicantName,
            email: applicant.email,
            rent: rent,
            gst: gst,
            arrears: arrears,
            total: total,
            details: applicant,
            status: 'Draft'
        };
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DuesCore = DuesCore;
}
