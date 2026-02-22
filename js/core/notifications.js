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
    },

    /**
     * Generates a WhatsApp Click-to-Chat link.
     * @param {Object} tenant - Tenant data (applicant)
     * @param {Object} duesData - Either dues summary or invoice object
     * @param {String} type - "Invoice" or "Notice"
     * @param {Object} noticeMeta - Result from NoticesCore.getNoticeMetadata (required for Notices)
     * @returns {String} Fully formed wa.me URL
     */
    generateWhatsAppLink(tenant, duesData, type, noticeMeta = null) {
        // Sanitize phone number (remove non-digits)
        let phone = String(tenant.mobileNo || tenant.contactNo || "").replace(/\D/g, "");

        // Auto-prepend India country code if it's strictly 10 digits
        if (phone.length === 10) {
            phone = "91" + phone;
        }

        let text = "";

        if (type === "Invoice") {
            // DuesData is treated as an Invoice Object here
            const total = duesData.total !== undefined ? duesData.total.toFixed(2) : '0.00';
            text = `Dear ${tenant.applicantName},\n\nYour rent invoice for Shop No. ${tenant.shopNo} is ready.\n\n*Total Payable: ₹${total}*\n\nPlease ensure payment is made by the 5th of the month to avoid penalty.\n\nRegards,\nSUDA Siddipet`;
        } else {
            // DuesData is treated as a standard Dues Summary from DuesCore
            const warningText = noticeMeta && noticeMeta.warningType ? noticeMeta.warningType : 'Pending Dues Notice';
            const total = duesData.totalAmount !== undefined ? duesData.totalAmount.toFixed(2) : '0.00';
            const baseGst = duesData.baseRent !== undefined && duesData.gst !== undefined ? (duesData.baseRent + duesData.gst).toFixed(2) : '0.00';
            const penalty = duesData.penalty !== undefined ? duesData.penalty.toFixed(2) : '0.00';

            text = `Dear ${tenant.applicantName},\n\nThis is a *${warningText}* regarding pending dues of *₹${total}* for Shop No. ${tenant.shopNo}.\n\nBreakdown:\n- Rent + GST: ₹${baseGst}\n- Penalty: ₹${penalty}\n\nPlease remit the payment at the earliest to avoid further escalation.\n\nRegards,\nSUDA Siddipet`;
        }

        const encodedText = encodeURIComponent(text);

        // If phone is missing, it will open wa.me/?text=... which prompts user to select a contact manually
        return `https://wa.me/${phone}?text=${encodedText}`;
    }
};

// Expose globally
window.NotificationsCore = NotificationsCore;
