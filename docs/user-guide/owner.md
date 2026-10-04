# Owner guide

As an owner, you manage the businesses on your account, their products, branches, staff and terminals. You can see sales, profit and stock reports across your businesses. Each business has its own catalog and settings; each branch has its own stock and terminals.

This chapter starts after your account is activated. For invitations, signing in, account security and staff administration, use [Accounts and access](accounts-and-access.md). For selling, pairing a device and closing the drawer, use [POS terminal](pos-terminal.md). Staff can use the [Manager guide](manager.md) or [Cashier guide](cashier.md).

## Find a task

- [First setup checklist](#first-setup-checklist)
- [Find your way around](#find-your-way-around)
- [Create or change a business](#create-or-change-a-business)
- [Create or change branches](#create-or-change-branches)
- [Organize categories](#organize-categories)
- [Add and manage products](#add-and-manage-products)
- [Set up modifiers](#set-up-modifiers)
- [Set up discounts](#set-up-discounts)
- [Manage branch stock](#manage-branch-stock)
- [Read analytics](#read-analytics)
- [Change business settings and receipts](#change-business-settings-and-receipts)
- [Set your owner terminal PIN](#set-your-owner-terminal-pin)
- [Manage terminals](#manage-terminals)
- [Read notifications and activity](#read-notifications-and-activity)
- [Reset the demo business](#reset-the-demo-business)
- [Export account data or close your account](#export-account-data-or-close-your-account)
- [Common problems](#common-problems)

## First setup checklist

After signing in to the [owner portal](https://sentry-pos-landing.vercel.app/login):

1. Open **Businesses**, choose **Create business**, and enter its name, business type, VAT rate and business-day start time.
2. Add at least one **Branch**. Choose its permanent receipt code carefully.
3. Add **Categories**, then **Products**, including variants where needed.
4. For tracked products, receive the starting stock into each branch. Enter expiry dates for products with **Track expiry** enabled.
5. Add reusable **Modifiers** and **Discounts** where needed. Link modifier groups to the products that use them.
6. Review the business’s **Settings**: charges, receipts, business-day cutoff, miscellaneous items and drawer closing.
7. In account **Settings**, set your six-digit **Owner terminal PIN**.
8. Set up **Staff** using [Accounts and access](accounts-and-access.md), then pair devices using [POS terminal](pos-terminal.md).
9. Make a training sale in the demo business and check its receipt and analytics. Choose the demo business explicitly in analytics to see its reports.

**Result:** Your business is ready for a cashier to open a shift and sell. The demo is kept separate from the default reports for your real businesses.

## Find your way around

The main portal contains **Dashboard**, **Businesses**, **Analytics**, **Notifications** and account **Settings**. The Dashboard page is headed **Today**. Opening a business gives you its own menu:

| Menu | What it is for |
| --- | --- |
| Overview | Product and branch counts, with links to manage them. |
| Products | Prices, costs, variants, barcodes, availability and product images. |
| Categories | The groups and tab order shown on the terminal. |
| Modifiers | Reusable choices such as milk, toppings or extras. |
| Discounts | Named percentage or fixed-amount discounts. |
| Branches | Branch details and each branch’s stock. |
| Terminals | Paired tills, last-seen times and unpairing. |
| Activity | A record of changes and terminal actions in this business. |
| Staff | Managers and cashiers; see [Accounts and access](accounts-and-access.md). |
| Settings | This business’s charges, day, receipt and stock settings. |
| Notifications | Account alerts. |
| ← All businesses | Return to the account dashboard. |

When you have two or more businesses, the **Business** selector lets you change business while staying in the same main section. Always check the business name before saving.

### Check today’s dashboard

**Before you start:** A real business needs a branch and sales before its figures become useful.

1. Open **Dashboard**, or choose **← All businesses** from a business menu.
2. Read each business’s **Sales**, **Gross profit** and **Transactions** alongside the same day last week. The small chart shows the last seven days; branch rows show sales and sale counts.
3. Select a low-stock badge to open Inventory analytics, or an open-shift badge to jump to **Right now**.
4. In **Right now**, check open shifts, paired terminals, last-seen times and unread notifications. Choose **Open analytics** for a fuller report.

**Result:** You have an account-wide view of trading and items needing attention. Demo trading is excluded. Dashboard shift badges flag shifts open over 24 hours; notification alerts can also flag a shift left open across the business-day cutoff.

## Create or change a business

### Create a business

**Before you start:** Have the business name, type, VAT rate and reporting cutoff ready. Your account has a business limit set by the platform administrator; the demo does not use that limit.

1. Open **Businesses → Create business**.
2. Enter **Business name** and choose **Retail**, **Food and drink** or **Mixed**.
3. Enter **VAT rate (%)** as a percentage, for example `12` for 12%. The form accepts `0` to `99.99`.
4. Set **Business day starts at** in Philippine time. With `06:00`, a sale at 2 AM belongs to the previous business day.
5. Choose **Create business**.

**Result:** The new business uses Philippine pesos and opens the branch setup page. Add a branch before pairing a till. If the business limit is reached, contact your platform administrator.

### Edit a business

1. Open **Businesses** and select its name.
2. Open the business’s **Settings**.
3. Change the name, type or other settings described under [Business settings](#change-business-settings-and-receipts).
4. Choose **Save settings** and wait for **Settings saved**.

**Result:** The settings apply to this business, including its branches and terminals.

### Delete a business

**Before you start:** Check that you selected the correct business. Download any records you need using [account export](#download-an-account-export).

1. Open the business’s **Settings → Delete business**.
2. Type the business name in **Confirm business name**.
3. Choose **Delete business**.

**Warning:** This removes the business from your account and disables access to its terminals. There is no restore control in the owner portal. This action is separate from closing your whole account.

## Create or change branches

### Add a branch

**Before you start:** Create the business first. A branch is the location that owns stock and receives paired terminals.

1. Open the business’s **Branches** page.
2. Under **Add a branch**, enter **Branch name**, **Code** and **Address**.
3. Use a code of 2–6 uppercase letters or digits, for example `MKT`.
4. Choose **Add branch**.

**Result:** The branch appears in the list and can be selected when pairing a terminal. Its code becomes part of receipt numbers, for example `MKT-T1-000318`. The code cannot be changed through this form after creation.

### Edit or delete a branch

1. Open **Branches** and find the branch row.
2. Change the name or address and choose **Save**. The code stays read-only.
3. To remove the branch, choose **Delete**, check the displayed branch name, then choose **Confirm delete**. Choose **Cancel** to keep it.

**Result:** Saved details appear in the row. A deleted branch is removed from the normal branch list; there is no owner-portal restore control. Check its stock and terminals before deleting it.

Use the **Stock** link on a branch row for deliveries and adjustments.

## Organize categories

Every product needs a category. Categories group products on the terminal; **Order** controls the category tab order.

### Add, edit or delete a category

1. Open the business’s **Categories**.
2. Under **Add a category**, enter a **Name** and a whole-number **Order** of zero or higher. Use smaller numbers for categories you want earlier.
3. Choose **Add category**.
4. To rename or reorder an existing category, edit its row and choose **Save**.
5. To remove one, choose **Delete**, check its name and choose **Confirm delete**.

**Result:** The saved category is available in product forms and controls terminal grouping. Before deleting a category, move any products you want to keep selling into another category. The portal has no category restore control.

## Add and manage products

### Find products

1. Open the business’s **Products**.
2. Use the search and category filter. Search matches product and variant names, SKUs and barcodes.
3. Select a product name to edit it. The list shows its category, base price, tracked-stock status, variant count and **Inactive** status where applicable.

**Result:** You can locate an item without switching between branches; the catalog belongs to the whole business.

### Add a product

**Before you start:** Add its category. Decide whether it sells by each item or by weight, and whether you need stock or expiry tracking.

1. Choose **Products → Add product**.
2. Fill in the details:

   | Field | What to enter |
   | --- | --- |
   | Name | The name staff will recognize at the counter. |
   | Category | The terminal group for this item. |
   | Sold by | **Each** or **Weight**. |
   | Price | The selling price in pesos, including VAT. |
   | Cost | Optional recorded cost in pesos, used for profit reports. |
   | SKU | Optional internal item code. |
   | Barcode | Optional code scanned at the counter. |

3. Keep SKUs and barcodes unique within this business, including its variants.
4. Set the behavior:

   | Setting | Effect |
   | --- | --- |
   | Active | Makes the product available on the terminal. Turning it off hides it while keeping its report history. |
   | Track stock | Counts quantity separately for each branch and prevents selling more than the available stock. |
   | Low-stock alert threshold | Flags stock at or below this quantity. Applies to each variant. Leave blank to disable monitoring; enable Track stock to use alerts. |
   | Track expiry | Records dated stock batches. An expiry date is required when receiving this product. |

5. Add variants if needed using the next procedure.
6. Choose **Create product**.

**Result:** The product’s edit page opens with a saved message. Paired terminals pick up catalog changes on their next sync. For tracked items, [receive stock](#receive-a-delivery) in each selling branch before use.

### Add or edit variants

Use variants for sizes or flavors with their own prices, such as **Small latte ₱100** and **Large latte ₱130**. Modifier prices work differently: they add to or subtract from an item’s price.

1. Open the product form and find **Variants**.
2. Choose **Add variant** and enter **Variant**, **Variant price**, and optional **Variant SKU** and **Variant barcode**.
3. Edit existing rows as needed. Choose **Remove** only for a variant you want removed.
4. Review the whole visible list, then choose **Save product** or **Create product**.

**Result:** The saved list becomes the product’s available variants. With no variants, the product sells at its own price. Stock is held separately for each variant.

The variant form does not have a cost field. Owners can record a variant’s unit cost while receiving stock. The current product editor clears stored variant costs when it saves the variants; check stock value and profit coverage after editing a product with variants. Historical sales retain the costs recorded at the time of sale.

### Edit, hide or remove a product

1. Open its name from **Products**.
2. Change the details, behavior or variant rows, then choose **Save product**.
3. To hide an item temporarily, clear **Active** and save. Switch **Active** back on to offer it again.
4. To remove it, return to the product list, choose **Delete**, check the name and choose **Confirm delete**.

**Result:** An item that has been sold becomes inactive when deleted so its sales history remains. An unsold item is removed from the normal catalog. Use **Active** when you want a reversible change to availability.

### Upload a product image

**Before you start:** Save the product first. Image storage must be enabled by the platform administrator.

1. Open the product’s edit page and find **Product image**.
2. Choose an **Image file**: JPEG, PNG or WebP, no larger than 4 MB.
3. Choose **Upload image** and wait for **Image updated**.
4. To clear it, choose **Remove image**.

**Result:** The product uses the uploaded image. If the page says uploads are not configured, ask your platform administrator to enable storage.

## Set up modifiers

A modifier group is a reusable set of choices. For example, **Milk** could contain **Regular ₱0** and **Oat +₱15**; **Toppings** could offer several extras.

### Create or edit a modifier group

1. Open the business’s **Modifiers**.
2. Enter **Group name**, **Min** and **Max**. Use whole numbers; Max must be at least Min.
3. Use **Min 0, Max 1** for one optional choice, or **Min 1, Max 1** to require exactly one choice.
4. Choose **Add option** for each option row. Enter each **Option** name and **Price change** in pesos. A positive value adds to the price; a negative value reduces it.
5. Choose **Create group**. To change a group later, edit its existing rows and choose **Save group** for the complete group.
6. To remove an option, choose its **Remove** button and save. To delete a group, use the group’s **Delete** confirmation.

**Result:** The group is ready to link to products. Creating a group alone does not add it to a product.

### Link groups to a product

**Before you start:** Create the product and modifier groups.

1. Open **Products**, then the product name.
2. Scroll to **Modifiers**.
3. Tick **every group the product should have**, including groups you linked previously.
4. Choose **Save modifiers** in the Modifiers section, separately from **Save product**.

**Result:** The selected groups become the product’s complete modifier list. The current screen opens with all boxes empty even when groups were saved before. Saving replaces the entire list: selecting only a new group removes previous links, and saving with nothing selected removes all groups.

## Set up discounts

Named discounts are available at the counter according to their scope. Senior citizen/PWD treatment is a separate checkout flow described in [POS terminal](pos-terminal.md).

### Add or edit a discount

1. Open the business’s **Discounts**.
2. Enter a **Name**, such as “Staff discount”.
3. Choose **Percentage** or **Fixed amount**. Enter a whole percentage from `1` to `100`, or a positive peso amount such as `50.00`.
4. Set **Applies to**: **A line**, **Whole order**, or **Either**.
5. Keep **Active** selected to make the discount available, then choose **Add discount**.
6. To change one, edit its row and choose **Save**. Clear **Active** to stop offering it, or use **Delete → Confirm delete** to remove it.

**Result:** Active discounts are offered on eligible line or order discount controls after the terminal updates its catalog.

## Manage branch stock

Open **Business → Branches → Stock** beside the branch. Only products with **Track stock** enabled are available for stock operations. Choose the exact variant where a product has variants. Quantities can use up to three decimal places.

### Receive a delivery

**Before you start:** Add the product, enable stock tracking and select the receiving branch.

1. Under **Receive stock**, choose the product or variant.
2. Enter **Quantity received** above zero. This is the quantity to add, for example `20`, not the new shelf total.
3. Optionally enter **Unit cost** in pesos. Giving a cost replaces the recorded cost for that product or variant; it is not a weighted average of deliveries and is shared across the business’s branches.
4. Enter an **Expiry date** if the product tracks expiry. Although the form’s hint says optional, the system requires it for expiry-tracked products.
5. Choose **Receive stock** and wait for **Stock received**.

**Result:** The branch’s level increases and a receive entry is recorded. Dated stock creates an expiry batch. Receive separately for each item or variant.

### Correct a stock total

**Before you start:** Count the actual quantity remaining at this branch.

1. Under **Adjust stock**, choose the product or variant.
2. Enter **New count**, the corrected total on the shelf. If the system says 10 and two are damaged, enter `8`, not `-2`.
3. Choose **Damage**, **Expired**, **Theft or loss**, **Count correction** or **Other**, and add a note if useful.
4. Choose **Record adjustment** and wait for **Adjustment recorded**.

**Result:** Stock becomes the new count and the difference is recorded in the movement ledger. The new total must be zero or greater. Negative adjustments also appear in shrinkage reports.

### Transfer stock between branches

**Before you start:** Have two branches in the same business and enough stock in the source branch.

1. From the source branch’s Stock page, choose **Transfers, physical counts and expiry →**.
2. In **Transfer to another branch**, choose **Destination branch**.
3. Enter positive quantities for items to move. Leave all other items blank. Add **Notes** if needed.
4. Choose **Transfer stock** and wait for **Stock transferred**.
5. Review **Transfer history** and the levels at both branches. Choose **Start another transfer** for a separate transfer.

**Result:** Both branches update together: the source loses the quantity, the destination gains it, and both receive movement entries. Expiry information travels with dated stock. Transfers cannot cross businesses or move more stock than the source has.

If the form reports an uncertain result, keep the original values and use **Retry original operation**. The locked fields preserve the original transfer. Check the history before starting a separate operation.

### Save and post a physical count

**Before you start:** Count the actual items at the branch. A saved draft does not change stock.

1. Open **Transfers, physical counts and expiry → New physical count**.
2. Enter each item’s physical quantity. Use `0` for an item you counted and found empty; leave an item blank if you did not count it.
3. Add **Notes** and choose **Save draft count**.
4. Find the draft under **Count history**, review it, and correct its quantities if needed. Choose **Save draft count** again to save edits.
5. Check **I have reviewed this saved draft**, then choose **Post saved count**. Posting uses the saved draft; save any edits first.

**Warning:** Posting replaces current stock for the included items with the physical quantities and cannot be undone. Review the saved quantities before posting, especially if sales or deliveries happened while you were counting.

**Result:** The count becomes **Posted**. Its table shows the system quantity at posting, the counted quantity and variance. Each included item gets a count-correction movement; blank, uncounted items stay unchanged.

### Check expiry and stock history

1. Open **Transfers, physical counts and expiry → Expiry batches**.
2. Read the item, expiry date, remaining quantity and status: **Expired**, **Expires today**, or days left.
3. Change **Expiry warning (days)** in business Settings to control how far ahead batches appear.
4. To record spoiled or discarded items, use **Adjust stock** with reason **Expiry** and the new shelf total.
5. For all stock changes, open **Analytics → Inventory**, select this business and branch, then review the **Movement ledger**.

**Result:** You can see remaining dated stock and trace changes. The expiry list shows expired stock and batches due within the warning window. Remaining quantities are estimated by consuming the earliest-expiring stock first; expiry dates do not automatically remove items from stock.

## Read analytics

### Choose the business, branch and dates

1. Open **Analytics**, or choose **Open analytics** on the dashboard.
2. Select **All businesses** for your real-business totals, or select one business. To inspect training sales, choose the demo explicitly.
3. When a business is selected, choose **All branches** or one **Branch**.
4. Choose **Today**, **Yesterday**, **Last 7 days**, **Last 30 days** or **This month**, or enter **From** and **To** dates. Both dates are included; the maximum range is 366 days.
5. Select **Overview**, **Sales**, **Products**, **Profit**, **Leaks**, **Inventory** or **Tax**. Business, branch and dates carry across tabs.

**Result:** Reports show only the chosen scope. The seven- and thirty-day presets include today; This month runs from the first of the month through today. A selected business’s day-start setting determines its reporting boundaries in Manila time. In all-business reports, each business uses its own cutoff.

Changing businesses clears the branch selection. An empty report usually means no matching sales or movements; check the scope and dates before changing records.

### Overview: understand the figures

After choosing your scope, open **Overview**. Cards compare the selected period with the immediately preceding period of the same length.

| Figure | Meaning |
| --- | --- |
| Gross sales | Item subtotal for sales currently marked completed, before discounts. |
| Discounts given | Discounts on completed sales, including SC/PWD discounts. |
| Net sales | Gross sales minus discounts. Service charge is shown separately. |
| Gross profit | Sales revenue less recorded item costs, covering only items with known costs. |
| Margin | Gross profit as a percentage of the revenue with known costs. Its change is shown in percentage points. |
| Transactions | Number of completed sales. |
| Average basket | Net sales divided by completed transactions. |
| Service charge | Service charge on completed sales. |
| Voids / refunds | Counts of sales currently marked voided or refunded. |

**Result:** You can compare trading without confusing sales with profit. The note below the cards identifies sales covered by known costs and sales with unknown costs. A dash means unavailable, not zero. Voided and refunded sales are excluded from completed-sale totals; reports follow the sale’s original business-day timestamp.

### Sales: find busy days and trading patterns

1. Open **Sales** with your desired scope.
2. In **Which days feed us**, select a calendar day to narrow the report to that day and jump to the breakdowns.
3. In **Trend**, choose **Day**, **Week** or **Month**.
4. Compare net sales and gross profit over time, then **Hour of day**, **Day of week**, **Payment method**, **Order type** and **Branch**.

**Result:** You can see when sales happen and which branches, payment methods and order types contribute. Gross-profit points without recorded costs are omitted from the Sales profit chart.

### Products: compare top sellers and slow movers

1. Open **Products** and choose **By units** or **By revenue**.
2. Review **Top sellers**, **By category**, **Slow movers** and **Sold nothing at all**.
3. Select a product name in the sold-product tables to open its detail report.
4. Read **Revenue over time** and its period table: units, revenue, gross profit and margin. Choose **← Products** to return.

**Result:** You can compare products and inspect a product’s trend. Products with no sales are listed separately. Miscellaneous items are excluded from product figures and shown in Leaks, so product revenue can differ from net sales.

### Profit: compare known margins

1. Open **Profit**.
2. Review **Gross profit over time**, **By product** and **By category**.
3. Compare revenue, cost, gross profit and margin, then check the note showing how much revenue has a recorded cost.

**Result:** You can identify margin differences among costed products. Unknown costs are not assumed to be free. A chart can plot zero for a period with no known profit; use the displayed cost-coverage note and tables to distinguish that from an actual zero-profit result. There is currently no direct CSV download control on this tab.

### Leaks: review discounts, corrections and drawer differences

1. Open **Leaks**.
2. Review **Order-level discounts**, **SC/PWD discounts**, **Misc rings** and **Voids / refunds**.
3. Read **Discounts by name** for frequency and amount, then the void/refund reason tables.
4. Review **Drawer over / short** for closed shifts: expected cash, counted cash and variance.

**Result:** You can investigate discounts, open-price items and transaction corrections. Drawer variance is counted cash minus expected cash: positive means over; negative means short. A drawer row appears only after a shift closes.

### Inventory: review levels, loss and movements

1. Open **Inventory** and choose the business and branch you need.
2. Read **Stock on hand**: quantity, recorded unit cost, value and estimated **Days of stock**.
3. Review **Shrinkage by reason** for negative stock adjustments, their cost value and any units without recorded cost.
4. In **Movement ledger**, choose **Movement type** and, after selecting a business, **Product**. Choose **Apply filters**.
5. Read the change, reason and who performed the action; use pagination for older entries.

**Result:** You can trace receive, sale, void, refund, adjustment, transfer-in and transfer-out entries. Positive changes add stock; negative changes remove it. **Stock on hand is current stock**, not a snapshot of the selected end date. Dates determine movement/shrinkage records and the selling rate used for Days of stock.

Value is current quantity multiplied by recorded unit cost. Missing costs leave value unknown and are counted below the table. Days of stock is current quantity divided by average daily units sold in the selected range; a dash means the item had no sales in that range. A low badge means quantity is at or below its configured threshold.

If you reach a message asking you to narrow the scope, reduce the dates or select a branch/product. The movement viewer limits how far it can page through a large result.

### Tax: review the VAT summary

1. Open **Tax** and choose the reporting dates and scope.
2. Review each business’s tax rate, **VATable sales**, **VAT**, **VAT-exempt sales**, **SC/PWD discounts** and **Service charge**.
3. Use the totals row for amounts across the chosen businesses. It does not show a blended tax rate.
4. Choose **Download CSV** to share the summary with the person preparing your accounts.

**Result:** You have a VAT summary for matching completed sales. Changing business settings does not rewrite historical sale amounts.

### Download analytics CSV files

**Before you start:** Set the business, branch, dates and any report-specific filters first. CSV files can be opened in a spreadsheet application.

1. Open the tab for the report you want.
2. Check the displayed scope and filters.
3. Choose its download link and save the file.
4. Check the file’s report name, dates and contents before sharing it.

| Tab | Available download controls |
| --- | --- |
| Overview | Download CSV for overview figures. |
| Sales | Trend, patterns, breakdowns and daily sales CSVs. Trend follows the Day/Week/Month choice. |
| Products | Download CSV for top products and category figures, following By units/By revenue. |
| Leaks | Download CSV for discount, void/refund and drawer figures. |
| Inventory | Movements CSV, shrinkage CSV and stock-on-hand CSV. Movement type/product filters carry into movements export. |
| Tax | Download CSV for the VAT summary. |
| Profit and product detail | No direct download control is currently shown. |

**Current movement-export limit:** The portal’s **Download movements CSV** contains the first 50 matching movements, even if you are viewing a later page. Narrow the dates and filters to keep the result within 50 rows, or use [account export](#download-an-account-export) for a broader data copy. It is not a download of the entire paginated ledger.

Reports use pesos for monetary CSV amounts. Some downloads contain several labeled sections rather than one flat table. Movement CSV timestamps use an ISO date/time with a timezone; on-screen activity times are displayed in Manila time. Keep barcodes and SKUs as text when opening exported catalog data so leading zeroes are retained.

## Change business settings and receipts

**Before you start:** Open the correct business. These settings apply to its branches and terminals; account PIN and closure controls are in the main account Settings.

1. Open the business’s **Settings**.
2. Update the options you need:

   | Setting | What it changes |
   | --- | --- |
   | Blind drawer close | Hides expected cash and cash totals until the operator submits their count. Applies to every terminal in this business. |
   | Daily summary email | Saves whether to email the account address after this business day closes. Unavailable for demo businesses. |
   | Name / Type | The business name and Retail/Food and drink/Mixed classification. |
   | VAT rate (%) | VAT breakdown for VAT-inclusive prices. Enter `0`–`99.99`. |
   | Service charge (%) | The charge rate for the business. Enter `0`–`99.99`. |
   | Allow miscellaneous items | Allows cashiers to ring an ad-hoc item that is absent from the catalog. |
   | Day starts at | Reporting cutoff in 24-hour Manila time, such as `06:00`. Earlier sales count toward the previous business day. |
   | Expiry warning (days) | How far ahead remaining expiry batches are flagged; a whole number from `0` to `365`. |
   | Receipt Header / Footer | The business text shown on receipts. |

3. Choose **Save settings** and wait for **Settings saved**.
4. For branding, use **Receipt logo**, choose a JPEG, PNG or WebP up to 4 MB, then **Upload image**. Use **Remove image** to clear it.
5. Let the terminal update its settings and check a receipt using [POS terminal](pos-terminal.md).

**Result:** The saved business settings apply when terminals next load them. Receipt configuration uses your business’s branding.

**Current email availability:** Production email delivery is deliberately disabled. You can save the Daily summary email preference, but enabling it does not currently deliver an email. Use the dashboard and analytics to review daily trading. When delivery is enabled, the summary is intended for the account email after the business-day cutoff and includes branch trading, known-cost profit, uncosted revenue, charges, void/refund counts and closed-shift drawer variance.

Image controls show a storage-configuration message if uploads are unavailable; contact your platform administrator in that case.

## Set your owner terminal PIN

Your owner PIN unlocks your terminals and authorizes your actions. Enter it yourself when approving a cashier’s void, refund or stock adjustment. Staff use their own PINs.

1. Return to the account menu and open **Settings → Owner terminal PIN**.
2. Enter exactly six digits in **New refund PIN** and repeat them in **Confirm PIN**. The field still uses the older refund-PIN label.
3. Choose **Set refund PIN** and wait for the success message.

**Result:** Your personal terminal PIN is set or replaced across the account. It is not shown again. Four wrong attempts lock that person’s PIN for five minutes. Keep your PIN private; staff setup is covered in [Accounts and access](accounts-and-access.md).

## Manage terminals

### View or pair a terminal

1. Open the business’s **Terminals**.
2. Check each terminal’s name, code, branch, **Last seen** and **Paired / Not paired** status.
3. To connect a new device, follow [Pairing in POS terminal](pos-terminal.md). Pairing is performed in the terminal app, not by adding a row on this page.

**Result:** You can check which tills belong to the business. Last seen is the most recently recorded contact; it does not prove a device is currently connected.

### Unpair a device

**Before you start:** Identify the device by its terminal code and branch.

1. Choose **Unpair** on its row.
2. Read the displayed consequence and type the **Terminal code**.
3. Choose **Unpair terminal**, or choose **Cancel**.

**Warning:** The device stops working immediately and must be paired again in person. Do this only for the intended till.

**Result:** The row shows **Not paired**. Unpairing does not create a new shift or complete a drawer close.

## Read notifications and activity

### Follow up notifications

1. Open **Notifications**, or use the notification bell on the Dashboard page.
2. Choose **All** or **Unread** and check the unread count.
3. Read the alert and choose **View details →** to open the relevant stock, expiry, terminal or inventory view.
4. Use **Mark read** for an individual alert or **Mark all read** for all unread alerts. Use pagination for older alerts.

**Result:** You can follow up low stock, stock nearing expiry and shifts left open after a business day ends. A **Resolved** label indicates that the alert condition has cleared. Marking an alert read changes its unread status; it does not correct stock or close a shift. Demo businesses are excluded from the alert jobs.

### Review business activity

1. Open a business’s **Activity**.
2. Filter **Actor** by Anyone, Owner or Terminal; choose a **Branch** if useful.
3. To find a particular action, copy its action text from an entry into **Action**; leave blank for all actions.
4. Choose **Apply** and use pagination to review more entries.

**Result:** You can trace changes and terminal actions in this business. Times are Manila time. Entries can include actions on records that were later removed; the page is an activity record, not a control to reverse changes.

## Reset the demo business

**Before you start:** Select the business marked **demo**. A real business cannot use this reset.

1. Open its **Settings → Reset demo business**.
2. Type `RESET DEMO` exactly.
3. Choose **Reset demo**.

**Warning:** The old demo and its training changes are replaced with a fresh training business. Its terminals must be paired again. There is no undo control.

**Result:** The portal opens the fresh demo business. Your real businesses are unaffected.

## Export account data or close your account

### Download an account export

1. Open main account **Settings → Export data and close account**.
2. Choose **Download account export (ZIP)**.
3. Save the ZIP, open it and check the CSV files before relying on it.

**Result:** You have an account-wide data copy, separate from analytics date/branch filters. It includes account and user records, businesses and branches, catalog data, sales and payments, shifts, stock records, notifications and activity. Passwords and authentication tokens are not a part of the export. Keep the files somewhere you can still access if the account closes.

### Close your account

**Before you start:** Download and check a fresh account export in the same browser. The system requires an export from the last 24 hours before allowing closure.

1. Open main account **Settings → Export data and close account**.
2. Type `CLOSE MY ACCOUNT` exactly.
3. Choose **Close my account**.

**Warning:** Closure immediately ends account access and access for paired terminals. Account data is retained for 90 days before scheduled deletion. The portal provides no self-service reopen control.

**Result:** Your session ends and the Account closed page shows the scheduled deletion date. Keep the downloaded export. Downloading an export by itself does not close your account.

## Common problems

| What you see | What to do |
| --- | --- |
| Business limit reached | Ask your platform administrator about the account limit. The demo does not count toward it. |
| No products available for stock operations | Open the correct business and enable Track stock on the product. |
| Receiving an expiry-tracked product fails | Enter its expiry date as well as a positive quantity. |
| A tracked item cannot be sold | Check this branch’s stock for the exact variant; receive or correct stock as appropriate. |
| A barcode or SKU is already used | Check products and variants in the same business and assign a different code. |
| A product is missing from the terminal | Check Active, category and variant setup, then let the terminal update its catalog. |
| Modifier boxes are empty after reopening a product | Select all intended groups before saving; the current editor does not show prior selections. |
| Profit or stock value shows a dash | The relevant cost is unknown. Review product costs and variant receiving costs. |
| Analytics looks empty | Check business, branch and dates. Select the demo explicitly for training results. |
| Movement CSV has fewer rows than the ledger | It currently exports the first 50 matching rows. Narrow filters or use account ZIP export. |
| A transfer or draft-count submission has an uncertain result | Use Retry original operation with the preserved values, then review history. |
| An image upload is unavailable | The platform administrator must enable image storage. |
| Daily summary email does not arrive | Production delivery is currently disabled; review Dashboard and Analytics. |
| Account closure requests an export | Download a fresh ZIP in the same browser, check it, and retry within 24 hours. |

[Back to Accounts and access](accounts-and-access.md) · [Manager guide](manager.md) · [Cashier guide](cashier.md) · [POS terminal](pos-terminal.md)
