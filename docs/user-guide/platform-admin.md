# Platform administrator guide

[Guide home](README.md) · [Accounts and access](accounts-and-access.md) · [Complete workflows](workflows.md)

**Your job:** give owners access, manage their business limits, control account availability and inspect tenant records. Owners manage their own store data.

## Quick start

1. Complete platform-admin sign-in and authenticator setup in [Accounts and access](accounts-and-access.md).
2. Open [Platform panel](https://sentry-pos-landing.vercel.app/admin).
3. Choose **Owners** to see accounts or **Metrics** to see platform counts.
4. Use **Add owner** to provision an owner.
5. Have the owner complete invitation activation before expecting them to create businesses.

**Current deployment:** owner invitation email is disabled. Creating an owner record will not deliver usable activation access. Existing activated owners remain usable.

## What the panel contains

| Screen | Purpose |
| --- | --- |
| **Owners** | Name, email, status, allowed business count and creation date for each owner. |
| **Owner detail** | Edit owner name/limit, suspend or reinstate, and open the owner's businesses. |
| **Business overview** | Read branches and business activity. |
| **Business data** | Inspect catalog, sales, payments, shifts, stock, counts and terminals. |
| **Metrics** | Platform totals and owner access-status counts. |

## Create an owner

**Where:** **Owners → Add owner**.

1. Enter the business owner's name and email.
2. Choose the business limit, from **1 to 1000**.
3. Submit the form.
4. Review the resulting owner detail page.
5. When mail is configured, the owner uses the invitation within seven days and sets their own password.

The full activation procedure and disabled-email limits are in [Accounts and access](accounts-and-access.md). An email already used by an account cannot be created again. The current panel has no owner invite resend/copy-link control.

## Change an owner's name or business limit

**Where:** **Owners → owner name → Account**.

1. Edit **Owner name** and/or **Business limit**.
2. Choose **Save account**.
3. Check for **Account updated.** and the expected values.

The limit controls creation of real businesses; demo businesses do not count. Changing the limit does not delete existing businesses. Owner email and password are not editable through this form.

## Understand account status

| Status | Portal access | Paired terminals |
| --- | --- | --- |
| **Active** | Allowed after credentials/activation are complete | Allowed with valid device/operator access |
| **Suspended** | Blocked immediately | A terminal with an already open shift can continue within the 24-hour grace period from suspension |
| **Hard suspended** | Blocked immediately | Blocked immediately, including during a shift |
| **Closed** | Blocked | Blocked; this is account closure, not a reversible suspension |

The normal suspension grace is measured from the suspension time. It requires an open shift on that terminal and ends at 24 hours or when that shift closes. A terminal without an open shift has no grace. Archiving a business or branch also invalidates affected terminal access.

## Suspend an owner

**Where:** **Owner detail → Access**.

1. Check that you have selected the intended owner.
2. Choose **Suspend** for ordinary suspension or **Hard suspend** for immediate terminal shutdown.
3. Read the confirmation message describing the effect.
4. Choose **Confirm suspension** or **Confirm hard suspension**. Choose **Cancel** to leave the account as it is.
5. Verify the new status badge.

This affects the owner's businesses and staff access. Use the grace rules above when deciding how operating counters will be affected.

## Reinstate a suspended owner

1. Open the suspended owner's detail page.
2. Choose **Reinstate account**.
3. Verify status is **Active**.
4. Have the owner/staff sign in or unlock again if their previous attempt was denied.

Reinstatement restores allowed access immediately. Closed accounts cannot be reinstated through this operation. Account closure is described in [Owner](owner.md).

## Inspect a business

**Where:** **Owners → owner name → Businesses → business name**.

1. Review the **Branches** table for branch names, codes and addresses.
2. Review **Activity** to trace business events. Use the page controls to view additional entries.
3. Choose **Browse catalog, sales, payments and operations →** to open **Business data**.
4. Select the section you need.
5. Use pagination to inspect additional records.
6. Expand **View details** or **View … items** for a nested record, such as variants or count items.

| Inspector section | Typical records |
| --- | --- |
| **Catalog** | Product name, SKU, prices, cost, active/stock flags and variants |
| **Sales** | Receipt, branch, time, status and total |
| **Payments** | Sale, method and amount |
| **Shifts** | Branch/terminal, opening/closing times and cash amounts |
| **Stock** | Branch/product/variant quantities |
| **Counts** | Count status, time, notes and items |
| **Terminals** | Branch, name, code, last-seen time and pairing state |

**Money in this inspector is shown in integer centavos.** For example, `12500` means **₱125.00**. Other owner and POS screens generally format money in pesos.

Inspection is read-only. If a product, stock balance, receipt setting or branch needs changing, the business owner must do it through their own portal. Platform inspection does not impersonate a cashier or owner.

## Review platform metrics

**Where:** platform navigation → **Metrics**.

Review the totals for **Owners**, **Businesses**, **Branches**, **Terminals** and **Open shifts**, then the owner access counts: active, suspended, hard suspended and closed.

Use these as platform-wide counts. Business sales, profit and tax analysis are in the owner/manager reporting surfaces, not this metrics screen.

## Recover access and end a session

Use an unused recovery code if your authenticator is unavailable. Password recovery requires email delivery and still does not remove the two-factor requirement. See [Accounts and access](accounts-and-access.md).

Choose **Sign out** when finished. CMS content is managed through the separate [CMS guide](cms-editor.md), with a separate account.

[Next: owner guide →](owner.md)
