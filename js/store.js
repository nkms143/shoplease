const APPLICANTS_KEY = 'suda_shop_applicants';
const PAYMENTS_KEY = 'suda_shop_payments';

// Applicants
export function getApplicants() {
    const data = localStorage.getItem(APPLICANTS_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveApplicant(applicant) {
    const applicants = getApplicants();
    // Check if update or new
    // For now, simple add. In real app, check ID/ShopNo.
    // Assuming ShopNo is unique.
    const index = applicants.findIndex(a => a.shopNo === applicant.shopNo);
    if (index >= 0) {
        applicants[index] = applicant;
    } else {
        applicants.push(applicant);
    }
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
}

// Payments
export function getPayments() {
    const data = localStorage.getItem(PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

export function savePayment(payment) {
    const payments = getPayments();
    payments.push(payment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function getShopPayments(shopNo) {
    const payments = getPayments();
    return payments.filter(p => p.shopNo === shopNo);
}
