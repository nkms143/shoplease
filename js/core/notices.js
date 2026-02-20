/**
 * SUDA Shop Lease - Notices Core
 * Logic for notice escalation, types, and template rendering.
 */

const NoticesCore = {
    /**
     * Determines escalation level based on previous communication logs.
     * @param {string} shopNo 
     * @param {Array} logs - Notice logs for this shop
     * @param {Object} dues - Outstanding dues summary
     * @returns {Object} { nextLevel, currentStatus, color, count, tooRecent, isPenaltyOnly }
     */
    getEscalationInfo(shopNo, logs, dues) {
        // Standardize comparison
        const normTarget = String(shopNo).padStart(2, '0');

        // Only count actual NOTICES (filter out Invoices, Receipts, etc)
        const shopNoticeLogs = logs.filter(l => {
            const recordId = String(l.record_id).padStart(2, '0');
            if (recordId !== normTarget) return false;

            const isActuallyNotice = l.action_type === 'SEND_NOTICE' || l.action_type === 'SERVE_PHYSICAL';
            const isLegacyNotice = l.action_type === 'SEND_EMAIL' &&
                !String(l.description).includes('Invoice') &&
                !String(l.description).includes('Receipt');

            return isActuallyNotice || isLegacyNotice;
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLogs = shopNoticeLogs.filter(l => new Date(l.created_at) >= thirtyDaysAgo);
        const count = recentLogs.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const tooRecent = recentLogs.some(l => new Date(l.created_at) >= sevenDaysAgo);

        const isPenaltyOnly = (dues.baseRent + dues.gst) <= 0;

        let nextLevel = 1;
        let currentStatus = 'No Notice Sent';
        let color = '#64748b'; // Gray

        if (isPenaltyOnly) {
            nextLevel = 0;
            currentStatus = count > 0 ? 'Reminder Sent' : 'No Reminder';
            color = '#0ea5e9';
        } else if (count === 0) {
            nextLevel = 1;
            currentStatus = 'No Notice Sent';
            color = '#64748b';
        } else if (count === 1) {
            nextLevel = 2;
            currentStatus = '1st Notice Sent';
            color = '#f59e0b';
        } else if (count === 2) {
            nextLevel = 3;
            currentStatus = '2nd Notice Sent';
            color = '#f97316';
        } else {
            nextLevel = 3;
            currentStatus = 'Final Notice Sent';
            color = '#ef4444';
        }

        return { nextLevel, currentStatus, color, count, tooRecent, isPenaltyOnly };
    },

    /**
     * Returns the appropriate notice subject and warning type.
     * @param {Object} esc - Escalation info from getEscalationInfo
     * @param {string} shopNo
     * @returns {Object} { subject, warningType }
     */
    getNoticeMetadata(esc, shopNo) {
        let subject = `Notice: Rent Outstanding for Shop ${shopNo}`;
        let warningType = '1st Notice';

        if (esc.isPenaltyOnly) {
            subject = `Reminder: Pending Penalty Balance - Shop ${shopNo}`;
            warningType = 'Penalty Reminder';
        } else if (esc.nextLevel === 2) {
            subject = `Formal Notice: Outstanding Rent Dues - Shop ${shopNo}`;
            warningType = '2nd Notice';
        } else if (esc.nextLevel === 3) {
            subject = `URGENT: Final Notice Before Eviction - Shop ${shopNo}`;
            warningType = 'Final Notice';
        }

        return { subject, warningType };
    }
};

// Expose globally
window.NoticesCore = NoticesCore;
