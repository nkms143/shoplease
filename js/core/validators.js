/**
 * SUDA Shop Lease - Validators Core
 * Pure functions for validating business data.
 */

const ValidatorsCore = {
    /**
     * Validates a payment record before saving.
     * @param {Object} payment - The payment object to validate
     * @returns {Object} { isValid: boolean, error: string|null }
     */
    validatePayment(payment) {
        if (!payment.shopNo) return { isValid: false, error: 'Shop number is required.' };
        if (!payment.paymentForMonth) return { isValid: false, error: 'Payment month is required.' };
        if (!payment.paymentDate) return { isValid: false, error: 'Payment date is required.' };

        const method = payment.paymentMethod;
        if (!method) return { isValid: false, error: 'Payment method is required.' };

        if (method === 'cash' && !payment.receiptNo) {
            return { isValid: false, error: 'SUDA Receipt No. is required for cash payments.' };
        }

        if (method === 'dd-cheque') {
            if (!payment.ddChequeNo) return { isValid: false, error: 'DD/Cheque No. is required.' };
            if (!payment.ddChequeDate) return { isValid: false, error: 'DD/Cheque Date is required.' };
        }

        if (method === 'online' && !payment.transactionNo) {
            return { isValid: false, error: 'Online Transaction No. is required.' };
        }

        return { isValid: true, error: null };
    },

    /**
     * Validates applicant/shop data.
     * @param {Object} applicant - The applicant object
     * @returns {Object} { isValid: boolean, error: string|null }
     */
    validateApplicant(applicant) {
        if (!applicant.shopNo) return { isValid: false, error: 'Shop No is required.' };
        if (!applicant.applicantName) return { isValid: false, error: 'Applicant Name is required.' };
        if (applicant.rentTotal === undefined || applicant.rentTotal === null) {
            return { isValid: false, error: 'Monthly Rent amount is required.' };
        }
        return { isValid: true, error: null };
    }
};

// Expose globally
window.ValidatorsCore = ValidatorsCore;
