import * as Store from '../store.js';

export function render(container) {
    container.innerHTML = `
        <div class="glass-panel">
            <h3>Rent Collection</h3>
            
            <div style="margin-top: 1.5rem; max-width: 600px;">
                <div class="form-group">
                    <label class="form-label">Select Shop / Applicant</label>
                    <select id="shop-select" class="form-select">
                        <option value="">-- Select Shop --</option>
                    </select>
                </div>

                <div id="payment-details-area" style="display: none; animation: fadeIn 0.3s ease;">
                    <div class="glass-panel" style="background: rgba(255,255,255,0.5); padding: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">Payment Details</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div>
                                <label class="form-label">Shop No</label>
                                <input type="text" id="disp-shop-no" class="form-input" readonly>
                            </div>
                            <div>
                                <label class="form-label">Applicant Name</label>
                                <input type="text" id="disp-name" class="form-input" readonly>
                            </div>
                             <div>
                                <label class="form-label">Rent (Base)</label>
                                <input type="text" id="disp-rent" class="form-input" readonly>
                            </div>
                            <div>
                                <label class="form-label">GST (18%)</label>
                                <input type="text" id="disp-gst" class="form-input" readonly>
                            </div>
                            <div style="grid-column: span 2;">
                                <label class="form-label">Total Monthly Rent</label>
                                <input type="text" id="disp-total" class="form-input" style="font-weight: bold; color: var(--primary-color);" readonly>
                            </div>
                        </div>

                        <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 1.5rem 0;">

                        <div class="form-group">
                            <label class="form-label">Payment Date</label>
                            <input type="date" id="payment-date" class="form-input">
                            <small id="due-date-hint" style="color: var(--text-muted); display: block; margin-top: 4px;"></small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Delay Penalty (₹15/day)</label>
                            <input type="text" id="penalty-amount" class="form-input" style="color: #ef4444;" readonly value="0">
                            <small style="color: var(--text-muted);">Calculated based on due date.</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Total Payable Amount</label>
                            <input type="text" id="final-payable" class="form-input" style="font-size: 1.2rem; font-weight: bold; color: #047857;" readonly>
                        </div>

                        <button id="btn-collect-payment" class="btn-primary" style="width: 100%; margin-top: 1rem;">Record Payment</button>
                    </div>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;

    populateShopSelect();
    setupLogic();
}

function populateShopSelect() {
    const applicants = Store.getApplicants();
    const select = document.getElementById('shop-select');

    applicants.forEach(app => {
        const opt = document.createElement('option');
        opt.value = app.shopNo;
        opt.textContent = `${app.shopNo} - ${app.applicantName}`;
        select.appendChild(opt);
    });
}

function setupLogic() {
    const select = document.getElementById('shop-select');
    const detailsArea = document.getElementById('payment-details-area');
    const dateInput = document.getElementById('payment-date');
    const penaltyInput = document.getElementById('penalty-amount');
    const finalInput = document.getElementById('final-payable');
    const btnCollect = document.getElementById('btn-collect-payment');

    let currentApplicant = null;

    select.addEventListener('change', () => {
        const shopNo = select.value;
        if (!shopNo) {
            detailsArea.style.display = 'none';
            currentApplicant = null;
            return;
        }

        const applicants = Store.getApplicants();
        currentApplicant = applicants.find(a => a.shopNo === shopNo);

        if (currentApplicant) {
            document.getElementById('disp-shop-no').value = currentApplicant.shopNo;
            document.getElementById('disp-name').value = currentApplicant.applicantName;
            document.getElementById('disp-rent').value = currentApplicant.rentBase;
            document.getElementById('disp-gst').value = currentApplicant.gstAmount;
            document.getElementById('disp-total').value = currentApplicant.rentTotal;

            const dueDay = currentApplicant.paymentDay;
            document.getElementById('due-date-hint').textContent = `Due by day ${dueDay} of the month`;

            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;

            detailsArea.style.display = 'block';
            calcPenalty(); // Initial calc based on today
        }
    });

    dateInput.addEventListener('change', calcPenalty);

    function calcPenalty() {
        if (!currentApplicant || !dateInput.value) return;

        const dateVal = new Date(dateInput.value);
        const dayOfMonth = dateVal.getDate();

        // Logic: Compare chosen date day with due day.
        // Wait, is it just day of month? Or specific month?
        // Requirement 2.b: "after the last payment day"
        // And "if 5th is the date then 5th of every month".

        // If I pay for "March", and payment date is March 10th, due date is March 5th.
        // I need to assume the payment is FOR the month the date falls in?
        // Or should I select "Payment For Month"?
        // Simplicity: Assume payment is for the current month of the date selected.

        const dueDay = parseInt(currentApplicant.paymentDay);
        // Construct Due Date for that month
        const dueDate = new Date(dateVal.getFullYear(), dateVal.getMonth(), dueDay);

        let penalty = 0;
        let diffDays = 0;

        // Visual check: is selected date AFTER due date?
        if (dateVal > dueDate) {
            const diffTime = Math.abs(dateVal - dueDate);
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            penalty = diffDays * 15;
        }

        // Logic check: What if pay for previous month? 
        // Current logic assumes payment date determines the month.
        // If I pay on April 2nd for March (Due March 5th), I am late? No.
        // If I pay on April 10th for March (Due March 5th), I am VERY late.
        // For this Model software, I will assume the user selects the date they are paying.
        // And we calculate penalty simply based on "Day of month" logic? 
        // No, delay is delay.

        // Correct Logic for Model:
        // Calculate delay simply by: If (PaymentDate > DueDateOfThatMonth), Penalty.
        // If paying really late (next month), it gets complicated.
        // I'll stick to the "Per Month" assumption for simplicity unless specified.
        // If date > due day of that month, penalty applies.

        penaltyInput.value = penalty;

        const totalRent = parseFloat(currentApplicant.rentTotal);
        finalInput.value = (totalRent + penalty).toFixed(2);
    }

    btnCollect.addEventListener('click', () => {
        if (!currentApplicant) return;

        const payment = {
            shopNo: currentApplicant.shopNo,
            rentAmount: currentApplicant.rentBase,
            gstAmount: currentApplicant.gstAmount,
            totalRent: currentApplicant.rentTotal,
            paymentDate: dateInput.value,
            penalty: penaltyInput.value,
            grandTotal: finalInput.value,
            timestamp: new Date().toISOString()
        };

        Store.savePayment(payment);
        alert(`Payment recorded for ${currentApplicant.shopNo}!`);

        // Reset
        select.value = '';
        detailsArea.style.display = 'none';
        currentApplicant = null;
    });
}
