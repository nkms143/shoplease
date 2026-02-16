/**
 * Core Payments Module
 * Payment processing and breakdown calculations
 * Pure functions - no side effects
 */

const PaymentsCore = {
    /**
     * Calculate payment breakdown for selected months
     * @param {Array} months - Selected month objects
     * @param {object} applicant - Applicant/shop object
     * @param {number} manualPenalty - Manual penalty override (optional)
     * @param {object} settings - Penalty settings
     * @param {Date} paymentDate - Payment date
     * @param {Array} waivers - Shop waivers
     * @returns {object} Payment breakdown
     */
    calculatePaymentBreakdown(months, applicant, manualPenalty, settings, paymentDate, waivers) {
        const breakdown = {
            months: [],
            baseRent: 0,
            gst: 0,
            penalty: manualPenalty !== undefined ? manualPenalty : 0,
            total: 0,
            monthCount: months.length
        };

        const baseRent = applicant.rentBase || 0;
        const gst = Math.round(baseRent * 0.18);
        const paymentDay = settings.paymentDay || 5;

        // Calculate base and GST
        breakdown.baseRent = baseRent * months.length;
        breakdown.gst = gst * months.length;

        // Calculate penalties if not manually overridden
        if (manualPenalty === undefined && window.PenaltiesCore) {
            let autoPenalty = 0;

            for (const monthStr of months) {
                const [year, month] = monthStr.split('-').map(Number);
                const dueDate = new Date(year, month - 1, paymentDay);

                // Check for waiver
                const hasWaiver = waivers.some(w =>
                    String(w.shopNo) === String(applicant.shopNo) && w.month === monthStr
                );

                if (hasWaiver) {
                    continue; // No penalty if waived
                }

                // Get penalty parameters
                const penaltyParams = DuesCore.getPenaltyParams(settings, dueDate);

                // Calculate penalty
                const penalty = window.PenaltiesCore.calculatePenalty(
                    dueDate,
                    paymentDate,
                    penaltyParams.rate,
                    penaltyParams.mode
                );

                autoPenalty += penalty;

                breakdown.months.push({
                    monthStr,
                    dueDate: dueDate.toISOString(),
                    penalty,
                    waived: hasWaiver
                });
            }

            breakdown.penalty = autoPenalty;
        }

        breakdown.total = breakdown.baseRent + breakdown.gst + breakdown.penalty;

        return breakdown;
    },

    /**
     * Create payment record object
     * @param {object} params - Payment parameters
     * @returns {object} Payment record
     */
    createPaymentRecord(params) {
        const {
            shopNo,
            applicantName,
            months,
            paymentDate,
            baseRent,
            gst,
            penalty,
            total,
            paymentMethod,
            transactionId,
            reference,
            recordedBy
        } = params;

        return {
            id: this.generateUniqueId(),
            shopNo: String(shopNo),
            applicantName: applicantName || '',
            months: months || [],
            paymentDate: paymentDate instanceof Date ? paymentDate.toISOString() : paymentDate,
            baseRent: Number(baseRent) || 0,
            gst: Number(gst) || 0,
            penalty: Number(penalty) || 0,
            total: Number(total) || 0,
            paymentMethod: paymentMethod || 'Cash',
            transactionId: transactionId || '',
            reference: reference || '',
            createdAt: new Date().toISOString(),
            recordedBy: recordedBy || 'system'
        };
    },

    /**
     * Generate unique payment ID
     * @returns {string} Unique ID
     */
    generateUniqueId() {
        return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Validate payment record before saving
     * Uses ValidatorsCore
     * @param {object} payment - Payment record to validate
     * @returns {{valid: boolean, errors: Array}}
     */
    validatePaymentRecord(payment) {
        if (window.ValidatorsCore) {
            return window.ValidatorsCore.validatePayment(payment);
        }

        // Fallback basic validation
        const errors = [];

        if (!payment.shopNo) errors.push('Shop number is required');
        if (!payment.months || payment.months.length === 0) errors.push('At least one month is required');
        if (!payment.paymentDate) errors.push('Payment date is required');
        if (payment.total <= 0) errors.push('Total amount must be greater than zero');

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Format payment for receipt
     * @param {object} payment - Payment record
     * @param {object} applicant - Applicant details
     * @returns {object} Formatted receipt data
     */
    formatReceiptData(payment, applicant) {
        return {
            receiptNo: payment.id,
            receiptDate: new Date(payment.paymentDate).toLocaleDateString('en-IN'),
            shopNo: payment.shopNo,
            tenantName: payment.applicantName,
            address: applicant.address || '',
            months: payment.months.join(', '),
            monthCount: payment.months.length,
            baseRent: payment.baseRent.toLocaleString('en-IN'),
            gst: payment.gst.toLocaleString('en-IN'),
            penalty: payment.penalty.toLocaleString('en-IN'),
            total: payment.total.toLocaleString('en-IN'),
            totalInWords: this.numberToWords(payment.total),
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            reference: payment.reference
        };
    },

    /**
     * Convert number to words (Indian style)
     * @param {number} num - Number to convert
     * @returns {string} Number in words
     */
    numberToWords(num) {
        if (num === 0) return 'Zero Rupees';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        function convertChunk(n) {
            if (n === 0) return '';
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
        }

        const crore = Math.floor(num / 10000000);
        const lakh = Math.floor((num % 10000000) / 100000);
        const thousand = Math.floor((num % 100000) / 1000);
        const remainder = num % 1000;

        let words = '';

        if (crore) words += convertChunk(crore) + ' Crore ';
        if (lakh) words += convertChunk(lakh) + ' Lakh ';
        if (thousand) words += convertChunk(thousand) + ' Thousand ';
        if (remainder) words += convertChunk(remainder);

        return words.trim() + ' Rupees Only';
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PaymentsCore = PaymentsCore;
}
