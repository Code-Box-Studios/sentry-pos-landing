# Troubleshooting and common questions

[Guide home](README.md) · [Accounts and access](accounts-and-access.md) · [POS terminal](pos-terminal.md)

## Account and sign-in problems

| What you see | What to check | Next action |
| --- | --- | --- |
| **Invalid email/password** | Correct portal; correct account email/password; completed owner invitation or manager setup | Check typing with password visibility. Owners need activation; managers need active status and a terminal PIN. Cashiers use POS instead. |
| A lockout/countdown | Too many incorrect password/PIN attempts | Stop guessing and wait for the displayed countdown. Permanent login/PIN lockouts normally last five minutes after four failures. |
| No owner invitation | Email disabled, incorrect email, or invitation delivery issue | In this deployment email is off. New activation needs deployment/operator assistance and working email. There is no owner invite-copy/resend button. |
| No manager setup PIN | Manager challenges are sent only by email | They are not displayed to owners. Do not expect a PIN in logs while mail is disabled. Use an already active manager for current testing. |
| Temporary PIN rejected | Wrong account/role, old PIN, already used, older than 15 minutes, five failed attempts | Owner issues the latest challenge; finish the appropriate staff setup promptly. |
| Staff is **Pending** | First setup or owner-managed reset unfinished | Complete the matching manager/cashier procedure; generic Forgot password will not activate pending staff. |
| Staff is **Deactivated** | Owner has disabled access | Owner must reactivate and check whether retained credentials or new setup are required. |
| Owner is suspended | Platform access status | Contact the platform administrator. Resetting the password does not reinstate the account. |
| Cashier absent from operator list | Branch assignment, staff status and current terminal branch | Owner checks Staff and corrects assignments. Refresh operator information or reopen the unlock screen after the change. |
| Manager portal is missing a branch | Staff branch assignment | Owner checks the manager's assigned branches. Managers do not get automatic access to every branch. |
| Admin authenticator code rejected | Current code, device clock, repeated already-used code, expired sign-in step | Use automatic clock settings; wait for a fresh code. Restart sign-in if expired. An unused recovery code is an alternative. |
| CMS credentials fail in the portal | Separate CMS identity | Use `/cms` for CMS credentials; obtain a platform/owner account separately. |

### “The screen says an email was sent. Where is it?”

Email delivery is disabled in the current deployment, so no message is delivered even if a screen says “emailed.” This affects owner invitations, manager challenges, email password reset and daily summaries. Email being enabled without a configured delivery provider is also not the same as delivery to an inbox. The deployment operator must configure the service before those workflows can be relied on.

### “Can I create my own owner account?”

Use **Request access** on the public website to prepare an email to the platform team. A platform admin creates your owner record. There is no public Sign up form. See [Accounts and access](accounts-and-access.md).

### “Can I change my staff password or PIN myself?”

There is no signed-in staff credential-change page. The owner manages PIN resets and manager password-reset challenges. An already active manager can also use **Forgot password** when email works; it changes the portal password, not the terminal PIN or staff status.

## Pairing, connectivity and sessions

### The API takes time to respond after a break

The API runs on Render's free service and may need to wake after inactivity. Keep the browser open and let the request finish. If it fails, check your connection and try again after the service responds. If the request involved payment, follow the pending-payment procedure below before creating another sale.

### The terminal asks to pair again

Check whether the browser's site storage was cleared, you opened a different browser/profile, the owner unpaired the terminal, or its branch/business was archived. Pairing belongs to this browser's stored device identity. Use the owner's pairing procedure in [POS terminal](pos-terminal.md).

### The terminal locks unexpectedly

Sentry locks after five minutes without human input, and reload requires a PIN again. The operator session also has a maximum lifetime. Select your operator name and unlock with your permanent PIN. A lock preserves the cart, pending payment and drawer; it does not close a shift.

### Another operator cannot take over the open drawer

An open shift belongs to the operator who opened it. The original eligible operator must resume and close it before a normal handover. Manager/owner action approval does not transfer the drawer. Emergency close is available only when the original operator is no longer eligible; it is not a normal shift-switch shortcut.

### Can I keep selling with no internet?

The current deployed POS needs the API for completed transactions and stock/shift operations. Local cart persistence and a pending-payment draft provide continuity and retries, but do not implement complete offline selling or an offline sales queue.

## Cart, product and payment problems

