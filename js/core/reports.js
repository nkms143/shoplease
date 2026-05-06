/**
 * Core Reports Module
 * Data generation and formatting for reports
 * Pure data transformation - no DOM manipulation
 */

const ReportsCore = {
    /**
     * Generate DCB report data for financial year
     * @param {Array} applicants - All applicant/shop records
     * @param {Array} payments - All payment records
     * @param {Array} waivers - All waiver records
     * @param {object} settings - Settings object
     * @param {number} fyYear - Financial year starting year (e.g., 2024 for FY 2024-25)
     * @returns {object} DCB report data
     */
    generateDCBData(applicants, payments, waivers, settings, fyYear) {
        const fyStart = new Date(fyYear, 3, 1); // April 1st
        const fyEnd = new Date(fyYear + 1, 2, 31); // March 31st

        const reportData = {
            financialYear: `${fyYear}-${String(fyYear + 1).slice(2)}`,
            generatedOn: new Date().toISOString(),
            fyStart: fyStart.toISOString(),
            fyEnd: fyEnd.toISOString(),
            rows: [],
            totals: {
                monthlyRent: 0,
                openingBalance: 0,
                currentDemand: 0,
                totalDemand: 0,
                collection: 0,
                balance: 0,
                arrearPenalty: 0
            }
        };

        applicants.forEach((applicant, index) => {
            const row = this.formatReportRow(
                applicant,
                payments.filter(p => String(p.shopNo) === String(applicant.shopNo)),
                waivers.filter(w => String(w.shopNo) === String(applicant.shopNo)),
                settings,
                fyStart,
                fyEnd,
                index + 1
            );

            reportData.rows.push(row);

            // Add to totals
            reportData.totals.monthlyRent += row.monthlyRent;
            reportData.totals.openingBalance += row.openingBalance;
            reportData.totals.currentDemand += row.currentDemand;
            reportData.totals.totalDemand += row.totalDemand;
            reportData.totals.collection += row.collection;
            reportData.totals.balance += row.balance;
            reportData.totals.arrearPenalty += row.arrearPenalty;
        });

        return reportData;
    },

    /**
     * Format single row for DCB report
     * @param {object} applicant - Applicant object
     * @param {Array} shopPayments - Payments for this shop
     * @param {Array} shopWaivers - Waivers for this shop
     * @param {object} settings - Settings
     * @param {Date} fyStart - FY start date
     * @param {Date} fyEnd - FY end date
     * @param {number} serialNo - Serial number
     * @returns {object} Formatted row data
     */
    formatReportRow(applicant, shopPayments, shopWaivers, settings, fyStart, fyEnd, serialNo) {
        const baseRent = applicant.rentBase || 0;

        // Use GSTCore for dynamic rate lookup based on settings
        let gstRate = 0.18;
        if (window.GSTCore) {
            gstRate = window.GSTCore.getApplicableRate(fyStart, settings);
        }
        const gst = Math.round(baseRent * gstRate);
        const monthlyRent = baseRent + gst;

        // Opening balance (dues before FY start)
        let openingBalance = 0;
        if (window.DuesCore) {
            const openingDues = window.DuesCore.calculateOutstandingDues(
                applicant,
                shopPayments,
                shopWaivers,
                settings,
                fyStart
            );
            openingBalance = openingDues.totalAmount;
        }

        // Current year demand (12 months of rent)
        const currentDemand = monthlyRent * 12;

        // Total demand
        const totalDemand = openingBalance + currentDemand;

        // Collection (payments made during FY)
        const collection = shopPayments
            .filter(p => {
                const dateStr = p.paymentDate || p.timestamp || p.created_at;
                if (!dateStr) return false;
                const paymentDate = new Date(dateStr);
                return paymentDate >= fyStart && paymentDate <= fyEnd;
            })
            .reduce((sum, p) => sum + (parseFloat(p.total) || parseFloat(p.grandTotal) || 0), 0);

        // Balance
        const balance = totalDemand - collection;

        // Arrear penalty (for unpaid months)
        const arrearPenalty = this.calculateArrearPenalty(
            applicant,
            shopPayments,
            shopWaivers,
            settings,
            fyStart,
            fyEnd
        );

        return {
            serialNo,
            shopNo: applicant.shopNo,
            occupantName: applicant.applicantName,
            monthlyRent,
            openingBalance,
            currentDemand,
            totalDemand,
            collection,
            balance,
            arrearPenalty
        };
    },

    /**
     * Calculate arrear penalty for DCB report
     * @param {object} applicant - Applicant object
     * @param {Array} shopPayments - Payments for this shop
     * @param {Array} shopWaivers - Waivers for this shop
     * @param {object} settings - Settings
     * @param {Date} fyStart - FY start date
     * @param {Date} fyEnd - FY end date
     * @returns {number} Total arrear penalty
     */
    calculateArrearPenalty(applicant, shopPayments, shopWaivers, settings, fyStart, fyEnd) {
        let totalPenalty = 0;

        const allotmentDate = applicant.allotmentDate ? new Date(applicant.allotmentDate) : new Date('2022-01-01');
        const startDate = allotmentDate > fyStart ? allotmentDate : fyStart;
        const paymentDay = settings.paymentDay || 5;

        const current = new Date(startDate);

        while (current <= fyEnd) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1;
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const dueDate = new Date(year, month - 1, paymentDay);

            // Check if month is paid
            const isPaid = shopPayments.some(p =>
                p.months && Array.isArray(p.months) && p.months.includes(monthStr)
            );

            if (!isPaid && dueDate <= fyEnd) {
                // Check for waiver
                const hasWaiver = shopWaivers.some(w => w.month === monthStr);

                if (!hasWaiver && window.PenaltiesCore && window.DuesCore) {
                    // Get penalty parameters
                    const penaltyParams = window.DuesCore.getPenaltyParams(settings, dueDate);

                    // Calculate penalty from due date to end of FY (March 31st)
                    // Note: DCB Report is a snapshot of the Financial Year.
                    const penalty = window.PenaltiesCore.calculatePenalty(
                        dueDate,
                        fyEnd,
                        penaltyParams.rate,
                        penaltyParams.mode
                    );

                    totalPenalty += penalty;
                }
            }

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        return totalPenalty;
    },

    /**
     * Format DCB data for CSV export
     * @param {object} dcbData - DCB report data
     * @returns {string} CSV content
     */
    formatAsCSV(dcbData) {
        const headers = [
            'S.No', 'Shop No', 'Name of Occupant', 'Monthly Rent',
            'Opening Balance', 'Current Demand', 'Total Demand',
            'Collection', 'Balance', 'Arrear Penalty'
        ];

        let csv = headers.join(',') + '\n';

        dcbData.rows.forEach(row => {
            csv += [
                row.serialNo,
                row.shopNo,
                `"${row.occupantName}"`, // Quoted for names with commas
                row.monthlyRent,
                row.openingBalance,
                row.currentDemand,
                row.totalDemand,
                row.collection,
                row.balance,
                row.arrearPenalty
            ].join(',') + '\n';
        });

        // Totals row
        csv += [
            'TOTAL',
            '',
            '',
            dcbData.totals.monthlyRent,
            dcbData.totals.openingBalance,
            dcbData.totals.currentDemand,
            dcbData.totals.totalDemand,
            dcbData.totals.collection,
            dcbData.totals.balance,
            dcbData.totals.arrearPenalty
        ].join(',') + '\n';

        return csv;
    },

    /**
     * Generate shop ledger data
     * @param {object} applicant - Applicant object
     * @param {Array} payments - All payments for this shop
     * @param {object} settings - Settings
     * @returns {object} Ledger data
     */
    generateShopLedger(applicant, payments, settings) {
        const ledger = {
            shopNo: applicant.shopNo,
            applicantName: applicant.applicantName,
            baseRent: applicant.rentBase,
            gst: Math.round(applicant.rentBase * 0.18),
            monthlyTotal: 0,
            transactions: [],
            summary: {
                totalDemand: 0,
                totalPaid: 0,
                balance: 0
            }
        };

        ledger.monthlyTotal = ledger.baseRent + ledger.gst;

        // Sort payments by date
        const sortedPayments = [...payments].sort((a, b) =>
            new Date(a.paymentDate) - new Date(b.paymentDate)
        );

        sortedPayments.forEach(payment => {
            ledger.transactions.push({
                date: payment.paymentDate,
                type: 'Payment',
                months: payment.months.join(', '),
                monthCount: payment.months.length,
                base: payment.baseRent,
                gst: payment.gst,
                penalty: payment.penalty,
                total: payment.total,
                method: payment.paymentMethod,
                reference: payment.transactionId || payment.reference
            });

            ledger.summary.totalPaid += payment.total;
        });

        return ledger;
    },

    /**
     * Generate defaulters list
     * @param {Array} applicants - All applicants
     * @param {Array} payments - All payments
     * @param {Array} waivers - All waivers
     * @param {object} settings - Settings
     * @param {Date} asOfDate - Calculation date
     * @returns {Array} List of defaulters with dues
     */
    generateDefaultersList(applicants, payments, waivers, settings, asOfDate) {
        const defaulters = [];

        applicants.forEach(applicant => {
            if (applicant.status === 'Terminated') {
                return; // Skip terminated tenants
            }

            if (window.DuesCore) {
                const shopPayments = payments.filter(p => String(p.shopNo) === String(applicant.shopNo));
                const shopWaivers = waivers.filter(w => String(w.shopNo) === String(applicant.shopNo));

                const dues = window.DuesCore.calculateOutstandingDues(
                    applicant,
                    shopPayments,
                    shopWaivers,
                    settings,
                    asOfDate
                );

                if (dues.totalAmount > 0) {
                    defaulters.push({
                        shopNo: applicant.shopNo,
                        applicantName: applicant.applicantName,
                        email: applicant.email,
                        monthsCount: dues.monthsCount,
                        totalDue: dues.totalAmount,
                        penalty: dues.penalty,
                        oldestMonth: dues.months[0]?.monthStr
                    });
                }
            }
        });

        // Sort by total due (descending)
        defaulters.sort((a, b) => b.totalDue - a.totalDue);

        return defaulters;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ReportsCore = ReportsCore;
}
