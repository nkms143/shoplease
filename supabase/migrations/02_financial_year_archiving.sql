-- Complete Archiving Process
CREATE OR REPLACE FUNCTION public.archive_financial_year(p_year integer)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_cutoff_date DATE;
    v_forward_date DATE;
BEGIN
    v_cutoff_date := make_date(p_year, 3, 31);
    v_forward_date := make_date(p_year, 4, 1);

    -- 1. Archive original payments (exclude previous summaries to avoid duplicate history)
    INSERT INTO payments_archive 
    SELECT *, p_year as archive_year
    FROM payments 
    WHERE payment_date <= v_cutoff_date AND payment_method != 'ARCHIVE';

    -- 2. Delete the old records and use CTE to generate the balance brought forward
    WITH deleted_records AS (
        DELETE FROM payments
        WHERE payment_date <= v_cutoff_date
        RETURNING *
    )
    INSERT INTO payments (
        id, 
        payment_date, 
        amount_base, 
        amount_gst, 
        amount_penalty, 
        amount_total, 
        shop_no, 
        receipt_no, 
        payment_for_month, 
        payment_method
    )
    SELECT 
        gen_random_uuid(),
        v_forward_date,
        SUM(amount_base),
        SUM(amount_gst),
        SUM(amount_penalty),
        SUM(amount_total),
        shop_no,
        'ARCH-' || p_year || '-' || shop_no,
        'Consolidated Data through ' || p_year,
        'ARCHIVE'
    FROM deleted_records
    GROUP BY shop_no;

END;
$$;
