/**
 * Core Validators Module
 * Data validation utilities - reusable across all modules
 * Returns {valid: boolean, error: string|null}
 */

const ValidatorsCore = {
    /**
     * Validate shop number
     * @param {string|number} shopNo - Shop number to validate
     * @returns {{valid: boolean, error: string|null}}
     */
    validateShopNumber(shopNo) {
        if (shopNo === null || shopNo === undefined || shopNo === '') {
            return { valid: false, error: 'Shop number is required' };
        }

        const shopStr = String(shopNo).trim();

        if (shopStr.length === 0) {
            return { valid: false, error: 'Shop number cannot be empty' };
        }

        // Allow alphanumeric shop numbers (e.g., "01", "A-12", etc.)
        if (!/^[A-Za-z0-9\-]+$/.test(shopStr)) {
            return { valid: false, error: 'Shop number must be alphanumeric' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate date string or Date object
     * @param {string|Date} date - Date to validate
     * @param {boolean} allowFuture - Allow future dates
     * @returns {{valid: boolean, error: string|null, date: Date|null}}
     */
    validateDate(date, allowFuture = false) {
        if (!date) {
            return { valid: false, error: 'Date is required', date: null };
        }

        let parsedDate;

        if (date instanceof Date) {
            parsedDate = date;
        } else if (typeof date === 'string') {
            parsedDate = new Date(date);
        } else {
            return { valid: false, error: 'Invalid date format', date: null };
        }

        if (isNaN(parsedDate.getTime())) {
            return { valid: false, error: 'Invalid date', date: null };
        }

        if (!allowFuture) {
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today

            if (parsedDate > today) {
                return { valid: false, error: 'Future dates not allowed', date: null };
            }
        }

        return { valid: true, error: null, date: parsedDate };
    },

    /**
     * Validate amount (must be positive number)
     * @param {number|string} amount - Amount to validate
     * @param {number} minValue - Minimum allowed value (default: 0)
     * @returns {{valid: boolean, error: string|null, amount: number|null}}
     */
    validateAmount(amount, minValue = 0) {
        if (amount === null || amount === undefined || amount === '') {
            return { valid: false, error: 'Amount is required', amount: null };
        }

        const numAmount = Number(amount);

        if (isNaN(numAmount)) {
            return { valid: false, error: 'Amount must be a number', amount: null };
        }

        if (numAmount < minValue) {
            return { valid: false, error: `Amount must be at least ${minValue}`, amount: null };
        }

        return { valid: true, error: null, amount: numAmount };
    },

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @param {boolean} required - Is email required
     * @returns {{valid: boolean, error: string|null}}
     */
    validateEmail(email, required = true) {
        if (!email || email.trim() === '') {
            if (required) {
                return { valid: false, error: 'Email is required' };
            }
            return { valid: true, error: null }; // Optional and empty is okay
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return { valid: false, error: 'Invalid email format' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate month string (YYYY-MM format)
     * @param {string} monthStr - Month string to validate
     * @returns {{valid: boolean, error: string|null, year: number|null, month: number|null}}
     */
    validateMonthString(monthStr) {
        if (!monthStr || typeof monthStr !== 'string') {
            return { valid: false, error: 'Month string is required', year: null, month: null };
        }

        const parts = monthStr.trim().split('-');

        if (parts.length !== 2) {
            return { valid: false, error: 'Month must be in YYYY-MM format', year: null, month: null };
        }

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);

        if (isNaN(year) || year < 2000 || year > 2100) {
            return { valid: false, error: 'Invalid year', year: null, month: null };
        }

        if (isNaN(month) || month < 1 || month > 12) {
            return { valid: false, error: 'Invalid month (must be 1-12)', year: null, month: null };
        }

        return { valid: true, error: null, year, month };
    },

    /**
     * Validate payment method
     * @param {string} method - Payment method
     * @returns {{valid: boolean, error: string|null}}
     */
    validatePaymentMethod(method) {
        if (!method || method.trim() === '') {
            return { valid: false, error: 'Payment method is required' };
        }

        const validMethods = ['Cash', 'Cheque', 'NEFT', 'UPI', 'RTGS', 'Demand Draft', 'Online'];

        if (!validMethods.includes(method)) {
            return { valid: false, error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate applicant/shop object
     * @param {object} applicant - Applicant object to validate
     * @returns {{valid: boolean, errors: Array}}
     */
    validateApplicant(applicant) {
        const errors = [];

        if (!applicant) {
            return { valid: false, errors: ['Applicant is required'] };
        }

        const shopValidation = this.validateShopNumber(applicant.shopNo);
        if (!shopValidation.valid) {
            errors.push(shopValidation.error);
        }

        if (!applicant.applicantName || applicant.applicantName.trim() === '') {
            errors.push('Applicant name is required');
        }

        const rentValidation = this.validateAmount(applicant.rentBase, 0);
        if (!rentValidation.valid) {
            errors.push('Valid base rent is required');
        }

        if (applicant.email) {
            const emailValidation = this.validateEmail(applicant.email, false);
            if (!emailValidation.valid) {
                errors.push(emailValidation.error);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate payment record
     * @param {object} payment - Payment object to validate
     * @returns {{valid: boolean, errors: Array}}
     */
    validatePayment(payment) {
        const errors = [];

        if (!payment) {
            return { valid: false, errors: ['Payment object is required'] };
        }

        // Shop number
        const shopValidation = this.validateShopNumber(payment.shopNo);
        if (!shopValidation.valid) {
            errors.push(shopValidation.error);
        }

        // Payment date
        const dateValidation = this.validateDate(payment.paymentDate, false);
        if (!dateValidation.valid) {
            errors.push(dateValidation.error);
        }

        // Months array
        if (!payment.months || !Array.isArray(payment.months) || payment.months.length === 0) {
            errors.push('At least one month is required');
        } else {
            payment.months.forEach((m, idx) => {
                const monthValidation = this.validateMonthString(m);
                if (!monthValidation.valid) {
                    errors.push(`Month ${idx + 1}: ${monthValidation.error}`);
                }
            });
        }

        // Amounts
        const totalValidation = this.validateAmount(payment.total, 0.01); // At least 1 paisa
        if (!totalValidation.valid) {
            errors.push('Valid total amount is required');
        }

        // Payment method
        if (payment.paymentMethod) {
            const methodValidation = this.validatePaymentMethod(payment.paymentMethod);
            if (!methodValidation.valid) {
                errors.push(methodValidation.error);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ValidatorsCore = ValidatorsCore;
}
