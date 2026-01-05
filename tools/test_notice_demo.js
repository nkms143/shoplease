// Demo script for NoticeModule.calculateApplicantDues
// Usage examples:
//  node tools/test_notice_demo.js --shop 04
//  node tools/test_notice_demo.js --shop 04 --today 2025-12-23 --impl 2023-03-01 --data testdata.json

const fs = require('fs');

// Simple CLI args parser (no deps)
const rawArgs = process.argv.slice(2);
const argv = {};
for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a.startsWith('--')) {
        const key = a.slice(2);
        const val = rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-') ? rawArgs[++i] : true;
        argv[key] = val;
    } else if (a.startsWith('-')) {
        const key = a.slice(1);
        const val = rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-') ? rawArgs[++i] : true;
        argv[key] = val;
    }
}

const shopArg = String(argv.shop || argv.s || '04');
const today = argv.today ? new Date(argv.today) : new Date('2025-12-23');
const implDate = argv.impl ? new Date(argv.impl) : new Date('2023-03-01');
const dataFile = argv.data || argv.d || null;

// Load optional data file
let externalData = null;
if (dataFile) {
    try {
        externalData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (e) {
        console.error('Failed to read data file:', e.message);
        process.exit(1);
    }
}

// Mock Store (reads from externalData if provided)
const Store = {
    getShopPayments: (shopNo) => {
        if (externalData && Array.isArray(externalData.payments)) {
            return externalData.payments.filter(p => String(p.shopNo) === String(shopNo));
        }
        // default sample payments
        return [
            { paymentForMonth: '2024-07' },
            { paymentForMonth: '2024-08' },
            { paymentForMonth: '2024-09' },
            { paymentForMonth: '2024-10' },
            { paymentForMonth: '2024-11' },
            { paymentForMonth: '2024-12' },
            { paymentForMonth: '2025-01' },
            { paymentForMonth: '2025-02' }
        ];
    }
};

// Copied (adapted) calculateApplicantDues from extra_modules.js
function calculateApplicantDues(app, rate, implementationDateBtn, today) {
    const periods = [];
    const pushPeriod = (s, e, meta = {}) => {
        if (!s) return;
        const sd = new Date(s);
        if (isNaN(sd.getTime())) return;
        const ed = e ? new Date(e) : null;
        const endDate = ed && !isNaN(ed.getTime()) ? ed : today;
        sd.setDate(1);
        if (sd <= endDate) periods.push({ start: new Date(sd), end: new Date(endDate), meta });
    };

    const history = app.leaseHistory || app.rentHistory || app.previousLeases || [];
    if (Array.isArray(history) && history.length > 0) {
        history.forEach(h => {
            const s = h.leaseDate || h.rentStartDate || h.startDate;
            const e = h.expiryDate || h.leaseEndDate || h.endDate;
            pushPeriod(s, e, { source: 'history', entry: h });
        });
    }

    const activeStart = app.rentStartDate || app.leaseDate || null;
    pushPeriod(activeStart, null, { source: 'active' });

    const payments = Store.getShopPayments(app.shopNo) || [];
    const paidMonths = new Set(payments.map(p => String(p.paymentForMonth)));

    const addedMonthKeys = new Set();

    let totalBase = 0;
    let totalGST = 0;
    let totalPenalty = 0;
    const pendingMonths = [];

    periods.forEach(period => {
        const cur = new Date(period.start);
        while (cur <= period.end) {
            const y = cur.getFullYear();
            const mNum = cur.getMonth() + 1;
            const m = String(mNum).padStart(2, '0');
            const monthStr = `${y}-${m}`;

            if (addedMonthKeys.has(monthStr) || paidMonths.has(monthStr)) {
                cur.setMonth(cur.getMonth() + 1);
                continue;
            }

            addedMonthKeys.add(monthStr);

            const dueDay = parseInt(app.paymentDay) || 1;
            const dueDate = new Date(y, cur.getMonth(), Math.min(dueDay, 28));

            let p = 0;
            if (today > dueDate) {
                let startCounting = dueDate;
                if (implementationDateBtn && implementationDateBtn > dueDate) {
                    startCounting = implementationDateBtn;
                }
                if (today > startCounting) {
                    const diffTime = Math.abs(today - startCounting);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    p = diffDays * rate;
                }
            }

            let rentBase = parseFloat(app.rentBase || app.baseRent || app.rentAmount || 0) || 0;
            let gstAmt = parseFloat(app.gstAmount || app.gst || 0) || 0;
            let rentTotal = parseFloat(app.rentTotal || app.rent || app.totalRent || 0) || 0;

            if (period.meta && period.meta.entry) {
                const e = period.meta.entry;
                rentBase = parseFloat(e.rentBase || e.baseRent || e.rentAmount || rentBase) || rentBase;
                gstAmt = parseFloat(e.gstAmount || e.gst || gstAmt) || gstAmt;
                rentTotal = parseFloat(e.rentTotal || e.rent || e.totalRent || rentTotal) || rentTotal;
            }

            totalBase += rentBase;
            totalGST += gstAmt;
            totalPenalty += p;

            pendingMonths.push({
                month: cur.toLocaleString('default', { month: 'short', year: 'numeric' }),
                rent: rentTotal,
                penalty: p
            });

            cur.setMonth(cur.getMonth() + 1);
        }
    });

    return {
        baseRent: totalBase,
        gst: totalGST,
        penalty: totalPenalty,
        totalAmount: totalBase + totalGST + totalPenalty,
        details: pendingMonths,
        monthsCount: pendingMonths.length
    };
}

// Resolve applicant: prefer externalData.applicants if provided
let applicant = null;
if (externalData && Array.isArray(externalData.applicants)) {
    applicant = externalData.applicants.find(a => String(a.shopNo) === String(shopArg));
}

// Default sample applicant when none provided
if (!applicant) {
    applicant = {
        shopNo: shopArg,
        applicantName: 'Test Renter',
        paymentDay: '5',
        rentBase: '1000',
        gstAmount: '180',
        rentTotal: '1180',
        rentStartDate: '2024-07-01',
        leaseDate: '2024-07-01',
        leaseHistory: [
            { leaseDate: '2023-01-01', expiryDate: '2023-06-30', rentBase: '900', gstAmount: '162', rentTotal: '1062' },
            { leaseDate: '2023-07-01', expiryDate: '2023-12-31', rentBase: '950', gstAmount: '171', rentTotal: '1121' }
        ]
    };
}

const rate = parseFloat(argv.rate || argv.r || 15);

const result = calculateApplicantDues(applicant, rate, implDate, today);

console.log('Shop:', shopArg);
console.log('Date (today):', today.toISOString().slice(0, 10));
console.log('Penalty rate:', rate);
console.log('Implementation date:', implDate.toISOString().slice(0, 10));
console.log('---\nResult summary:');
console.log('Months count:', result.monthsCount);
console.log('Base rent total: ₹' + result.baseRent.toFixed(2));
console.log('GST total: ₹' + result.gst.toFixed(2));
console.log('Penalty total: ₹' + result.penalty.toFixed(2));
console.log('Grand total: ₹' + result.totalAmount.toFixed(2));
console.log('\nDetails:');
result.details.forEach(d => {
    console.log(`${d.month}  | Rent: ₹${d.rent}  | Penalty: ₹${d.penalty.toFixed(2)}`);
});

console.log('\nIncludes 2023-months?', result.details.some(d => d.month.includes('2023')) ? 'Yes' : 'No');
