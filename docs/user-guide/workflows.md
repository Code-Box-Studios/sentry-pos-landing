# Complete workflows

[Guide home](README.md) · [Accounts and access](accounts-and-access.md)

These workflows connect the role guides. Follow each row in order; open the linked chapter for the detailed form instructions.

## Open a new store

**Goal:** an owner has a working branch, catalog, stock, staff and paired counter.

| Step | Who acts? | What to do | Ready when… |
| --- | --- | --- | --- |
| 1 | Platform admin | [Create the owner](accounts-and-access.md) with the right email and business limit. | Owner record exists and invitation is delivered. |
| 2 | Owner | [Accept invitation](accounts-and-access.md), set password and sign in. | Owner portal opens; demo business is available. |
| 3 | Owner | [Create business and branch](owner.md). | Business type, operating-day cutoff, branch code and address are correct. |
| 4 | Owner | [Prepare catalog](owner.md): categories, products, variants, modifiers and named discounts. | Active sellable items have the correct price and configuration. |
| 5 | Owner/assigned manager | [Receive opening stock](owner.md), including expiry where tracked. | The branch has usable quantities; variant stock is received against the right variant. |
| 6 | Owner | [Configure settings](owner.md): tax/receipt, cash close and owner terminal PIN. | Receipts and authorization rules match the intended operation. |
| 7 | Owner + staff | [Create staff and finish setup](accounts-and-access.md). | Staff are active and assigned to the intended branches. |
| 8 | Owner | [Pair each counter browser](pos-terminal.md) with the branch. | Correct terminal name/code appears and operators can unlock. |
| 9 | Operator | [Open shift and make a practice sale](pos-terminal.md). | Payment records once, receipt can be printed and stock changes as expected. |
| 10 | Operator + owner/manager | [Close shift](pos-terminal.md) and review [reports](owner.md). | Counted cash, variance and completed sale appear in the appropriate scope. |

In the current email-disabled deployment, new owner and new manager activation cannot finish through the usual workflow. Use the already active demo accounts to practice the later steps. Do not enter pretend sales into a live trading business.

## Practice with the demo business

1. Sign in using an already active demo account provided to you.
2. Owner: select **Kape Diaria (Demo)** in **Businesses**. Manager: use the assigned demo branches.
3. Pair a practice counter with the intended demo branch, such as **Marikit**.
4. Unlock using the account's permanent PIN; existing demo users do not need temporary setup.
5. Open a shift, sell sample items, hold/resume a cart and print/preview a receipt.
6. Close the shift with a counted cash amount.
7. Select the demo business explicitly in reports to inspect results.

Demo activity does not count in ordinary combined owner totals. An owner can reset the demo using the dedicated [demo reset procedure](owner.md); reset removes practice operations and unpairs demo terminals. Download anything you want to keep before resetting.

## Run a normal cashier day

| Stage | Cashier | Manager/owner |
| --- | --- | --- |
| Start | Check correct branch/terminal, unlock by name, count float and open a shift. | Check staff assignment and stock readiness. |
| During service | Build cart, choose items/options, apply allowed discounts and take payment. | Approve protected actions in person where required. |
| Customer waits | Hold the cart; resume it later on this terminal. | Help resolve unavailable stock/options if needed. |
| Cash movement | Record cash in/out with a reason rather than altering sales. | Review cash movements and unusual differences. |
| Step away | Lock; resume as the same operator. | Do not take over an eligible operator's open drawer. |
| End | Resolve pending payment, count cash, close shift and print/preview Z report. | Review variance, exceptions and sales. |
| Handover | Lock after the shift is closed. | Next operator unlocks and opens a separate shift. |

Detailed instructions: [Cashier](cashier.md), [Manager](manager.md), [POS terminal](pos-terminal.md).

## Correct a customer transaction

1. Before payment, edit or cancel the cart in the Sale screen.
2. After payment, open terminal **History** and find the receipt.
3. Check whether the eligible correction is a **Void** or **Refund**. They have different shift/time requirements; use the [POS procedure](pos-terminal.md).
4. Enter the reason and obtain the required manager/owner PIN approval.
5. Submit once and check the resulting sale status.
6. Return money through the original cash/card/wallet process your store uses. Recording a POS refund is not an automatic payment-provider reversal.
7. Review stock restoration and report totals if relevant.

The current app refunds whole sales rather than selected lines or partial amounts. If a payment result is uncertain because the network dropped, resolve the saved payment attempt before starting a new sale for the same order.

## Receive, transfer and count stock

**Receive delivery:** owner/assigned manager opens portal stock, selects branch/product/variant, enters quantity and expiry if required, and submits. Owner can record unit cost; managers cannot manage costs.

**Move stock:** owner/authorized manager selects source and destination branches in the same business and posts a [transfer](owner.md). Managers need access to the source; the destination list can include other branches of that business without granting access to their records. Check the transfer history and have an authorized person confirm the destination balance.

**Count shelves:** create a [draft stock count](owner.md), enter counted quantities for each row, review and post. Posting adjusts stock by the recorded difference. It is a one-time posting; edits belong in the draft before posting.

Terminal **Stock → Adjust** records a correction with a reason. Delivery receiving, transfers, stock counts and the expiry overview live in the portal.

## Review daily performance

1. Owner or manager opens the dashboard.
2. Select the business/assigned branch and date scope you want.
3. Review sales, payment mix, stock alerts, open shifts and cash variance.
4. Open the relevant analytics tab to investigate a product, terminal, discount, tax or shift question.
5. Owner uses **Profit** and **Leaks** for cost-based results; these are not available to managers.
6. Export the report if needed, observing the report-specific export limits in the role guide.
7. Follow up on stock, missing counts, void/refund reasons and open drawers through the operational procedures.

Dates follow each business's configured operating-day cutoff, so a trading day can cross midnight. Daily email summaries are unavailable while email delivery is disabled; use the portal reports directly.

## Recover staff access

1. Confirm name, role, assigned branches and status in the owner's **Staff** page.
2. If merely locked from wrong attempts, wait for the lockout countdown rather than resetting credentials.
3. If pending, issue a fresh temporary PIN and complete the matching setup.
4. If a permanent credential is forgotten, use the owner's specific password/PIN reset control.
5. Confirm **Active** status and have the person unlock/sign in again.

Use [Accounts and access](accounts-and-access.md) for exact effects. New manager challenges require email; they cannot be completed from an owner-visible PIN in this deployment.

[Next: POS terminal →](pos-terminal.md)
