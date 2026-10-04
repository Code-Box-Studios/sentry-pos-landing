# Feature index and permissions

[Guide home](README.md) · [Complete workflows](workflows.md) · [Glossary](glossary.md)

Use this index to find a function and see who can use it. **Assigned** means only the manager's permitted branches. **Approval** means an eligible manager/owner enters their own PIN for that action. Normal sale/shift rules still apply.

## Account and platform features

| Function | Who uses it? | Instructions |
| --- | --- | --- |
| Request owner access | Visitor | [Accounts and access](accounts-and-access.md) |
| Initial platform-admin provisioning | Deployment operator | [Accounts and access](accounts-and-access.md) |
| Portal sign-in/sign-out | Admin, owner, manager | [Accounts and access](accounts-and-access.md) |
| Admin authenticator enrollment/recovery | Platform admin | [Accounts and access](accounts-and-access.md) |
| Owner creation/invitation/activation | Admin creates; owner accepts | [Accounts and access](accounts-and-access.md) |
| Owner name/business limit | Platform admin | [Platform admin](platform-admin.md) |
| Owner suspension/hard suspension/reinstatement | Platform admin | [Platform admin](platform-admin.md) |
| Read-only tenant inspection | Platform admin | [Platform admin](platform-admin.md) |
| Platform counts/metrics | Platform admin | [Platform admin](platform-admin.md) |
| Forgot password | Portal users with working email; staff status limits apply | [Accounts and access](accounts-and-access.md) |
| Staff creation/name/role/email/branches | Owner | [Accounts and access](accounts-and-access.md) |
| Manager setup | Manager with emailed challenge | [Manager](manager.md) |
| Cashier setup | Cashier with owner-provided challenge | [Cashier](cashier.md) |
| Staff reset/reissue/deactivate/reactivate | Owner | [Accounts and access](accounts-and-access.md) |

## Business and catalog features

| Function | Owner | Manager | Cashier | Instructions |
| --- | --- | --- | --- | --- |
| Business/branch create, edit, delete | Yes | No | No | [Owner](owner.md) |
| Categories and ordering | Edit | Read catalog | Use at POS | [Owner](owner.md) |
| Product details, price, cost, SKU/barcode, active/stock/expiry flags | Edit | Read allowed details; no cost | Use sellable items | [Owner](owner.md) |
| Product variants | Edit | Read | Select at POS | [Owner](owner.md) |
| Product images/business logo | Edit | No | View configured content | [Owner](owner.md) |
| Modifier groups/options/min/max and product links | Edit | No | Select at POS | [Owner](owner.md) |
| Named discounts and activation | Configure | Select at POS | Select at POS | [Owner](owner.md), [POS terminal](pos-terminal.md) |
| VAT, service charge, day start, misc, blind close, receipt settings | Edit | No | Follow configuration | [Owner](owner.md) |
| Owner terminal PIN | Set own | No | No | [Owner](owner.md) |

## POS and drawer features

| Function | Owner | Manager | Cashier | Instructions |
| --- | --- | --- | --- | --- |
| Pair a browser to a branch | Owner credentials | No | No | [POS terminal](pos-terminal.md) |
| Unlock/lock as named operator | Yes | Assigned | Assigned | [POS terminal](pos-terminal.md) |
| Open/close shift and cash in/out | Own drawer | Own drawer | Own drawer | [POS terminal](pos-terminal.md) |
| Search, category browse, barcode, variants, modifiers, weight | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Miscellaneous item | When enabled | When enabled | When enabled | [POS terminal](pos-terminal.md) |
| Cart quantity/remove/cancel/hold/resume | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Named line/order discount and SC/PWD | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Free-form discount entry | Owner only | No | No | [POS terminal](pos-terminal.md) |
| Cash/card/GCash/Maya payment and reference/change | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Pending-payment recovery | Original attempt/operator | Original attempt/operator | Original attempt/operator | [POS terminal](pos-terminal.md) |
| Receipt preview/print/reprint | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Terminal History | Current terminal | Current terminal | Current terminal | [POS terminal](pos-terminal.md) |
| Activity | Branch | Branch | Own branch records | [Manager](manager.md), [Cashier](cashier.md) |
| Void | Eligible sale | Eligible sale | Approval | [POS terminal](pos-terminal.md) |
| Full-sale refund | Own PIN | Own PIN | Approval | [POS terminal](pos-terminal.md) |
| Terminal stock adjustment | Yes | Assigned | Approval | [POS terminal](pos-terminal.md) |
| Emergency drawer close | Only when original operator is ineligible | Same condition | Request eligible approver | [POS terminal](pos-terminal.md) |
| Paper width/test print/receipt preview | Yes | Yes | Yes | [POS terminal](pos-terminal.md) |
| Local unpair | Owner password | Owner password | Owner password | [POS terminal](pos-terminal.md) |

## Inventory, reports and lifecycle

| Function | Owner | Manager | Cashier | Instructions |
| --- | --- | --- | --- | --- |
| Portal stock levels | Yes | Assigned | No | [Owner](owner.md), [Manager](manager.md) |
| Receive delivery/expiry batch | Yes, including cost | Assigned, no cost | No | [Owner](owner.md), [Manager](manager.md) |
| Portal quantity adjustment/reason/note | Yes | Assigned | No | [Owner](owner.md), [Manager](manager.md) |
| Same-business stock transfer | Yes | Assigned source | No | [Owner](owner.md), [Manager](manager.md) |
| Draft/edit/post physical count and count history | Yes | Assigned | No | [Owner](owner.md), [Manager](manager.md) |
| Expiry batch review | Yes | Assigned | No | [Owner](owner.md), [Manager](manager.md) |
| Sales dashboard | All real businesses | Assigned branches | No | [Owner](owner.md), [Manager](manager.md) |
| Analytics scope/date/Overview/Sales/Products/Inventory/Tax | Yes | Assigned, financial masking | No | [Owner](owner.md), [Manager](manager.md) |
| Profit and Leaks | Yes | No | No | [Owner](owner.md) |
| CSV report downloads | Displayed report controls | Allowed reports, masked fields | No | [Owner](owner.md), [Manager](manager.md) |
| Remote terminal status/unpair | Own businesses | Assigned | No | [Owner](owner.md), [Manager](manager.md) |
| Business activity | Own businesses | Assigned | No portal access | [Owner](owner.md), [Manager](manager.md) |
| Notifications/read/all-read | Owner alerts | Low-stock Alerts view | No | [Owner](owner.md), [Manager](manager.md) |
| Daily summary preference | Real businesses | No | No | [Owner](owner.md); delivery needs email |
| Demo practice/reset | Practice and reset | Assigned practice | Assigned practice | [Complete workflows](workflows.md), [Owner](owner.md) |
| Account export/closure | Owner | No | No | [Owner](owner.md) |

## Website features

| Function | Who uses it? | Instructions |
| --- | --- | --- |
| Landing copy/navigation/buttons/contact/metadata | CMS user | [CMS editor](cms-editor.md) |
| Marketing media upload/alt text | CMS user | [CMS editor](cms-editor.md) |
| Draft/publish/unpublish terms and privacy | CMS user | [CMS editor](cms-editor.md) |
| CMS user management | CMS user/administrator | [CMS editor](cms-editor.md) |

## Current limits to remember

New owner/manager email onboarding is blocked while mail is disabled. Full offline selling, split payments, partial refunds and customer/order/line note entry are not implemented in the current POS. Some export and catalog-editing limits are described in the relevant procedures. See [Troubleshooting](troubleshooting.md) before retrying an uncertain transaction.

[Back to guide home →](README.md)
