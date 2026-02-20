/**
 * SUDA Shop Lease - Notifications Core
 * Pure functions for preparing notifications.
 */

const NotificationsCore = {
    /**
     * Prepares an email payload for a tenant.
     * @param {Object} tenant - Tenant data (applicant)
     * @param {Object} dues - Dues summary 
     * @param {Object} noticeMeta - Result from NoticesCore.getNoticeMetadata
     * @returns {Object} { to, subject, body }
     */
    prepareRentNoticeEmail(tenant, dues, noticeMeta) {
        const body = `
Dear ${tenant.applicantName},

This is a ${noticeMeta.warningType} regarding your Shop No. ${tenant.shopNo}.

According to our records, your current outstanding balance is ₹${dues.totalAmount.toFixed(2)}.

Breakdown:
- Base Rent + GST: ₹${(dues.baseRent + dues.gst).toFixed(2)}
- Interest/Penalty: ₹${dues.penalty.toFixed(2)}

Please remit the payment at the earliest to avoid further escalation.

Regards,
SUDA Team
        `.trim();

        return {
            to: tenant.email || tenant.mobileNo, // Fallback if no email
            subject: noticeMeta.subject,
            body: body
        };
    }
};

// Expose globally
window.NotificationsCore = NotificationsCore;
