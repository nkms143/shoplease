// ==========================================
// INVOICE MODULE
// ==========================================
const InvoiceModule = {
    render(container) {
        container.innerHTML = `
            <div class="glass-panel">
                 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Monthly Invoice Generator</h3>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; margin-bottom: 2rem; align-items: end;">
                     <div class="form-group">
                        <label class="form-label">Select Month</label>
                        <select id="inv-month" class="form-select">
                            <option value="">-- Select Month --</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Select Year</label>
                        <select id="inv-year" class="form-select"></select>
                    </div>
                    <div class="form-group">
                        <button class="btn-primary" id="btn-load-invoices" style="width: 100%;">Load / Generate</button>
                    </div>
                </div>

                <!-- Action Bar (Hidden until loaded) -->
                <div id="inv-actions" style="display: none; justify-content: space-between; margin-bottom: 1rem; padding: 1rem; background: #e0e7ff; border-radius: 8px;">
                    <div style="font-weight: bold; color: #1e293b; display: flex; align-items: center;">
                        <span id="inv-summary-text">0 Invoices Ready</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                         <button class="btn-primary" id="btn-email-all" style="background: #4f46e5;">📧 Email All</button>
                         <button class="btn-primary" id="btn-print-all" style="background: #0f172a;">🖨️ Print All</button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Shop No</th>
                                <th>Tenant Name</th>
                                <th>Rent</th>
                                <th>GST</th>
                                <th>Total Due</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inv-list-body">
                             <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Select Month & Year to load invoices.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.setupYearDropdown();
        document.getElementById('btn-load-invoices').addEventListener('click', () => this.loadInvoices());
        document.getElementById('btn-email-all').addEventListener('click', () => this.emailAll());
        document.getElementById('btn-print-all').addEventListener('click', () => this.printAll());

        // Auto-select next month by default
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        document.getElementById('inv-month').value = nextMonth.getMonth() + 1;
        document.getElementById('inv-year').value = nextMonth.getFullYear();
    },

    setupYearDropdown() {
        const yearSelect = document.getElementById('inv-year');
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 3; i++) {
            const y = currentYear + i;
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }
        yearSelect.value = currentYear;
    },

    loadInvoices() {
        const month = parseInt(document.getElementById('inv-month').value);
        const year = parseInt(document.getElementById('inv-year').value);

        if (!month || !year) {
            alert("Please select Month and Year");
            return;
        }

        const applicants = Store.getApplicants();
        const activeTenants = applicants.filter(a => a.status !== 'Terminated'); // Basic filter

        // Generate Invoice Objects
        // Currently generating on-the-fly, could be persisted if needed.
        this.currentInvoices = activeTenants.map(app => {
            const rent = parseFloat(app.rentBase || 0);
            const gst = parseFloat(app.gstAmount || (rent * 0.18)); // Fallback calc

            // Calculate Arrears (Up to END of Previous Month)
            // If selecting May, we want arrears up to April 30.
            const prevMonthEnd = new Date(year, month - 1, 0); // Day 0 of this month = Last day of prev month
            const duesObj = Store.calculateOutstandingDues(app, prevMonthEnd);
            const arrears = duesObj.totalAmount || 0;

            const total = rent + gst + arrears; // Include Arrears in Total

            return {
                shopNo: app.shopNo,
                name: app.applicantName,
                email: app.email,
                rent: rent,
                gst: gst,
                arrears: arrears,
                total: total,
                details: app,
                status: 'Draft' // Draft, Sent, Paid? (Paid check can be complex, let's stick to Invoice Status)
            };
        });

        // Check if previously sent (optional, maybe check audit logs or localstorage marker?)
        // For now, stateless generation.

        this.renderList();
    },

    renderList() {
        const tbody = document.getElementById('inv-list-body');
        const summary = document.getElementById('inv-summary-text');
        const actions = document.getElementById('inv-actions');

        if (this.currentInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No active tenants found.</td></tr>';
            actions.style.display = 'none';
            return;
        }

        actions.style.display = 'flex';
        summary.textContent = `${this.currentInvoices.length} Invoices Generated`;

        tbody.innerHTML = this.currentInvoices.map((inv, index) => `
            <tr>
                <td><strong>${inv.shopNo}</strong></td>
                <td>${inv.name} <div style="font-size: 0.8rem; color: #64748b;">${inv.email || '<span style="color:#ef4444">No Email</span>'}</div></td>
                <td>₹${inv.rent.toFixed(2)}</td>
                <td>₹${inv.gst.toFixed(2)}</td>
                <td style="font-weight: bold;">₹${inv.total.toFixed(2)}</td>
                <td><span class="status-badge status-draft" id="status-${index}">Ready</span></td>
                <td>
                    <button class="btn-primary" onclick="InvoiceModule.preview(${index})" style="padding: 4px 8px; font-size: 0.8rem; background: #64748b;">View</button>
                    ${inv.email ? `<button class="btn-primary" onclick="InvoiceModule.sendSingle(${index})" style="padding: 4px 8px; font-size: 0.8rem; background: #4f46e5;">Email</button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    generateHTML(invoice) {
        const monthName = new Date(2025, parseInt(document.getElementById('inv-month').value) - 1).toLocaleString('default', { month: 'long' });
        const year = document.getElementById('inv-year').value;

        // Dynamic Due Date Logic
        const dueDay = invoice.details.paymentDay || 5;
        const dueDate = new Date(year, parseInt(document.getElementById('inv-month').value) - 1, dueDay).toDateString();

        // Dynamic Penalty Rate
        const settings = Store.getSettings();
        const penaltyRate = parseFloat(settings.penaltyRate || 16).toFixed(2);

        return `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">SIDDIPET URBAN DEVELOPMENT AUTHORITY</h2>
                    <p style="margin: 5px 0 0;">Rent Invoice for ${monthName} ${year}</p>
                </div>
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <strong>To:</strong><br>
                            ${invoice.name}<br>
                            Shop No: ${invoice.shopNo}
                        </div>
                        <div style="text-align: right;">
                            <strong>Due Date:</strong> ${dueDate}<br>
                            <strong>Status:</strong> Unpaid
                        </div>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px; text-align: left;">Description</th>
                            <th style="padding: 10px; text-align: right;">Amount</th>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">Monthly Rent for Shop ${invoice.shopNo}</td>
                            <td style="padding: 10px; text-align: right;">₹${invoice.rent.toFixed(2)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">GST (18%)</td>
                            <td style="padding: 10px; text-align: right;">₹${invoice.gst.toFixed(2)}</td>
                        </tr>
                        ${invoice.arrears > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0; color: #b91c1c; background: #fef2f2;">
                            <td style="padding: 10px;">Arrears / Previous Dues</td>
                            <td style="padding: 10px; text-align: right;">₹${invoice.arrears.toFixed(2)}</td>
                        </tr>` : ''}
                        <tr style="font-weight: bold; background: #f1f5f9;">
                            <td style="padding: 10px;">Total Payable</td>
                            <td style="padding: 10px; text-align: right;">₹${invoice.total.toFixed(2)}</td>
                        </tr>
                    </table>

                    <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 6px; color: #9a3412; font-size: 0.9rem;">
                        <strong>Note:</strong> Please pay by the ${dueDay}th of the month to avoid penalty (Rs. ${penaltyRate} per day after due date).
                    </div>
                    <div style="margin-top:20px; font-size: 0.8rem; text-align: center; color: #64748b;">
                        This is a computer-generated invoice. No signature required.
                    </div>
                </div>
            </div>
        `;
    },

    preview(index) {
        const inv = this.currentInvoices[index];
        const html = this.generateHTML(inv);
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
    },

    async sendSingle(index) {
        const inv = this.currentInvoices[index];
        if (!inv.email) return;

        const btn = document.querySelectorAll(`button[onclick="InvoiceModule.sendSingle(${index})"]`)[0];
        const status = document.getElementById(`status-${index}`);

        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

        // Use Store.sendEmail
        const monthName = new Date(2025, parseInt(document.getElementById('inv-month').value) - 1).toLocaleString('default', { month: 'long' });
        const subject = `Invoice: Rent for Shop ${inv.shopNo} - ${monthName}`;
        const html = this.generateHTML(inv);

        await Store.sendEmail(inv.email, subject, `Please find attached the invoice for Shop ${inv.shopNo}.`, html);

        if (btn) { btn.textContent = 'Sent'; }
        if (status) {
            status.textContent = 'Sent';
            status.style.background = '#d1fae5';
            status.style.color = '#059669';
        }
    },

    async emailAll() {
        if (!confirm(`Are you sure you want to send emails to ${this.currentInvoices.filter(i => i.email).length} tenants?`)) return;

        const withEmail = this.currentInvoices.map((inv, idx) => ({ ...inv, idx })).filter(i => i.email);

        // Sequential sending to avoid rate limits
        for (const item of withEmail) {
            await this.sendSingle(item.idx);
            // Small delay
            await new Promise(r => setTimeout(r, 500));
        }
        alert("Batch sending completed!");
    },

    printAll() {
        const monthName = new Date(2025, parseInt(document.getElementById('inv-month').value) - 1).toLocaleString('default', { month: 'long' });
        const year = document.getElementById('inv-year').value;
        const w = window.open('', '_blank');

        let allHtml = `
            <html>
            <head>
                <title>Invoices ${monthName} ${year}</title>
                 <style>
                    @media print { .page-break { page-break-after: always; } }
                    body { font-family: sans-serif; }
                </style>
            </head>
            <body>
        `;

        this.currentInvoices.forEach(inv => {
            allHtml += this.generateHTML(inv);
            allHtml += '<div class="page-break" style="margin-bottom: 50px; border-bottom: 2px dashed #ccc;"></div>';
        });

        allHtml += '</body></html>';
        w.document.write(allHtml);
        w.document.close();
    }
};
