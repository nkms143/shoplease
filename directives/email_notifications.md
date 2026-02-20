# Email Notifications Workflow

This directive defines how to communicate with tenants via email regarding rent dues and legal notices.

## Notification Types

### 1. Rent Reminder (Soft)
- **When**: 1st of every month (after invoice generation).
- **Tone**: Professional, informative.
- **Content**: Monthly bill amount + Link to portal (if available).

### 2. Legal Notice (Escalated)
- **When**: Determined by `NoticesCore.getEscalationInfo`.
- **Level 1**: Basic reminder of arrears.
- **Level 2**: Formal warning about lease violation.
- **Level 3**: Final notice before eviction/legal action.

## Implementation Details

The `js/core/notifications.js` module should be used to send these emails.
- Use `Store.getApplicants()` to find tenant email addresses.
- Use `NoticesCore.getNoticeMetadata()` to get appropriate subjects.

## Constraints
- **Privacy**: Do not CC tenants on the same email. Each notification must be individual.
- **Verification**: Logs must be updated in the `notice_logs` table (via Supabase) after every successful send.
