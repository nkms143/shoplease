/**
 * SUDA Shop Lease - Ledger Core
 * Functions for generating and formatting shop ledgers and statements.
 */

const LedgerCore = {
    /**
     * Generates a HTML table representing the shop ledger.
     * @param {Object} dues - Dues summary (from Store)
     * @param {string} asOfDateStr - Date to display on statement
     * @returns {string} HTML string
     */
    generateLedgerHTML(dues, asOfDateStr) {
        let rows = '';
        if (dues.details && dues.details.length > 0) {
            dues.details.forEach((m, idx) => {
                rows += `
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px;">${m.month}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">₹${m.rent.toFixed(2)}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">₹${m.penalty.toFixed(2)}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right; font-weight: bold;">₹${(m.rent + m.penalty).toFixed(2)}</td>
                </tr>
                `;
            });
            rows += `
            <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="2" style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">TOTAL</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${(dues.baseRent + dues.gst).toFixed(2)}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${dues.penalty.toFixed(2)}</td>
                <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">₹${dues.totalAmount.toFixed(2)}</td>
            </tr>
            `;
        } else {
            rows = '<tr><td colspan="5" style="border: 1px solid #e2e8f0; padding: 20px; text-align: center;">No outstanding dues</td></tr>';
        }

        return `
            <div style="margin-top: 25px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b; text-transform: uppercase;">Detailed Statement (Ledger)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; border: 1px solid #e2e8f0;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569;">
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">Sl</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Month</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Rent+GST</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Penalty</th>
                            <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">* Penalty is calculated as on ${asOfDateStr}.</p>
            </div>
        `;
    },

    /**
     * [TESTING] Calls the Supabase RPC to compare against local logic
     * @param {string} shopNo - Shop number to fetch ledger summary for
     * @param {object} supabaseClient - Supabase client instance
     * @returns {Promise<object>} Result from the RPC
     */
    async testRpcLedgerSummary(shopNo, supabaseClient) {

        try {
            const { data, error } = await supabaseClient.rpc('get_shop_ledger_summary', { p_shop_no: shopNo });
            if (error) {
                console.error("RPC Error:", error);
                return null;
            }
            return data;
        } catch (err) {
            console.error("RPC Exception:", err);
            return null;
        }
    }
};

// Expose globally
window.LedgerCore = LedgerCore;
