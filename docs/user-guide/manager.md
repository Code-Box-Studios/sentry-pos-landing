# Manager guide

[Guide home](README.md) · [Accounts and access](accounts-and-access.md) · [POS terminal guide](pos-terminal.md) · [Cashier guide](cashier.md)

A manager uses the portal to oversee assigned branches and the POS terminal to serve customers or approve cashier actions. Your business owner creates your account and chooses your branches. Your access belongs to one business.

Use your **email and portal password** in the [portal](https://sentry-pos-landing.vercel.app/login). Use your **personal six-digit terminal PIN** at an assigned [POS terminal](https://sentry-pos-terminal.onrender.com/).

## Find a task

- [Start using your manager account](#start-using-your-manager-account)
- [Sign in and navigate the portal](#sign-in-and-navigate-the-portal)
- [Review sales and reports](#review-sales-and-reports)
- [Manage branch stock](#manage-branch-stock)
- [Check products, terminals, activity and alerts](#check-products-terminals-activity-and-alerts)
- [Use the POS and approve cashier actions](#use-the-pos-and-approve-cashier-actions)
- [Recover access or change credentials](#recover-access-or-change-credentials)
- [Common problems](#common-problems)

## Start using your manager account

**Current service limitation:** automatic emails are turned off in the current deployment. New manager setup and manager credential resets depend on emailed temporary PINs, which are not shown to the owner. The screen may say a PIN was emailed even though no email is delivered. Ask your business owner to arrange restored email delivery with Sentry support before starting setup or resetting a working account. A fresh PIN must then be issued. An already activated manager can continue to sign in with existing credentials.

When email delivery is available:

1. Ask your owner to add you as a **Manager**, using your correct email address and at least one assigned branch. The owner’s staff list initially shows **pending**.
2. Open the setup link in your email, or the [manager setup page](https://sentry-pos-landing.vercel.app/login/staff).
3. Enter the same email address your owner used and the emailed **Temporary PIN**.
4. Enter a **New portal password** of at least eight characters, then enter it again in **Confirm password**.
5. Choose a **New terminal PIN** of six digits. It must differ from the temporary PIN. Enter it again in **Confirm terminal PIN**.
6. Select **Set up access and sign in**. Successful setup activates your account and opens the manager dashboard.
7. At an assigned, paired terminal, choose your name and enter your new terminal PIN. Follow the [POS terminal guide](pos-terminal.md) to open your own shift and start selling.

Temporary PINs expire after 15 minutes, work once, and stop working after five incorrect attempts. If yours is expired, used or replaced, ask the owner for a fresh setup email. Use the newest PIN.

## Sign in and navigate the portal

1. Open [portal sign-in](https://sentry-pos-landing.vercel.app/login).
2. Enter your email address and portal password, then select **Sign in**.
3. Check the business name and your manager identity. The dashboard covers your assigned branches.
4. Choose a section from the navigation. On a small screen, the navigation appears above the main content.
5. Use **Sign out** when you finish on a shared device.

| Section | What you can do |
| --- | --- |
| **Dashboard** | See today’s sales and transaction count, and open stock management for an assigned branch. |
| **Analytics** | Review Overview, Sales, Products, Inventory and Tax reports; download available CSV files. |
| **Stock** | View quantities; receive, adjust and transfer stock; save and post physical counts; review transfers and expiry batches. |
| **Products** | Check product or variant names, SKUs, selling prices and active/inactive status. |
| **Terminals** | Check assigned terminals’ status and last seen time; remotely unpair a device. |
| **Activity** | Review recorded operational actions in assigned branches, with pages of results. |
| **Alerts** | Read unresolved low-stock alerts for assigned branches. |

Your owner controls branch assignments. Selecting **All assigned branches** in a report combines only the branches you are allowed to see. You cannot select another business, inspect unassigned branches, edit the catalog or prices, change business/account settings, manage staff, or view cost, inventory value, profit or margin figures. The **Profit** and **Leaks** report tabs are unavailable to managers.

## Review sales and reports

### Choose the branches and reporting dates

1. Select **Analytics**.
2. Keep the displayed business. Your manager account cannot change it.
3. Under **Branch**, choose one assigned branch or **All assigned branches**.
4. Choose a **Range**, or set **From** and **To** dates.
5. Select a report tab. Branch and date selections carry across the tabs.

Dates use the business’s configured business day. A business day may begin at a time other than midnight. Activity times are displayed in Manila time.

### Read each report

| Report | What to review | Available actions |
| --- | --- | --- |
| **Overview** | Gross sales, discounts, net sales, transactions, average basket, service charge, and void/refund counts; comparisons with the previous period. | Change the branch/date range; select **Download CSV**. |
| **Sales** | Daily sales calendar, net sales trend, sales by hour and weekday, payment method, order type and branch. | Select a calendar day to inspect it; choose **Day**, **Week** or **Month** for the trend; download trend, patterns, breakdowns or daily sales CSV. |
| **Products** | Top sellers, category totals, slow movers and active products with no sales in the selected period. | Choose **By units** or **By revenue**; open a product to see its units and revenue over time; return with **← Products**; download CSV. |
| **Inventory** | Current stock on hand, estimated days of stock, units lost by adjustment reason, and the stock movement ledger. | Filter the ledger by **Movement type** and **Product**, then select **Apply filters**; move between result pages; download movements, shrinkage or stock-on-hand CSV. |
| **Tax** | Recorded VATable sales, VAT, VAT-exempt sales, SC/PWD discounts and service charge. | Change the branch/date range; select **Download CSV**. |

The portal’s **Products** menu is a catalog list. The **Products** tab inside Analytics is a sales performance report.

Miscellaneous/open-price sale lines are excluded from product rankings, so product revenue can differ from total net sales. Inventory reports show current on-hand quantities; their movement and loss sections use the chosen reporting period. A dash in days of stock means a usable estimate is unavailable, such as when there were no sales in the selected period.

### Download a report

1. Open the report and confirm the branch and date range.
2. Select the report’s **Download CSV** link. Sales and Inventory offer separate downloads for their different views.
3. Open the downloaded file in your spreadsheet application. Manager downloads carry the same branch and financial-information restrictions as the screen.

**Movement export limit:** **Download movements CSV** includes the first 50 filtered movements, even when you are on a later ledger page. Narrow the dates/filters to keep the result within 50 rows; ask the owner for an account export if a broader data copy is needed.
4. If the session has ended, sign in again and repeat the download from the report.

## Manage branch stock

Select **Stock**, then select the branch name at the top. Check the **Stock — [branch]** heading before changing quantities. Only stock-tracked products and their variants appear in the item choices. Ask your owner to configure a missing item or variant.

Quantities support up to three decimal places. Choose the exact variant when an item has variants.

### Receive a delivery

1. In **Receive stock**, choose the product or variant.
2. Enter **Quantity received**: the amount being added to existing stock.
3. Enter **Expiry date** if the product tracks expiry. An expiry-tracked product requires this date even though the field is labelled optional for other products.
4. Select **Receive stock**.
5. Wait for **Stock received.** and check the updated level. Repeat for another item as needed.

Managers cannot enter or change unit costs. Give cost information to the owner.

### Correct a stock level

1. Physically check the item in the selected branch.
2. In **Adjust stock**, choose the product or variant.
3. Enter **New count**: the corrected total quantity. For example, if the screen says 10 but you count 8, enter **8**.
4. Choose **Damage**, **Expired**, **Theft or loss**, **Count correction** or **Other** as the reason. Add an optional note explaining the change.
5. Select **Record adjustment**.
6. Wait for **Adjustment recorded.** and check the new level. Review the movement ledger in Analytics → Inventory when you need the recorded change.

### Transfer stock to another branch

1. Select the source branch in **Stock**. You must be assigned to this source branch.
2. In **Transfer stock**, choose a different **Destination branch** of the same business.
3. Enter the quantity to move beside each item. Leave other items blank. Add **Notes** if useful.
4. Select **Transfer stock**.
5. Wait for **Stock transferred.** Both branches update together. Check the **Transfers** table for the time, source, destination and items.
6. Use **Start another transfer** when you need to record a separate transfer.

The destination list can include branches you are not assigned to. Choosing one allows the transfer, but does not let you browse that branch’s inventory, sales or other data. A transfer requires enough stock at the source.

### Save and post a physical count

1. In **New physical count**, enter the actual quantity for every item you counted. Enter **0** for an item you counted and found none of. Leave an item blank if you did not count it.
2. Add **Notes**, then select **Save draft count**. Saving a draft does not change stock.
3. Find the **Draft** in **Count history**. Review the saved quantities. Correct them and select **Save draft count** if needed; wait for **Draft updated.**
4. Check **I have reviewed this saved draft** only after reviewing it. Posting replaces current quantities for the counted items and cannot be undone through the count form.
5. Select **Post saved count**.
6. Check that the entry is **Posted** and review its **Counted** quantities and **Variance**.

### Review expiry batches

1. Select the branch in **Stock**.
2. Read **Expiry batches** for the item, remaining quantity, expiry date and days left.
3. Follow your business’s stock handling process for items approaching or past expiry.
4. If stock is discarded, record the resulting quantity in **Adjust stock** with **Expired** as the reason.

### Handle an uncertain stock submission

If a transfer or draft-count form shows **Retry original operation**, keep its original values and use that button after connectivity returns. The form freezes the submitted details for the retry. Check history before starting a separate operation if you have reloaded or left the page.

For a receive or adjustment whose result is unclear, check the stock level and movement ledger before entering it again. Escalate to the owner with the branch, item, quantity, approximate time and displayed error reference.

## Check products, terminals, activity and alerts

### Check a product or price

1. Select **Products** in the portal menu.
2. Locate the product or variant and check its SKU, selling price and status.
3. Send any required name, category, price or availability change to your owner. This page is read-only.

### Check or remotely unpair a terminal

1. Select **Terminals**.
2. Check the device’s name/code, branch, **Last seen** and **Paired** status.
3. If the device needs to be disconnected, select **Unpair** on the correct row.
4. Read the confirmation, type the displayed **Terminal code**, then select **Unpair terminal**. Select **Cancel** to leave it paired.
5. The device loses access immediately. Arrange for the owner to pair it again in person before staff can use it.

Managers can unpair assigned devices from the portal. Pairing a new device, or using **Unpair…** in the terminal’s Settings screen, requires owner sign-in.

### Review recorded activity

1. Select **Activity** in the portal.
2. Review **When**, **Actor**, **Action** and **Entity**.
3. Use the page controls to review older results.
4. Give the owner the relevant time and action when investigating a discrepancy. This page displays recorded actions; it does not undo them.

On the POS, **Activity** shows sales and drawers for the paired branch, with the latest 100 of each. Drawer variance is shown after closing. Use **Refresh** to reload this view.

### Respond to a low-stock alert

1. Select **Alerts**.
2. Read the item, branch, remaining quantity and threshold in the alert.
3. Check that branch’s stock and arrange a delivery, transfer or count correction as appropriate.
4. If thresholds or stock tracking need changing, contact the owner. The manager alert page has no manual dismiss or threshold-edit control.

## Use the POS and approve cashier actions

### Unlock and lock your terminal

1. Open the [POS terminal](https://sentry-pos-terminal.onrender.com/) on an assigned, paired device.
2. At **Unlock this terminal**, check the branch, choose your name, enter **Your PIN**, and select **Unlock terminal**.
3. If no shift is open, follow the [shift-opening procedure](pos-terminal.md). If your own drawer is open, the terminal resumes it. An unresolved payment opens for resolution before further selling.
4. Select **Lock** when stepping away. Unlock again with your own PIN when you return.

Locking keeps the cart, unresolved payment and open drawer intact. Reloading requires your PIN again. The terminal also locks after five minutes without user input and requires a new unlock when the operator session reaches 12 hours.

An open drawer belongs to the person who opened it. You cannot sign in over another active operator’s drawer, even as a manager. The original operator must close the shift before another person opens a new one. See [shift handover and emergency closing](pos-terminal.md).

### Approve a cashier’s sensitive action

Cashiers need an assigned manager or owner to approve a void, refund or terminal stock adjustment.

1. Review the cashier’s proposed action, item/sale and reason in person.
2. In **Manager or owner approval**, select your name under **Approver**.
3. Enter your own six-digit **Approver PIN** yourself.
4. Have the cashier complete that action using its confirmation button.
5. Verify the result. Approval applies to that action and leaves the drawer with the cashier.

You must have active access to the terminal’s branch. Another cashier cannot approve. A pending manager who has not completed setup cannot approve.

### Know your POS permissions

| Task | Manager | Cashier |
| --- | --- | --- |
| Sell, hold/resume a cart, apply configured discounts and record eligible misc items | Allowed | Allowed |
| Enter a free-form discount amount or percentage | Unavailable | Unavailable |
| Open/close own shift, record cash movements, print/reprint receipts | Allowed | Allowed |
| Void an eligible sale | Allowed; normal sale/shift rules still apply | Manager/owner approval required |
| Refund an eligible sale | Re-enter your own PIN | Manager/owner approval required |
| Adjust stock at the terminal | Allowed | Manager/owner approval required |
| POS activity | Branch sales and drawers | Own sales and drawers in this branch |
| Portal access | Assigned business/branches, within manager limits | Unavailable |

Follow the [POS terminal guide](pos-terminal.md) for selling, payments, receipts, history, voids, refunds, stock and shift procedures. Business settings may further control which sale options are available.

## Recover access or change credentials

### Ask the owner to reset your terminal PIN

1. Ask the owner to use **Reset terminal PIN** on your staff record. Complete your own open shift first when possible.
2. Your staff access becomes **pending**, and existing sessions end.
3. When email delivery is available, use the fresh emailed temporary PIN at an assigned terminal: select your name, enter **Temporary PIN**, enter a different **New terminal PIN** twice, then select **Set PIN and unlock**.
4. Sign in to the portal again with your existing portal password after the reset is complete.

If your manager setup was incomplete, the owner’s reset may require the full manager setup page with both a new password and terminal PIN. Follow the newest email’s instructions.

### Ask the owner to reset your portal password

1. Ask the owner to use **Reset portal password** on your staff record.
2. Your staff access becomes **pending**, and existing sessions end.
3. When email delivery is available, open the reset email’s link to [Change your portal password](https://sentry-pos-landing.vercel.app/login/staff?mode=password).
4. Enter your email, fresh temporary PIN, new password of at least eight characters and its confirmation.
5. Select **Change password and sign in**. The password-only reset keeps your existing terminal PIN.

### Use Forgot password for an already active manager account

When email delivery is available, an already active manager can also select **Forgot password** on the sign-in screen, request the link for their account email, open it within one hour, and save a new password. Sign in again afterward. This changes the portal password; it does not activate a pending/deactivated staff account or replace a terminal PIN.

While emails are disabled, both emailed recovery routes require escalation through your owner. Repeated requests will not produce a usable email or reveal the PIN to the owner.

### Understand changes made by your owner

| Staff status/change | What it means for you |
| --- | --- |
| **Pending** | First setup or a credential reset needs completion. Normal staff access is paused. |
| **Active** | Setup is complete; you can use your assigned access. |
| **Deactivated** | Access is removed. Ask the owner if reactivation is appropriate. |
| Branch or email changed | Existing sessions end. Sign in/unlock again; the owner controls your available branches. |
| Role changed | Both credentials are cleared. Complete fresh setup for the new role. |
| Reactivated | Existing complete credentials can be used again. If credentials are incomplete, fresh setup is required. |

## Common problems

| What you see | What to do |
| --- | --- |
| No setup or reset email | Check the current email limitation above. Ask the owner to arrange restored delivery and then issue a fresh PIN. |
| Temporary PIN rejected | Check your email/name and use the newest PIN. It may be expired, already used, replaced or exhausted after five incorrect attempts. Ask for a fresh one. |
| Sign-in or personal PIN locked | Four failed attempts trigger a five-minute lock. Wait for the displayed retry period, then enter the correct credential. Ask the owner for a reset if you do not know it. |
| Your name is missing from the terminal | Check the terminal’s branch. Ask the owner to check your role, assignment and active/pending status. New manager setup must be completed in the portal first. |
| Another person’s drawer is open | The original operator must resume and close it. Escalate if that person’s access has been removed; follow the terminal guide’s emergency-close procedure. |
| Access ended after an owner change | Sign in/unlock again. Ask the owner to confirm the current role, branch assignments and status if access remains denied. |
| A branch or report is unavailable | Confirm that it is assigned to you. Profit, costs, settings and staff management require the owner. |
| An item is missing from stock forms | Ask the owner to check product/variant setup and stock tracking. |
| Transfer says insufficient source stock | Check the source branch and quantity; receive or correct stock only after verifying what is physically available. |
| Count was posted incorrectly | Contact the owner with the count time, items and quantities. Posted counts have no undo button; any correction must be recorded as a new operation. |
| API or connection error | Check connectivity. Preserve an uncertain transfer/count for **Retry original operation**. Give the owner the displayed error reference if the issue continues. |

For escalation, provide the business, branch, terminal code if relevant, action, approximate time and displayed error/reference. Do not send passwords or PINs.