| Problem | Checks and remedy |
| --- | --- |
| Product missing at POS | Owner checks active status/category/catalog and the terminal's business. Refresh catalog at POS after changes. |
| Product price changed but the cart shows the old price | Cart prices are captured when an item is added. Review/replace the line before checkout if the current catalog price is intended. Refresh alone does not reprice existing lines. |
| Cannot add an item | Select required variant/modifiers or enter weight; check available tracked stock. |
| Barcode does not find an item | Check the product or variant barcode in owner catalog and refresh. Scanner input behaves like keyboard input; keep focus in the appropriate search/scan control. |
| Discount unavailable | Check that the owner created an active named discount for the intended level. Staff cannot type arbitrary free-form discount amounts. |
| Total differs from a simple percentage calculation | Check VAT-inclusive price, SC/PWD line treatment, promotional discounts and dine-in service charge. See calculation rules in [POS terminal](pos-terminal.md). |
| Payment button stays disabled | Check cart, stock requirements and selected payment method. Cash tendered must cover the amount due. |
| Card/wallet reference missing | Reference is optional in the current UI. Record the intended reference before submitting if needed for reconciliation. |
| Need split payment or partial refund | Current UI supports one payment method per sale and whole-sale refunds. Use your store's approved process for a transaction the app cannot represent. |

### Payment was submitted, then the network dropped

1. Keep the current browser/site data intact.
2. Reconnect and use the existing pending-payment retry/recovery controls.
3. Keep the original draft, amounts and request identity while its result is uncertain.
4. Check **History** for the resulting receipt once connectivity returns.
5. If still uncertain, have a manager/owner review the sale/payment record before starting a replacement transaction.

The app saves the pending payment so the same attempt can be retried without recording another sale. Do not collect payment a second time merely because the first response was lost. Full details are in [POS terminal](pos-terminal.md).

## Voids, refunds and cash

### A correction is unavailable

Check the receipt status, shift and time rules in the [POS guide](pos-terminal.md). A sale that is already voided/refunded cannot be corrected again as an ordinary paid sale. Cashiers need an assigned manager or owner to approve protected actions; a manager refund also requires PIN confirmation.

### Cash is over or short at close

Count physical cash again, verify the opening float, review cash in/out entries, cash change and any refunded cash. Card/wallet sales are not physical drawer cash. Enter the actual count; do not change the counted amount just to make the variance zero. Review the closed shift/Z report and owner/manager shift analytics.

### “Close & print Z” closed the shift but no paper appeared

The shift closes before printing. Use the separate **Print Z** action and the printer dialog. A print failure does not reopen the shift. See printing below.

## Inventory and reports

| Problem | Checks and remedy |
| --- | --- |
| Stock is in the wrong place | Check branch and product/variant. Products share a catalog across branches; quantities do not. |
| Expiry-tracked stock cannot be received | Enter an expiry date for that item even if the form's general label says optional. |
| Transfer is rejected | Source/destination must differ and belong to the same business; check assigned access, quantity and available source stock. |
| Count balance is unexpected | Review which rows were counted and when stock moved. A draft does not change stock until posted. Review the resulting movements after posting. |
| Product options disappeared after saving links | Modifier linking saves a replacement set. Select every group you want attached, including existing intended groups. |
| Profit is missing or understated | Cost data may be missing; variants have cost-entry limitations. Check recorded cost and the owner guide before interpreting margin. Managers cannot access cost/profit reports. |
| Demo reports are empty | Select the demo business explicitly; ordinary combined owner totals exclude demos. |
| Sales fall on an unexpected date | Dashboard/analytics follow the business's operating-day cutoff. Terminal History's date filter uses the Manila calendar date. Check both scope and cutoff. |
| Report export has fewer rows than expected | Check filters and export-specific limits. Inventory movement CSV currently includes the first 50 filtered movements. Use narrower filters or the account data export where appropriate. |
| Alert did not appear immediately | Alerts depend on stock/cutoff checks and scheduled service work. Background jobs do not run while the free API service sleeps. Refresh after it wakes. |

## Receipts and printers

1. Check the terminal's **Settings** and choose the matching **58 mm** or **80 mm** paper width.
2. Use the test-print or preview control.
3. In the browser/system print dialog, choose the intended printer and matching paper size.
4. Check printer connection, power, paper and driver settings if the preview is correct but paper output is not.
5. Use **History → receipt → reprint** after a completed sale. A reprint is marked as a copy.

Sentry uses browser printing. Hardware behavior depends on the device, driver and printer; this guide does not assume a particular printer has been certified. Skipping/canceling a print does not cancel a sale.

## Website changes are missing

For landing content, confirm the CMS save succeeded and refresh the public page. For policies, verify the matching **Published** switch and required fields. Uploading Media alone does not add it to the landing design. Store product/logo images belong in the owner portal, not CMS Media.

## Ask for help with useful details

Give your administrator the role, business/branch, terminal code, receipt number if relevant, time of the problem, the action you took and the exact error/reference shown. Include a screenshot of the error if helpful. Never include your password, permanent PIN, setup token or recovery codes.

[Next: glossary →](glossary.md)
