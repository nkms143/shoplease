the logic is incorrect i will describe the step by step guide for catching the arrears...

1. initially we will catch the shop pending amount month wise and categorize it into financial year (2023- [x] **Refine DCB Report Logic** <!-- id: 4 -->
    - [x] Fix Historical Rent Lookup (use `leaseHistory`) <!-- id: 5 -->
    - [x] Fix "13th Month" Bug (Date Normalization) <!-- id: 6 -->
    - [x] Align Penalty Logic with Notice Module <!-- id: 7 -->
    - [x] Implement "Arrear Demand" as Opening Balance (exclude settled months) <!-- id: 8 -->
    - [x] **Verify Shop 2 Data** (Pending Dec-Mar) <!-- id: 9 -->
    - [/] **Verify Shop 3 Data** (Negative Balance Analysis) <!-- id: 10 -->
- [x] **UI Improvements** <!-- id: 11 -->
    - [x] Change Date Range to Financial Year Dropdown (YYYY-YY) <!-- id: 12 -->
    - [x] Fix `appendChild` Error <!-- id: 13 -->the months December-2024, January-2025, February-2025 and March-2025 (Financial year of 2024-25 ends on March-2025) as arrear for shop No. 02. and pull the Arrear Base Amount from the shop details base rent and check wheter any base rent change is happening or not  and multiply it with the number of months pending upto March-2025 as arrear base amount. 
    second step - Similarly we will catch the Arrear GST amount and Arrear Penalty amount and multiply it with the number of months / days which ever is applicable  upto March-2025 as arrear GST  amount and Arrear Penalty Amount.
    third step - we will fetch the payment for these arrear months (december-2024 march-2025) in the Current Financial year i.e. 2025-26 because the DCB We are generating is for the Financial year 2025-26, and we will check any payment is done in current Financial year from Rent Collection module. if any payment is done then it will be captured in Arrear Collection column of DCB and then the balance is Demand - collection.