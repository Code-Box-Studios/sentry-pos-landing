# POS terminal user guide

[Guide home](README.md) · [Accounts and access](accounts-and-access.md) · [Owner](owner.md) · [Manager](manager.md) · [Cashier](cashier.md)

Use the [Sentry POS terminal](https://sentry-pos-terminal.onrender.com/) to record sales and run a cash drawer. Use the [Sentry portal](https://sentry-pos-landing.vercel.app/login) for business setup, staff administration, catalog maintenance, and wider reporting.

This guide describes the current terminal. Amounts are in Philippine pesos; displayed transaction times use Manila time. Instructions use the button names shown on screen.

Related guides: [Accounts and access](accounts-and-access.md) · [Owner](owner.md) · [Manager](manager.md) · [Cashier](cashier.md).

## Find a task

- [Before you begin and permissions](#before-you-begin-and-permissions)
- [Pair a terminal](#pair-a-terminal)
- [Unlock, set a PIN, lock, and change operator](#unlock-set-a-pin-lock-and-change-operator)
- [Open a shift](#open-a-shift)
- [Find and add products](#find-and-add-products)
- [Variants, modifiers, weight, quantities, and miscellaneous items](#variants-modifiers-weight-quantities-and-miscellaneous-items)
- [Order type, discounts, SC/PWD, and service charge](#order-type-discounts-scpwd-and-service-charge)
- [Hold, resume, discard, or clear a sale](#hold-resume-discard-or-clear-a-sale)
- [Take payment](#take-payment)
- [Recover an uncertain payment or stock conflict](#recover-an-uncertain-payment-or-stock-conflict)
- [Print and reprint receipts](#print-and-reprint-receipts)
- [History, voids, refunds, and approvals](#history-voids-refunds-and-approvals)
- [Cash movements, shift review, and closing](#cash-movements-shift-review-and-closing)
- [Check or adjust stock](#check-or-adjust-stock)
- [Settings, catalog refresh, and unpairing](#settings-catalog-refresh-and-unpairing)
- [Emergency drawer close](#emergency-drawer-close)
- [Activity and personal records](#activity-and-personal-records)
- [Troubleshooting and current limits](#troubleshooting-and-current-limits)
- [Daily checklist](#daily-checklist)

## Before you begin and permissions

You need a paired terminal, a personal six-digit terminal PIN, access to the terminal's branch, and an internet connection. Selling also requires an open shift belonging to the signed-in operator. Ask the owner to finish business, branch, product, price, stock, tax, and staff setup before the first trading day.

Pairing belongs to the browser profile used on the device. Return to that profile for daily work. Keep its saved browser data: pairing, held sales, and uncertain payment recovery depend on it. Clearing site data or moving to a different browser does not transfer the drawer or create a safe payment recovery.

A terminal is bound to one branch. Several terminals at a branch can share stock, but each has its own identity, receipt sequence, and drawer. Confirm the branch and terminal before taking money.

| Task | Owner | Manager assigned to this branch | Cashier assigned to this branch |
| --- | --- | --- | --- |
| Pair or unpair locally with the owner's email and password | Yes | Owner must do it | Owner must do it |
| Unlock with a personal terminal PIN | Yes, after setting the owner PIN | Yes, after credential setup | Yes, after credential setup |
| Open a shift, sell, take payments, print receipts | Yes | Yes | Yes |
| Resume, move cash, or normally close an open drawer | Only if you opened that drawer | Only if you opened that drawer | Only if you opened that drawer |
| Use active business discounts and SC/PWD controls | Yes | Yes | Yes |
| Enter a free percentage or peso discount | Yes | No | No |
| Void a completed sale in its own open shift | Yes | Yes | In-person manager or owner approval |
| Refund a completed sale | Confirm with your owner PIN | Confirm with your manager PIN | In-person manager or owner approval |
| Adjust terminal stock | Yes | Yes | In-person manager or owner approval |
| Recover an ineligible operator's drawer with emergency close | Eligible owner approval | Eligible branch manager approval | Request an eligible approver |

Owner credentials used for pairing are separate from the personal PIN used for terminal operation. Platform administrator credentials do not make someone a terminal operator. Staff administration and PIN recovery are covered in [Accounts and access](accounts-and-access.md).

The main tabs are **Sale**, **History**, **Shift**, **Stock**, **Settings**, and **Activity**. Cashiers see **My activity** for the last tab. On small screens, scroll the tab bar sideways. On **Sale**, a narrow screen shows a product list and **View sale** at the bottom; a wider screen keeps the current sale beside the catalog.

## Pair a terminal

**Who:** The business owner. **Before you begin:** Use the intended counter device and browser profile. The business and branch must already exist, and the owner account must be active.

1. Open the [terminal](https://sentry-pos-terminal.onrender.com/). An unpaired browser shows **Pair this terminal**.
2. Enter the owner's **Email** and **Password**, then select **Sign in**.
3. Select the correct **Business**.
4. Select the correct **Branch**; each option shows its name and branch code.
5. Enter a recognizable **Terminal name**, such as the physical counter name. The initial suggestion is **Counter 1**.
6. Check the business, branch, and name, then select **Pair terminal**.
7. Wait for pairing and catalog loading to finish. The operator unlock screen is the next step.

**Result:** This browser is connected to one business and branch and receives a terminal code. Pairing does not sign a cashier into a drawer and does not open a shift.

If no suitable business or branch appears, the owner must check that an active business and branch exist in the portal. A manager or cashier cannot pair using their own portal credentials. To move a paired browser to a different branch, finish its work, [unpair it](#unpair-or-move-the-terminal), then pair it again. Re-pairing creates a new terminal identity rather than reusing the old code.

## Unlock, set a PIN, lock, and change operator

### Unlock for daily work

**Before you begin:** The terminal is paired, your name is eligible for this branch, and you have a permanent six-digit PIN.

1. On **Unlock this terminal**, check the branch name.
2. Select your own name.
3. Enter **Your PIN**.
4. Select **Unlock terminal**.
5. If your drawer is still open, resume it. Otherwise, continue to **Open a shift**.

**Result:** Sales and drawer actions are attributed to you.

When a drawer is already open, only its original operator can normally resume it. Other names are disabled. A manager's presence or approval does not transfer that drawer.

If your name is absent, ask the owner to check your active status, business, and branch assignments. If you are the owner and the screen asks you to set an owner PIN, do that in portal settings first; you do not need a separate staff account.

### Replace a temporary PIN

**Before you begin:** The owner has issued a fresh temporary PIN for cashier setup or a terminal PIN reset. First-time manager credential setup uses the access flow described in [Accounts and access](accounts-and-access.md).

1. Select your name on **Unlock this terminal**.
2. Enter **Temporary PIN**.
3. Enter a different six-digit **New terminal PIN**.
4. Enter the same new value in **Confirm terminal PIN**.
5. Select **Set PIN and unlock**.

**Result:** The temporary PIN is consumed and your permanent terminal PIN is set. Use the new PIN next time.

Temporary PINs expire after 15 minutes and stop working after five failed verification attempts. A newly issued temporary PIN replaces the previous unused one. Ask the owner for a fresh PIN if it expires or is rejected; do not keep guessing.

### Lock when you leave the counter

1. Select **Lock** in the top bar.
2. Confirm that the unlock screen appears.
3. To return, choose your name and enter your PIN.

**Result:** The terminal is locked. The cart, held sales, unresolved payment, and open drawer remain.

The terminal also locks after five minutes without activity. Reloading always requires a PIN. An operator session lasts at most 12 hours, so a long working day may require unlocking again.

### Change operator at a handover

1. Resolve any [uncertain payment](#recover-an-uncertain-payment-or-stock-conflict).
2. Complete, discard, or clear all unsubmitted sales.
3. Count and [close the current operator's shift](#close-a-shift).
4. Select **Lock**.
5. The next operator selects their own name, enters their PIN, and opens a new shift with the cash they actually receive.

**Result:** Each operator has their own drawer attribution.

Locking alone is not a shift handover. If the original operator remains eligible, they must normally close their own drawer. [Emergency close](#emergency-drawer-close) is reserved for an operator who is no longer eligible, or a legacy drawer without an operator.

### Wrong PIN or password

Four failed permanent PIN attempts cause a five-minute PIN lock. Owner password attempts have their own four-attempt, five-minute lock. A further wrong attempt after the waiting period can lock the account again; a successful verification clears that credential's failure count.

Approval PIN attempts use the approving person's PIN, so an incorrect approval can affect that person's ability to unlock or approve. Wait for the stated time, verify the correct credential, and use the recovery process in [Accounts and access](accounts-and-access.md) when needed.

## Open a shift

**Who:** Any eligible owner, manager, or cashier operating their own drawer. **Before you begin:** Unlock the paired terminal and count the cash physically present.

1. On **Open a shift**, enter **Opening cash** using the money pad.
2. Enter an explicit zero if there is no opening float.
3. Select **Open shift**.
4. Check that the terminal opens **Sale** and shows **Shift open** with the opening time.

**Result:** A drawer is opened for your operator identity. Opening cash is a change float, not a sale.

Only one shift can be open on a terminal. If the terminal says a shift is already open, return to unlocking and resume the original operator's drawer rather than trying to create another. A shift does not close automatically at midnight or at the business-day boundary.

## Find and add products

### Search or browse

**Before you begin:** Your shift is open and the catalog has loaded.

1. Open **Sale**.
2. Select a category, or select **All** to search the full catalog.
3. Enter part of a product name or SKU in **Search products**. Search is case-insensitive and still respects the selected category.
4. Select the product tile or row.
5. If configuration is required, finish the [variant, modifier, or weight controls](#variants-modifiers-weight-quantities-and-miscellaneous-items).
6. Check the item and amount in **Current sale**. On a narrow screen, select **View sale**.

**Result:** The item enters the cart. Repeated selections of a plain product normally increase its existing line quantity; customized modifier selections have their own lines.

Only active catalog products appear in normal browsing. If **No products match** appears, clear the search and choose **All** before asking the owner to check the catalog.

The product price is captured when the item is added. Later catalog refreshes do not silently change the price already in your cart.

### Scan a barcode

**Before you begin:** The owner has configured the product or variant barcode. Use a scanner that behaves like a keyboard and sends Enter after the code.

1. Keep the **Sale** screen open and close any product dialog.
2. Scan the item.
3. A plain matching item is added immediately. A product requiring a variant, modifier, or weight opens its configuration first.
4. Check the selected item, variant, quantity, and total.

**Result:** The scan adds the catalog match without needing a typed name search.

The current scanner flow recognizes numeric codes of at least four digits. It uses fast keyboard input followed by Enter. It does not offer camera scanning or direct scanner pairing inside Sentry. If **No product for …** appears, find the item by name or SKU and ask the owner to correct its barcode.

### Stock warnings

A tracked item can show **OUT**, and cart changes can be rejected when stock is insufficient. Do not replace a catalog item with a miscellaneous item merely to bypass its stock control. Ask an authorized person to check the actual quantity.

Stock can change while another terminal sells. The final sale is checked again when you complete payment; a product being visible in the cart is not a stock reservation.

## Variants, modifiers, weight, quantities, and miscellaneous items

### Choose a variant and modifiers

1. Select a product with choices.
2. Under **SIZE — CHOOSE 1**, select the requested variant when that section appears. A scanned variant can already be selected.
3. Select the requested modifiers in each group. Follow the group's required minimum and maximum.
4. For a unit item, adjust quantity with **−** and **+**. For a weighted item, enter **Weight (kg)**.
5. Check the total beside **Add**, then select **Add — [amount]**.

**Result:** The chosen variant and modifiers are listed in the cart with their price effect.

**Add** remains disabled while a required choice is missing. A modifier group with one allowed choice replaces its previous selection; a group at its maximum will not accept another option.

To correct a variant or modifier selection after adding it, remove the line and add the correct configuration again.

### Add or change weight

1. Select a product sold by weight.
2. Enter its measured **Weight (kg)**; up to three decimal places are supported.
3. Check the displayed line total and select **Add**.
4. To change an existing weighted line, select its weight button, enter the corrected weight, and confirm.

**Result:** The charged quantity is the entered number of kilograms.

Read the weight from your scale and enter it. Sentry does not automatically read a connected weighing scale. For a product with variants or modifiers, enter weight within its configuration dialog.

### Change quantity or remove a line

1. In **Current sale**, use **+** or **−** on a unit line.
2. Check the recalculated amount.
3. To remove the line directly, select its **×** button.
4. Decreasing a unit line from one to zero also removes it.

**Result:** The unpaid cart changes. A completed sale requires a void or refund instead.

### Add a miscellaneous item

**Before you begin:** The owner has enabled miscellaneous items for the business. The **+ Misc item** button must be visible.

1. Select **+ Misc item**.
2. Enter **Name** and a positive **Amount**.
3. Select **Add**.
4. Check the new line. Use its quantity controls if necessary.

**Result:** An off-catalog unit line is added. It does not deduct catalog stock and is reported as miscellaneous activity.

This does not create a reusable catalog product. Ask the owner to add recurring products to the catalog.

### Notes and customer details

The terminal currently has no order-note or line-note entry and no customer profile form. Use configured modifiers for supported product choices. A held sale's **Label** helps identify that hold; it is not an order note. Stock adjustments have their own optional note and cash movements require a reason.

## Order type, discounts, SC/PWD, and service charge

### Set the order type

1. In **Current sale**, select **Dine-in**, **Takeout**, or **None**.
2. Check the totals before charging.

**Result:** The sale records that order type. A configured service charge applies only to **Dine-in**, using the subtotal after discounts. **Takeout** and **None** have no service charge.

Tax and service-charge rates come from the owner's business settings. Catalog prices are VAT-inclusive; the terminal shows the included VAT rather than adding the same VAT again.

### Apply or remove a named discount

**Who:** Owner, manager, or cashier. **Before you begin:** The owner has created an active discount that applies to the line or order.

1. For a line discount, select the line's **Discount** badge. For an order discount, select **Discount** at the bottom of the cart.
2. In **Line discount** or **Order discount**, select the appropriate business discount.
3. Check its effect in the totals.
4. To change it, reopen the same control and select another option.
5. To remove it, reopen the control and select **Remove discount**.

**Result:** The selected line or order discount is applied. Choosing a new discount replaces the prior discount at that level.

If no relevant option appears, ask the owner to check the discount's active status and where it applies. The system will not let discounts take the payable subtotal below zero.

### Enter a free discount

**Who:** The owner operating the terminal.

1. Open **Line discount** or **Order discount**.
2. Under **FREE ENTRY**, choose **Percent** or **Amount**.
3. Enter the discount. Percentage entry uses whole numbers up to 100; amount entry uses pesos.
4. Select **Apply [discount amount]**.
5. Check the total before charging.

**Result:** The entered discount applies to the selected scope.

Managers and cashiers must use the configured business discounts. An in-person approval does not unlock owner-only free-discount entry.

### Apply SC/PWD treatment

**Before you begin:** Check eligibility under your business's approved process.

1. Select **SC / PWD** at the bottom of the current sale.
2. Enter the customer's **ID number** and **Name**.
3. Select **Apply**.
4. Review each line's **SC/PWD** badge. Applying the customer details initially marks every current line; unmark lines that should not receive the treatment.
5. Review any items added afterward: new lines are initially marked while SC/PWD details remain active.
6. Check the final total and included VAT before charging.
7. To remove the customer treatment, reopen **SC / PWD** and select **Remove SC/PWD**.

**Result:** On marked lines, Sentry removes included VAT first and then applies 20%. A line receives the larger of its SC/PWD treatment or its line promo discount, with ties choosing SC/PWD. Order discounts exclude lines whose applied treatment is SC/PWD.

The receipt prints the customer's SC/PWD ID and name when that treatment contributes to the discount.

## Hold, resume, discard, or clear a sale

Held sales are saved in this browser for the current shift. They are unpaid and do not reserve stock. Resolve every hold before closing the drawer.

### Hold the current sale

1. In a nonempty **Current sale**, select **Hold**.
2. Enter a recognizable **Label**.
3. Select **Hold** in the dialog.

**Result:** The cart moves into **Held** and a fresh cart is shown.

### Resume a held sale

1. Open **Held · [count]** in the cart pane.
2. Find the label, line count, time, and amount.
3. Select **Resume**.
4. If another current sale is nonempty, the terminal asks **Replace the current sale?**. Select **Cancel** to retain it, or **Replace** only after deciding that its unsaved contents can be discarded.
5. Recheck the resumed cart and continue checkout.

**Result:** The held sale becomes the current sale and is removed from the held list.

If you need to keep the current sale before resuming another, hold it first. **Replace** is not a merge.

On a narrow screen, use **View sale** to reach the cart controls. If only held sales remain and the empty cart leaves **View sale** disabled, use a wider terminal view to reach **Held**.

### Discard a hold

1. Open **Held · [count]**.
2. Select **Discard** beside the unwanted hold.
3. Confirm **Discard this hold?** by selecting **Discard**, or select **Cancel**.

**Result:** That unpaid hold is removed. No completed transaction is reversed.

### Cancel or clear an unpaid cart

1. Select **Clear** in **Current sale**.
2. Check **Clear this sale?**.
3. Select **Clear sale** to remove every line, or **Cancel** to retain the cart.

**Result:** The current unpaid cart is cleared; held sales remain.

Before a payment is submitted, **← Back to sale** on the payment screen returns to cart editing. Once a payment is awaiting confirmation, follow the recovery steps below rather than clearing or replacing it.

## Take payment

**Before you begin:** Your own shift is open. Check items, quantities, order type, discounts, and **Total**.

1. Select **Charge [amount]**.
2. Check **AMOUNT DUE**.
3. Select **Cash**, **Card**, **GCash**, **Maya**, or **Other**.

Each sale uses one payment method. Split payments are not available.

### Cash

1. In **Cash tendered**, enter the cash received.
2. Select **Exact** for the precise amount due, or use the **₱100**, **₱200**, **₱500**, and **₱1000** buttons as money is received. These denomination buttons add to the amount already entered.
3. Read **Short** or **Change**.
4. If **Short** appears, collect the shortfall or return to the sale before submitting. **Complete sale** is disabled while cash is short.
5. Check the tendered amount and select **Complete sale** once.
6. Wait for **Sale completed — [receipt number]**.
7. Give the displayed change and print the receipt if required.

**Result:** The cash payment and change are recorded, stock is deducted, and the cart clears.

### Card, GCash, Maya, or Other

1. Complete and verify the payment using the appropriate external card or wallet service.
2. Select the matching method in Sentry.
3. Enter **Reference number (optional)** when available.
4. Select **Complete sale** once.
5. Wait for **Sale completed — [receipt number]**.

**Result:** Sentry records the sale's full total under that method. The reference appears on the receipt when entered and is available in reports and exports.

Selecting a payment method in Sentry records the payment; it does not itself charge a card, validate a wallet transfer, or contact a payment gateway. Confirm the actual payment through your normal provider before recording it.

## Recover an uncertain payment or stock conflict

### Payment awaiting confirmation

An interrupted connection can leave it unclear whether the server committed the sale. The terminal preserves the original cart, payment method, amount, reference, and receipt intent.

1. Stop editing or attempting to create a replacement sale.
2. Restore the internet connection.
3. If the terminal has locked or reloaded, unlock as the original operator. It should return to the pending payment.
4. Read **This payment is awaiting confirmation. Retry the original payment before changing the sale.**
5. Select **Retry original payment**.
6. Wait for a confirmed receipt or a specific rejection. Retrying the original transaction returns an already recorded sale instead of creating a second one.
7. If recovery keeps failing, leave the original payment intact and ask the owner or support to verify the transaction.

**Result:** A confirmed transaction proceeds to its receipt, or a definitive rejection releases the sale for correction.

The terminal disables payment editing and **Back to sale** while confirmation is pending. Do not collect the customer's money again merely because the receipt has not appeared. Do not unpair, clear browser data, or use emergency close to discard an unresolved payment.

### Stock changed during checkout

1. Read **Stock changed — fix the highlighted line**.
2. The terminal returns to **Sale** and highlights conflicting lines with **stock changed — adjust or remove**.
3. Check the actual stock. Reduce quantity, remove an unavailable item, or ask an authorized person to correct stock.
4. Check the cart total again.
5. Select **Charge** and finish payment again.

**Result:** The rejected attempt does not consume a receipt number or become a successful sale.

If money was already received externally, settle any changed amount with the customer before completing the corrected transaction. The stock check does not automatically reverse an external wallet or card payment.

### Other rejection

Read the message before repeating the action. A changed business discount or rate can cause a catalog/totals rejection. Once the terminal has definitively rejected the payment and editing is available, refresh the catalog and review the cart; remove and re-add affected lines or discounts when appropriate. If the screen still says awaiting confirmation, use **Retry original payment** and keep its original values.

## Print and reprint receipts

### Print after checkout

1. On **Sale completed — [receipt number]**, review the receipt.
2. Select **Print receipt**.
3. In the browser's print dialog, select the installed receipt printer and matching paper setup.
4. Complete the browser print action.
5. Select **Done — new sale** when you are ready for another customer.

**Result:** The recorded receipt is printed. Printing is optional and does not decide whether the sale was committed.

The receipt uses the business's branding and configured header/footer, branch information, receipt number, items, discounts, total, payment, change or reference, and tax figures. Ask the owner to correct receipt content in the portal.

### Reprint a past receipt

1. Open **History** and find the sale.
2. Select the sale row.
3. Select **Reprint**.
4. Complete the browser print action.

**Result:** A copy is printed with **REPRINT**. Voided or refunded receipts also show their current status. A reprint does not create another sale or change the receipt number.

### Printer setup

1. Install and configure the printer through the device or operating system.
2. In **Settings**, select **58 mm** or **80 mm** under **Receipt paper width**.
3. Select **Test print**.
4. Select the printer in the browser dialog and check that the output fits the roll.
5. Adjust the printer's paper settings and browser print options if needed, then test again.

**Result:** Sentry uses the selected receipt width for receipts and Z reports.

Printing uses the browser's print dialog. Sentry currently has no direct Bluetooth/USB printer connection screen, silent print integration, or automatic cash-drawer opening. Printer detection, cutting, and available paper sizes depend on the operating system, printer driver, and browser. Printing can briefly wait for a business logo; if the printer or dialog fails, use **Reprint** rather than recording the sale again.

## History, voids, refunds, and approvals

### Find a sale

1. Open **History**.
2. Use **Today**, **All**, or **Pick a date**.
3. Select the sale row to review its receipt and status.
4. Use **← History** to return to the list.

**Result:** You can review recorded sales from this terminal.

History is terminal-wide, so a cashier can see other operators' sales recorded on this terminal. Its date filter uses the Manila calendar date, which can differ from the configured business-day cutoff used in portal reporting. For your own records across the branch, use [My activity](#activity-and-personal-records).

### Void a same-shift mistake

**Before you begin:** The sale is completed, its original shift is still open on this terminal, and you are the original drawer operator. Cashiers need an eligible approver.

1. Open the sale in **History**.
2. Select **Void…**.
3. Enter a clear **Reason**.
4. If **Manager or owner approval** appears, follow the [approval procedure](#give-in-person-approval).
5. Select **Void sale**.
6. Check the sale's updated status.

**Result:** The entire sale is voided, its stock returns automatically, and the sale remains visible in History and the shift's Z report. A same-shift cash void removes that sale from the drawer's cash-sales calculation.

Void is not offered for a closed-shift sale or one already voided/refunded. Use a refund for a completed sale whose shift has closed. For a card or wallet mistake, arrange the actual reversal with the payment provider; the terminal status change does not send money.

### Refund a completed sale

**Before you begin:** The sale remains completed. You have checked the return and how money will be returned. Refunds are for the whole sale.

1. Find and open the sale in **History**.
2. Select **Refund…**.
3. Enter **Reason**.
4. An owner enters their current owner PIN; a manager enters their current manager PIN. A cashier uses **Manager or owner approval**.
5. Select **Refund [full amount]**.
6. Check the updated **refunded** status and arrange the actual customer repayment using your business's process.

**Result:** The entire sale is marked refunded, its stock returns automatically, and attribution and the reason are retained.

For a cash sale refunded while its own original shift remains open, that shift's expected cash is reduced. A refund outside the original open shift is recorded outside the current shift and does not automatically reduce a later drawer's expected cash. If cash actually leaves the current drawer for such a refund, record that movement under **Cash out** with an explanatory reason. Avoid recording another cash-out for a same-shift cash refund already deducted automatically.

Noncash refunds do not change expected cash. Sentry does not automatically refund a card or wallet. Partial refunds, changing individual refunded quantities, and refunding an already reversed sale are not supported.

### Give in-person approval

**Who:** An eligible owner or manager assigned to this branch, with a permanent PIN. **Used for:** A cashier's void, refund, or stock adjustment.

1. Review the sale or stock change, amount, and reason together with the cashier.
2. In **Manager or owner approval**, choose your identity under **Approver**.
3. Enter your own six-digit **Approver PIN** in person.
4. The cashier completes that one action using its confirmation button.
5. Check the success result before repeating any action.

**Result:** Only the requested action is authorized. The cashier remains the operator and retains ownership of the drawer.

The approver must currently be eligible. Approval is cleared after the action; re-enter it for a later action or a failed attempt. Never substitute a generic shared refund PIN for the person's own PIN.

## Cash movements, shift review, and closing

### Record cash in or out

**Who:** The operator who owns the open drawer.

1. Open **Shift**.
2. Under **Cash movements**, select **+ Cash in** for money entering the drawer or **− Cash out** for money leaving it.
3. Enter a positive **Amount** and an explanatory **Reason**.
4. Select **Record**.
5. Check the movement list when it is visible. With blind closing enabled, ask the owner or manager to verify the recorded movement in the portal if confirmation is unclear.

**Result:** The shift records the direction, amount, time, operator, and reason. Cash in increases expected cash; cash out decreases it.

Use these controls for float top-ups, safe drops, or cash expenses. A cash movement is not a product sale. Record actual physical movements accurately and do not use a correction movement to conceal an unexplained shortage.

If **Record** reports a connection error, check whether the movement already appears after returning to or reloading **Shift** before submitting it again. Blind closing hides pre-close cash movement history; ask the owner or manager to check the portal rather than repeating an uncertain movement.

### Review the shift

1. Open **Shift**.
2. Review the sales totals, payment-method totals, voids/refunds, SC/PWD discount, service charge, and cash movements shown.
3. If expected cash is visible, compare it with the physical drawer count.

Expected cash is opening float + non-voided cash sales − eligible same-shift cash refunds + cash in − cash out. Cash sales use the sale total, not the amount tendered before change. Card and wallet sales do not add cash to the drawer.

If the owner has enabled blind closing, cash-sensitive totals, the loaded cash movement history, and the Z preview are withheld before submission. This is intentional; count the physical drawer independently. Expected cash and over/short become visible in the closed Z report.

### Close a shift

**Who:** The original operator of the open drawer. **Before you begin:** Resolve uncertain payments, complete or discard every held sale, and complete or clear the current unpaid cart.

1. Open **Shift**.
2. Under **Close shift**, select **Counted cash**.
3. Count the physical cash and enter that count in **Count the drawer**. Enter an explicit zero when the drawer is empty.
4. Select **Done**.
5. Review the count. If blind closing is off, review **Expected** and **Over / short**.
6. Select **Close & print Z**.
7. Wait for the final **Z REPORT**. This records the close; printing is a separate step.
8. Select **Print Z** and complete the browser print action.
9. Select **Done** to continue to **Open a shift**. For handover, lock and let the next operator unlock first.

**Result:** The drawer is closed with its counted cash, expected cash, and variance. A shortage or overage does not by itself block closing.

A held sale blocks the close button until completed or discarded. Enter the actual count rather than changing it to match the expected amount. If closing fails or the result is unclear, check the shift state before attempting to open another drawer.

Print or save the Z report before leaving its completion screen. The terminal has no general archive screen for reopening old Z reports; use the portal's shift/report views for past shift review.

### Business-day boundary

If the business-day cutoff passes while a shift remains open, a banner says the day ended with the shift still open. Count and close it when appropriate. The banner refreshes while the terminal is in use. It does not automatically close the drawer or erase its sales.

## Check or adjust stock

### Check quantities

1. Open **Stock**.
2. Review tracked active products and their variants. Weighted quantities are labeled in kilograms.
3. Read **OUT** for no available quantity and **LOW** when quantity is at or below the configured low-stock threshold.
4. Use **Adjust** only after checking the physical stock and required permission.

**Result:** You see this branch's current tracked quantities. The terminal refreshes stock when this screen opens.

The terminal Stock list has no built-in search, receiving form, transfer flow, stock-count workflow, or expiry dashboard. Use the inventory workflows in the [Owner](owner.md) or [Manager](manager.md) guide for receiving deliveries, batches/expiry, transfers, formal counts, and stock history. Expiry on this terminal is an adjustment reason rather than a batch date or automatic expiry write-off.

### Post an adjustment

**Who:** Owner or manager directly; cashier with an eligible approver. **Before you begin:** Identify the exact product/variant and physically count its new available quantity.

1. Select **Adjust** beside the correct stock row.
2. Read **System says …**.
3. Enter **New quantity**, the resulting stock balance. For example, if the system has 10 and two damaged units are removed, enter 8, not 2.
4. Check the displayed change (**Δ**).
5. Choose **Damage**, **Expiry**, **Theft / loss**, **Count correction**, or **Other**.
6. Enter an optional **Note** explaining the count or event.
7. If you are a cashier, obtain **Manager or owner approval**.
8. Select **Post adjustment**.
9. Wait for success and check the refreshed quantity.

**Result:** The branch balance is set to the entered quantity and an adjustment is recorded with the operator, approver when used, change, reason, and note.

Quantity cannot be negative. Unit items use whole quantities; weighted items accept up to three decimal places. Enter zero to remove all available quantity. An adjustment is not a substitute for receiving a delivery with its cost and batch information.

If stock changes or the connection fails while posting, reopen the stock list and verify its latest balance before deciding whether another adjustment is needed.

## Settings, catalog refresh, and unpairing

### Review settings

1. Open **Settings**.
2. Under **Receipt paper width**, choose **58 mm** or **80 mm** and use **Test print**.
3. Under **Receipt preview**, select **Preview** to inspect the sample layout.
4. Check **Connection** for the API reachability result and **last catalog load** time.
5. Check **Paired to …** for the business, branch, terminal name, and branch code.

**Result:** You can check printer layout, connection, and the current binding.

Receipt branding and business configuration are maintained in the portal. The sample preview is not a newly recorded sale. Paper-width choice is saved on this terminal browser.

The top bar's **Online/Offline** chip describes the browser's network status. **Connection** checks whether the API can be reached when Settings opens. A green browser connection does not guarantee that the API is currently available.

### Refresh catalog data

1. Have the owner finish the catalog or business-setting change in the portal.
2. Return to the terminal tab so it becomes active, or switch away and back.
3. Wait for a successful catalog load. The terminal also refreshes automatically every 30 minutes.
4. Open **Settings** to inspect **last catalog load**.
5. Check a newly added item or current setting before continuing.

**Result:** The terminal receives current catalog/settings/stock data without automatically repricing existing cart lines.

There is no manual **Refresh catalog** button. Reloading also starts a catalog load but requires unlocking again. Existing cart prices stay captured at the time of addition; a pending payment retains its original transaction values. Resolve pending payments before trying to alter them.

### Unpair or move the terminal

**Who:** The owner of this business, using email and password. **Before you begin:** Resolve all uncertain payments and unsubmitted carts, close the drawer, and retain any needed printed records.

1. Open **Settings**.
2. Select **Unpair…**.
3. In **Unpair this terminal**, enter the owning account's **Email** and **Password**.
4. Select **Unpair**.
5. Confirm that **Pair this terminal** appears.
6. To move branches, repeat [pairing](#pair-a-terminal) with the new branch.

**Result:** This browser's old device authorization is revoked and local working cart/operator state is cleared. Previously recorded sales remain in the business's server records.

The owner can also revoke the terminal remotely from the portal; the terminal returns to pairing when that revocation is detected. Unpairing is not a drawer close and does not resolve a possibly committed payment. A new pairing has a new terminal code and its History does not automatically become the old terminal's history.

## Emergency drawer close

**Who:** An eligible owner or manager assigned to the branch. **Before you begin:** The original operator is no longer eligible, or the drawer is a legacy drawer without an operator. An eligible operator who is merely away, has forgotten a PIN, or is temporarily locked must normally recover access and close their own drawer.

1. On **Unlock this terminal**, select **Emergency close** when it is offered.
2. Review any blocked work. An unresolved payment must be checked first and cannot be discarded through this dialog.
3. If only unpaid carts remain and they are intentionally being abandoned, select **Discard unsubmitted carts**, then **Confirm discard of all unsubmitted carts**.
4. Count the drawer and enter **Counted cash**.
5. Enter an **Emergency close reason**.
6. Select the eligible owner/manager as **Approver** and have them enter their own **Approver PIN**.
7. Select **Submit counted close**.
8. Review the final Z report, use **Print Z**, then select **Done**.

**Result:** The drawer closes with the original operator attribution preserved and the closer/reason recorded. The approver is not signed in as a replacement operator. A new operator must unlock and open their own shift.

If the original operator is still active and eligible, the server rejects this recovery. If a pending payment cannot be resolved because the original operator is now ineligible, stop and involve the owner/support to reconcile it; the terminal offers no ordinary takeover or force-clear path.

## Activity and personal records

1. Open **My activity** as a cashier, or **Activity** as an owner/manager.
2. Review **Sales** for receipt numbers, amounts, time, and status.
3. Review **Shifts & over/short** for open/closed drawers and completed variances.
4. Select **Refresh** to load the latest records.

**Result:** A cashier sees their own attributed sales and drawers at this branch. Owners and managers see branch activity. Each list is limited to the latest 100 records.

Over/short appears only after a drawer closes. **You** identifies your own activity; other records may say **Attributed operator** or **Legacy terminal activity**. This screen is a summary, not a receipt-detail or old-Z printing screen. Use **History** for this terminal's receipt details and portal reporting for wider records.

## Troubleshooting and current limits

| What you see | What to do |
| --- | --- |
| No eligible operators or your name is missing | Ask the owner to check active status and branch assignments. Use the access guide for setup or PIN reset. |
| Drawer belongs to its original operator | Unlock as that operator. Obtain action approval without switching them, or use eligible emergency recovery only when its conditions apply. |
| Wrong PIN, attempts left, or locked | Stop guessing. Wait for the stated lock period or ask the owner for the proper recovery. |
| No products match | Clear search, select All, refresh by returning to the tab, then have the owner check active catalog entries. |
| Barcode not found | Search by name/SKU; check the numeric barcode and scanner's Enter suffix. |
| OUT, insufficient stock, or highlighted stock conflict | Check actual stock, reduce/remove the line, or get an authorized adjustment. Recheck payment after changing the total. |
| API unreachable or Offline | Restore connectivity. The terminal does not complete live sales offline. A saved cart is not an offline sales queue. |
| Payment awaiting confirmation | Unlock as the original operator and use Retry original payment. Keep the original browser data and do not create a replacement transaction. |
| Approval rejected | Check the approver's assignment, active status, and current personal PIN; ask them to enter it again in person. |
| Close button disabled | Enter an explicit cash count and resolve all held sales. Resolve pending payments before closing. |
| Print dialog or printer fails | Check driver, paper width, and browser options. Reprint the recorded receipt; do not record another sale. |
| Terminal returns to pairing unexpectedly | Ask the owner whether it was revoked or account access changed. Do not re-pair blindly if a drawer or payment needs reconciliation. |
| Catalog looks old | Return focus to the tab and check last catalog load. Existing cart prices do not automatically update. |

Current boundaries: one payment method per sale; full-sale void/refund only; no customer/order note form; no automatic scale, camera scanner, or direct printer/drawer integration; no full offline synchronization; and no delivery-receiving or batch-expiry interface on the terminal. Use the portal role guides for the business workflows outside these screens.

## Daily checklist

### Before the first sale

- [ ] Use the intended paired browser and confirm branch/terminal identity.
- [ ] Confirm internet and API access.
- [ ] Unlock using your own name and PIN.
- [ ] Resume your existing drawer or count float and open your shift.
- [ ] Resolve any payment awaiting confirmation before starting another sale.
- [ ] Check products/prices and confirm paper-width/test-print setup.

### For each sale

- [ ] Check product configuration, quantity or weight, and available stock.
- [ ] Check order type, discounts, SC/PWD markings, service charge, and total.
- [ ] Verify actual cash or external payment.
- [ ] Submit once and wait for the completed receipt.
- [ ] Give change and print when required.
- [ ] Use Hold for unpaid work and Lock whenever leaving the counter.

### Before closing or handing over

- [ ] Resolve every uncertain payment.
- [ ] Complete/discard holds and complete/clear the current unpaid cart.
- [ ] Record actual cash in/out with reasons.
- [ ] Count the physical drawer independently.
- [ ] Submit the actual counted close and retain the final Z report.
- [ ] Lock the terminal; the next operator unlocks under their own identity.
- [ ] Escalate unresolved access, transaction, or stock discrepancies to the owner.
