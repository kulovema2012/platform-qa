# Edge cases: money and quantities

Apply to prices, totals, balances, invoices, refunds, discounts, taxes, stock and usage counts.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Rounding | Amounts like 0.1 + 0.2, 1/3, 33.335; many line items | Totals off by a cent; line items do not add up to the total |
| Currency | Different currencies, zero-decimal currencies (JPY), three-decimal ones (KWD) | Wrong decimals, mixed currencies summed together |
| Negative amounts | Enter -1 for price, quantity, refund or discount | Accepted where it makes no sense |
| Zero | Free item, zero-quantity line, zero balance | Errors, or zero treated as "unknown" |
| Unknown vs zero | A value the system could not determine | Shown or summed as 0 instead of unknown |
| Refund above payment | Refund more than was paid, or refund twice | Accepted; negative balance |
| Partial refunds | Several partial refunds adding to more than the total | Over-refund allowed |
| Discount stacking | Apply several codes, reuse a single-use code, expired code | Price below zero or below intended floor |
| Tax | Tax-inclusive vs exclusive, tax on discounted price, tax-exempt customer | Wrong tax or tax applied twice |
| Very large amounts | 999,999,999.99 and above | Overflow, formatting breaks, precision loss |
| Format and locale | Comma vs dot decimal, thousands separators, currency symbol position | Misread amounts (1.000 as one instead of one thousand) |
| Stock and seats | Sell or book the last unit; cancel and restock | Negative stock, phantom availability |
| Changes after payment | Edit an order, price or invoice after it is paid | Paid records change silently |
| Reports vs records | Compare report totals with the sum of underlying records | Mismatch |
| Audit trail | Change any money value; look for who changed it and when | No history |
