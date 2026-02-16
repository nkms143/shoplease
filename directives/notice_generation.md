# Notice Generation Directive

## Goal
Identify defaulting tenants, generate escalating warning notices, and send automated emails based on outstanding dues and escalation levels.

## Input
- Current date
- Outstanding dues threshold (default: any amount > 0)
- Email configuration
- Notice templates

## Tools/Scripts to Use
- `NoticeModule.calculateApplicantDues()` in `extra_modules.js` → Dues calculation (delegates to Store)
- `NoticeModule.getEscalationInfo()` → Determine escalation level
- `Store.calculateOutstandingDues()` → Core dues calculation
- `Store.sendNoticeEmail()` → Email delivery

## Defaulter Identification

A tenant is considered a defaulter if:
1. **Has outstanding dues** > ₹0
2. **Due date has passed** (after payment day, typically 5th)
3. **No payment recorded** for overdue months
4. **Status is "Active"** (not Terminated)

```javascript
const applicants = Store.getApplicants();
const defaulters = applicants.filter(app => {
    if (app.status === 'Terminated') return false;
    
    const dues = Store.calculateOutstandingDues(app, today);
    return dues.totalAmount > 0;
});
```

## Escalation Levels

Notices escalate based on previous notice history:

| Level | Type | Criteria | Tone | Action |
|-------|------|----------|------|--------|
| **1** | Late Warning | First unpaid month | Polite reminder | Request payment |
| **2** | 2nd Notice | No payment after 1st notice + 7 days | Formal warning | Warn of consequences |
| **3** | Final Notice | No payment after 2nd notice + 7 days | Urgent/Legal | Threaten eviction/legal action |

### Escalation Logic

```javascript
function getEscalationInfo(shopNo, noticeLogs, dues) {
    const recentNotices = noticeLogs.filter(n => 
        n.shopNo === shopNo &&
        new Date(n.sentAt) > (new Date() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );
    
    if (recentNotices.length === 0) {
        return { nextLevel: 1, tooRecent: false };
    }
    
    const lastNotice = recentNotices[recentNotices.length - 1];
    const daysSinceLastNotice = (new Date() - new Date(lastNotice.sentAt)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastNotice < 7) {
        return { nextLevel: lastNotice.level, tooRecent: true }; // Don't spam
    }
    
    return { nextLevel: Math.min(lastNotice.level + 1, 3), tooRecent: false };
}
```

## Workflow

### 1. Identify Defaulters
Run daily/weekly to find tenants with overdue payments:
```javascript
const today = new Date();
const defaulters = [];

for (const applicant of allApplicants) {
    const dues = Store.calculateOutstandingDues(applicant, today);
    
    if (dues.totalAmount > 0 && applicant.status === 'Active') {
        defaulters.push({
            applicant: applicant,
            dues: dues,
            monthsCount: dues.monthsCount,
            penalty: dues.penalty
        });
    }
}
```

### 2. Check Escalation Status
For each defaulter, determine appropriate notice level:
```javascript
const noticeLogs = await Store.getNoticeLogs();

for (const defaulter of defaulters) {
    const escalation = NoticeModule.getEscalationInfo(
        defaulter.applicant.shopNo,
        noticeLogs,
        defaulter.dues
    );
    
    if (escalation.tooRecent) {
        console.log(`Skip ${defaulter.applicant.shopNo} - notice sent recently`);
        continue;
    }
    
    defaulter.noticeLevel = escalation.nextLevel;
}
```

### 3. Generate Notice Content
Based on escalation level, customize email:

**Level 1 - Late Warning**:
```
Subject: Reminder: Pending Rent Payments for Shop {shopNo}

Dear {name},

This is a friendly reminder that your rent payment for {months} is overdue.

Outstanding Amount: ₹{total}
- Base Rent: ₹{base}
- GST:₹{gst}
- Penalty: ₹{penalty}

Please make payment at your earliest convenience to avoid further penalties.

Thank you.
```

