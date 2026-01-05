import * as Store from '../store.js';

export function render(container) {
    container.innerHTML = `
        <div class="glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h3>Applicant Details</h3>
                <button class="btn-primary" id="btn-add-applicant">
                    <span style="margin-right: 0.5rem;">+</span> New Applicant
                </button>
            </div>
            
            <div id="applicant-form-container" style="display: none; margin-bottom: 2rem;">
                <!-- Form injected here -->
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Shop No</th>
                            <th>Applicant Name</th>
                            <th>Type</th>
                            <th>Rent (Total)</th>
                            <th>Lease Expiry</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="applicant-list-body">
                        <!-- Rows -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('btn-add-applicant').addEventListener('click', () => {
        showForm();
    });

    renderList();
}

function showForm() {
    const container = document.getElementById('applicant-form-container');
    container.style.display = 'block';

    // Hide 'New Applicant' button? Or just toggle.
    document.getElementById('btn-add-applicant').style.display = 'none';

    container.innerHTML = `
        <div class="glass-panel" style="background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6);">
            <h4 style="margin-bottom: 1.5rem; color: var(--primary-color);">New Shop Lease Registration</h4>
            <form id="applicant-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    
                    <!-- Shop Details -->
                    <div class="form-group">
                        <label class="form-label">Shop Number</label>
                        <input type="text" name="shopNo" class="form-input" required placeholder="e.g. S-101">
                    </div>
                     <div class="form-group">
                        <label class="form-label">Zone / Authority</label>
                        <input type="text" class="form-input" value="Siddipet Urban Development Authority" readonly>
                    </div>

                    <!-- Applicant Basic -->
                    <div class="form-group">
                        <label class="form-label">Applicant Name</label>
                        <input type="text" name="applicantName" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Applicant Type</label>
                        <select name="applicantType" id="applicantType" class="form-select">
                            <option value="Individual">Individual</option>
                            <option value="Proprietor">Proprietor</option>
                        </select>
                    </div>

                    <!-- Proprietor Specific (Conditional Validation in JS) -->
                    <div class="form-group type-proprietor" style="display: none;">
                        <label class="form-label">Shop Name (Proprietor)</label>
                        <input type="text" name="proprietorShopName" class="form-input">
                    </div>
                    <div class="form-group type-proprietor" style="display: none;">
                        <label class="form-label">Shop GST Number</label>
                        <input type="text" name="shopGst" class="form-input">
                    </div>

                    <!-- ID Proofs -->
                    <div class="form-group">
                        <label class="form-label">PAN Number</label>
                        <input type="text" name="pan" class="form-input" placeholder="ABCDE1234F">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Aadhar Number (12 Digits)</label>
                        <input type="text" name="aadhar" class="form-input" pattern="\\d{12}" title="12 Digit Aadhar Number" placeholder="1234 5678 9012">
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                        <label class="form-label">Address</label>
                        <textarea name="address" class="form-input" rows="2"></textarea>
                    </div>

                    <!-- Financials -->
                    <div class="form-group">
                        <label class="form-label">Rent Amount (Excl. GST)</label>
                        <input type="number" name="rentBase" id="rentBase" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">GST Amount (18%)</label>
                        <input type="number" name="gstAmount" id="gstAmount" class="form-input" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total Rent</label>
                        <input type="number" name="rentTotal" id="rentTotal" class="form-input" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Monthly Payment Due Date</label>
                        <select name="paymentDay" class="form-select" required>
                            <option value="">Select Day (1-31)</option>
                            ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                        </select>
                        <small style="color: var(--text-muted); font-size: 0.8rem;">Day of every month when payment is due.</small>
                    </div>

                    <!-- Dates -->
                    <div class="form-group">
                        <label class="form-label">Lease Start Date</label>
                        <input type="date" name="leaseDate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Lease Expiry Date</label>
                        <input type="date" name="expiryDate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Agreement Date</label>
                        <input type="date" name="agreementDate" class="form-input" required>
                    </div>

                </div>

                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" class="btn-primary" style="background: #94a3b8;" id="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-primary">Save Applicant</button>
                </div>
            </form>
        </div>
    `;

    // Dynamic Logic
    const form = document.getElementById('applicant-form');
    setupFormLogic(form);

    document.getElementById('btn-cancel').addEventListener('click', () => {
        container.style.display = 'none';
        document.getElementById('btn-add-applicant').style.display = 'block';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveApplicantForm(new FormData(form));
    });
}

function setupFormLogic(form) {
    // Type Toggle
    const typeSelect = form.querySelector('#applicantType');
    const propFields = form.querySelectorAll('.type-proprietor');

    typeSelect.addEventListener('change', () => {
        const isProp = typeSelect.value === 'Proprietor';
        propFields.forEach(el => el.style.display = isProp ? 'block' : 'none');
    });

    // Rent Calc
    const rentBase = form.querySelector('#rentBase');
    const gstAmount = form.querySelector('#gstAmount');
    const rentTotal = form.querySelector('#rentTotal');

    rentBase.addEventListener('input', () => {
        const val = parseFloat(rentBase.value) || 0;
        const gst = val * 0.18;
        const total = val + gst;

        gstAmount.value = gst.toFixed(2);
        rentTotal.value = total.toFixed(2);
    });
}

function saveApplicantForm(formData) {
    const data = Object.fromEntries(formData.entries());

    // Add timestamp
    data.createdAt = new Date().toISOString();

    // Validation (Aadhar 12 digits)
    if (data.aadhar && !/^\d{12}$/.test(data.aadhar)) {
        alert('Aadhar number must be exactly 12 digits.');
        return;
    }

    try {
        Store.saveApplicant(data);
        alert('Applicant saved successfully!');

        // Reset and hide
        document.getElementById('applicant-form-container').style.display = 'none';
        document.getElementById('btn-add-applicant').style.display = 'block';
        renderList();

    } catch (e) {
        console.error(e);
        alert('Error saving data');
    }
}

function renderList() {
    const applicants = Store.getApplicants();
    const tbody = document.getElementById('applicant-list-body');

    if (applicants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No applicants info found. Add one to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = applicants.map(app => `
        <tr>
            <td><strong>${app.shopNo}</strong></td>
            <td>${app.applicantName}</td>
            <td><span style="font-size: 0.85rem; padding: 2px 8px; background: #e0e7ff; border-radius: 4px; color: #4338ca;">${app.applicantType}</span></td>
            <td>₹${app.rentTotal}</td>
            <td>${app.expiryDate}</td>
            <td>
                <button style="border:none; background:none; cursor:pointer;" title="Edit">✏️</button>
            </td>
        </tr>
    `).join('');
}
