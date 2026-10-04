# Sentry POS user guide

**Start with your role, then follow the task you need.** This guide explains the current app in plain language, including account setup, selling, stock, reports, and account administration.

Checked against the application on **4 October 2026**. Amounts are Philippine pesos unless a screen explicitly says centavos. Operational dates and times use **Asia/Manila**.

## Choose your guide

| I am a… | Start here | What you will learn |
| --- | --- | --- |
| Platform administrator | [Platform admin](platform-admin.md) | Sign in with two-factor authentication, create owners, set limits, control access, inspect records. |
| Business owner | [Owner](owner.md) | Set up businesses, branches, products, stock, staff and terminals; review reports and settings. |
| Manager | [Manager](manager.md) | Activate staff access, oversee assigned branches, handle stock, review reports and approve cashier actions. |
| Cashier | [Cashier](cashier.md) | Activate a PIN, open a shift, sell, request approvals and close the drawer. |
| Website / CMS editor | [CMS editor](cms-editor.md) | Edit the public website, upload marketing images, publish policies and manage CMS users. |

## Find a task

| I want to… | Read |
| --- | --- |
| Open an account or help someone activate theirs | [Accounts and access](accounts-and-access.md) |
| Set up a new store from beginning to end | [Complete workflows](workflows.md) |
| Pair a tablet or computer with a branch | [POS terminal](pos-terminal.md) |
| Make a sale, take payment or print a receipt | [POS terminal](pos-terminal.md) |
| Void or refund a sale | [POS terminal](pos-terminal.md) |
| Receive stock, transfer items or count shelves | [Owner](owner.md) or [Manager](manager.md) |
| Understand sales, tax, profit or missing cash | [Owner](owner.md) or [Manager](manager.md) |
| Reset a staff PIN or change a staff member's access | [Accounts and access](accounts-and-access.md) |
| Fix a login, payment, printer or stock problem | [Troubleshooting](troubleshooting.md) |
| Understand a word used in the app | [Glossary](glossary.md) |
| Check whether a feature is covered | [Feature index](feature-index.md) |

## Open the app

| Destination | Link | Used by |
| --- | --- | --- |
| Public website | [Sentry website](https://sentry-pos-landing.vercel.app/) | Visitors and anyone requesting access |
| Portal sign-in | [Sign in](https://sentry-pos-landing.vercel.app/login) | Platform admins, owners and managers |
| Platform panel | [Platform admin](https://sentry-pos-landing.vercel.app/admin) | Platform admins |
| Owner portal | [Owner portal](https://sentry-pos-landing.vercel.app/portal) | Owners |
| Manager portal | [Manager portal](https://sentry-pos-landing.vercel.app/portal/manager) | Managers |
| Staff setup | [Set up staff access](https://sentry-pos-landing.vercel.app/login/staff) | Managers with a temporary setup PIN |
| POS terminal | [Open POS](https://sentry-pos-terminal.onrender.com/) | Owners, managers and cashiers at a counter |
| Website editor | [Sentry CMS](https://sentry-pos-landing.vercel.app/cms) | CMS users with a separate account |

## How Sentry is organized

A **platform admin** creates an **owner account**. The owner creates a **business**, adds its **branches**, prepares a shared **catalog**, and assigns **staff** to branches. Each counter browser is paired as a **terminal** in one branch. A named operator opens a **shift** before selling.

- A business is the organization whose catalog, settings and reporting you manage.
- A branch is a location. Stock is counted separately for each branch.
- A terminal is a paired counter browser. It has its own sales history and drawer shifts.
- A staff account belongs to a business and has assigned branches.
- A shift records one operator's opening float, sales, cash movements and closing count.

Managers work within their assigned branches. Cashiers use the POS. CMS accounts edit the marketing website; they do not provide owner, manager or platform access.

## What works in the current deployment

**Email delivery is disabled while Resend is not configured.** Existing active accounts can sign in and operate the app. Cashier setup can use the temporary PIN shown to the owner. New owner activation, new manager setup, email password recovery and daily email summaries need working email delivery. An “emailed” message on a screen does not mean a message was delivered in this setup. See [Accounts and access](accounts-and-access.md).

The POS currently needs the online service to complete operations. A saved cart or pending-payment retry is not a complete offline selling mode. The free Render service can also take time to respond after being idle; see [Troubleshooting](troubleshooting.md).

Already active test accounts for **Kape Diaria (Demo)** can be used for practice. Get their credentials from the person who provided your access; this manual contains no passwords or PINs. Select the demo business explicitly when reviewing its reports because demo data is excluded from ordinary combined owner totals.

## How to use this documentation

In the searchable HTML copy, choose a chapter from the sidebar, use **Find a task** to search headings and instructions, and use **On this page** to jump within a chapter. The PDF contains the full manual for printing. These Markdown chapters are the editable source.

Each procedure tells you **who can do it**, **where to go**, **what to do**, and **what should happen next**. Bold text identifies screen labels. Read a procedure's limits before carrying out an action that changes a completed sale, account, or stock balance.

[Next: accounts and access →](accounts-and-access.md)