**Level 2 - Formal Notice**:
```
Subject: Formal Notice: Outstanding Rent Dues - Shop {shopNo}

Dear {name},

Despite our previous reminder, your rent remains unpaid for {months}.

Outstanding Amount: ₹{total}
Overdue Since: {oldestMonth}

This is a formal notice to clear dues within 7 days to avoid legal action.

Regards.
```

**Level 3 - Final Notice**:
```
Subject: URGENT: Final Notice Before Eviction - Shop {shopNo}

Dear {name},

This is your FINAL NOTICE before we initiate eviction proceedings.

Outstanding Amount: ₹{total}
Months Overdue: {count}

Legal action will commence if payment is not received within 48 hours.

URGENT ACTION REQUIRED.
```

### 4. Send Email
```javascript
async function sendNotice(defaulter) {
    const emailData = {
        to: defaulter.applicant.email,
        subject: getSubject(defaulter.noticeLevel, defaulter.applicant.shopNo),
        body: generateEmailBody(defaulter),
        level: defaulter.noticeLevel
    };
    
    await Store.sendNoticeEmail(emailData);
    
    // Log notice
    await Store.logNotice({
        shopNo: defaulter.applicant.shopNo,
        level: defaulter.noticeLevel,
        totalDue: defaulter.dues.totalAmount,
        sentAt: new Date().toISOString(),
        sentTo: defaulter.applicant.email
    });
}
```

### 5. Record Notice Log
Save to Supabase `notice_logs` table:
```sql
INSERT INTO notice_logs (
    shop_no, level, total_due, sent_to, sent_at, created_at
) VALUES (...)
```

## Validation Rules

1. **Email Required**: Skip if tenant has no email
2. **Active Status**: Only send to active tenants
3. **Cooling Period**: Don't send if notice sent in last 7 days
4. **Max Level**: Cap at level 3 (Final Notice)
5. **Amount > 0**: Only send if actual dues exist

## Edge Cases

### Penalty-Only Dues
If tenant paid rent but has pending penalty:
- Send "Penalty Reminder" instead of full notice
- Gentler tone
- Explain penalty calculation
- Don't escalate as aggressively

### Recent Payment (Race Condition)
If payment was made today but hasn't synced:
- Check payment timestamp
- Skip notice if payment < 24 hours old
- Recheck tomorrow

### Email Bounce
If email fails to send:
- Log failure
- Retry after 1 hour
- Alert admin if 3 consecutive failures
- Don't mark as "sent"

### Terminated Tenants
- Never send notices to terminated tenants
- Remove from defaulter list
- Archive old notice logs

## Spam Prevention

**Cooling Period**: 7 days minimum between notices
**Max Frequency**: 1 notice per week per tenant
**Escalation Limit**: Stop at level 3 (don't keep sending)

```javascript
if (daysSinceLastNotice < 7) {
    return { tooRecent: true }; // Don't send
}
```

## Integration Points

- **Dashboard**: "Defaulters" count and list
- **Dues Calculation**: Uses same logic as Dashboard
- **Email Service**: Supabase or SMTP configured
- **Notice Logs**: Stored in Supabase for audit trail

## Expected Outputs

- List of defaulters identified
- Emails sent with appropriate escalation
- Notice logs created in database
- Summary report (X notices sent, Y tenants contacted)

## Common Pitfalls

1. ❌ Sending duplicate notices (check cooling period)
2. ❌ Wrong escalation level (verify notice history)
3. ❌ Sending to terminated tenants
4. ❌ Email without error handling (bounce/fail cases)
5. ❌ Not logging notices (for audit trail)

## Testing Checklist

- ✅ Defaulters identified correctly
- ✅ Escalation logic works (1 → 2 → 3)
- ✅ Cooling period enforced (7 days)
- ✅ Email content appropriate for level
- ✅ Notice logs saved to DB
- ✅ Bounced emails handled gracefully
