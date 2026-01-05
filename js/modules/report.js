import * as Store from '../store.js';

export function render(container) {
    container.innerHTML = `
        <div class="glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h3>Monthly Payment Reports</h3>
                <div>
                     <button class="btn-primary" onclick="window.print()" style="background: #64748b;">Print Report</button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date Paid</th>
                            <th>Shop No</th>
                            <th>Rent (Base)</th>
                            <th>GST (18%)</th>
                            <th>Penalty</th>
                            <th>Total Paid</th>
                        </tr>
                    </thead>
                    <tbody id="report-list-body">
                        <!-- Rows -->
                    </tbody>
                </table>
            </div>
            
            <div id="report-summary" style="margin-top: 2rem; text-align: right; font-weight: 600;">
                <!-- Totals -->
            </div>
        </div>
    `;

    renderReport();
}

function renderReport() {
    const payments = Store.getPayments();
    const tbody = document.getElementById('report-list-body');
    const summary = document.getElementById('report-summary');

    // Sort by date desc
    payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No payment records found.</td></tr>';
        return;
    }

    let totalCollected = 0;
    let totalPenalty = 0;

    tbody.innerHTML = payments.map(p => {
        totalCollected += parseFloat(p.grandTotal);
        totalPenalty += parseFloat(p.penalty);

        return `
            <tr>
                <td>${p.paymentDate}</td>
                <td><strong>${p.shopNo}</strong></td>
                <td>₹${p.rentAmount}</td>
                <td>₹${p.gstAmount}</td>
                <td style="color: ${p.penalty > 0 ? '#ef4444' : 'inherit'};">${p.penalty > 0 ? '₹' + p.penalty : '-'}</td>
                <td style="font-weight: 500; color: #047857;">₹${p.grandTotal}</td>
            </tr>
        `;
    }).join('');

    summary.innerHTML = `
        <div style="font-size: 1.1rem;">
            Total Collected: <span style="color: #047857;">₹${totalCollected.toFixed(2)}</span>
            <br>
            <span style="font-size: 0.9rem; color: #ef4444;">(Includes ₹${totalPenalty.toFixed(2)} Penalties)</span>
        </div>
    `;
}
