# Accounts and access

[Guide home](README.md) · [Platform admin](platform-admin.md) · [Owner](owner.md) · [Manager](manager.md) · [Cashier](cashier.md)

## How do I open an account?

Sentry does not have public self-registration for store users. Your account is created by the person responsible for your role.

| Account | Who creates it? | How you finish setup |
| --- | --- | --- |
| First platform admin | Deployment operator | Receive initial credentials, sign in, enroll an authenticator, save recovery codes. |
| Owner | Platform admin | Open the invitation email, choose a password, then sign in. |
| Manager | Business owner | Use the emailed temporary PIN on **Set up staff access**; choose a password and a permanent terminal PIN. |
| Cashier | Business owner | Select your name at a paired terminal and replace the owner's temporary PIN with your own permanent PIN. |
| CMS user | Existing CMS administrator | Receive separate CMS credentials and sign in at `/cms`. |

If you are a new business owner, use **Request access** on the public website or contact the platform team. **Request access** opens an email draft; it does not create an account or submit an in-app registration form.

### Current email restriction

Email is intentionally disabled in this deployment. New owner invitations and manager temporary PINs are not delivered. The app has no owner invitation-copy button or manager temporary-PIN display as a replacement. Email password-reset links and daily summary emails are also unavailable.

Use an account that is already active for testing. Ask the deployment operator to enable email before using new owner or manager onboarding. Cashier creation and setup can still work because the owner receives the cashier's temporary PIN directly on screen.

Do not reset a working manager account just to test email recovery: owner-managed reset makes it pending and removes the affected credential, so it can become unusable while email is disabled.

## Passwords, PINs and authenticator codes

| Credential | Purpose | Where it is entered |
| --- | --- | --- |
| Portal password | Sign in as platform admin, owner or manager | Portal **Sign in** |
| Temporary staff PIN | Complete one staff setup/reset challenge | Staff setup page or terminal setup screen |
| Permanent terminal PIN | Unlock POS as a named owner, manager or cashier | Terminal operator screen |
| Owner terminal PIN | Owner terminal access and in-person approval of protected cashier actions | Set under owner settings; enter on POS |
| Authenticator code | Second sign-in step for platform admins | **Two-factor authentication** |
| Recovery code | One-time alternative when an admin cannot use the authenticator | Same two-factor code field |
| CMS password | Access marketing content | Separate CMS sign-in |

Terminal PINs contain **six digits**. Temporary staff PINs expire after **15 minutes**, permit at most **five wrong attempts**, and are used once. Choose a different permanent PIN from the temporary PIN. Portal passwords set through owner/staff setup must contain at least **eight characters**.

## Platform admin: first sign-in

**Before you start:** obtain the platform admin email and initial password from the deployment operator. Initial platform provisioning is an operator task; there is no **Create platform admin** screen in the store portal. A CMS login is a different account.

1. Open [Sign in](https://sentry-pos-landing.vercel.app/login).
2. Enter your email address and password, then choose **Sign in**.
3. On first sign-in, Sentry opens **Set up two-factor authentication**.
4. Scan the QR code in your authenticator app, or enter the displayed setup key manually.
5. Enter the current six-digit code and submit the setup form.
6. Save all **eight recovery codes** somewhere you can retrieve them. They are shown once; each works once.
7. Choose **I have saved these — sign in**.
8. Sign in again and complete the two-factor step with a fresh authenticator code.

**Result:** you reach the platform panel. Later sign-ins use your password followed by the current authenticator code. If you have lost access to the authenticator, enter one unused recovery code in the same field. An already accepted authenticator code cannot be reused; wait for the next code.

If the two-factor page expires, start again from sign-in. There is no self-service two-factor reset or recovery-code regeneration page in the current app. Contact the deployment operator if both your authenticator and recovery codes are unavailable.

## Platform admin: create an owner account

**Where:** **Platform panel → Owners → Add owner**. Full access-control procedures are in [Platform admin](platform-admin.md).

1. Enter **Business owner name** and **Email address**.
2. Set **Business limit** to a whole number between **1 and 1000**. Demo businesses do not count against this limit.
3. Submit the form.
4. Confirm the owner detail page shows the correct name, email and business limit.
5. With working email, tell the owner to open the invitation and finish the next procedure within seven days.

**Result:** an owner record exists, but the user cannot sign in until they have set a password. An **Active** status badge alone does not prove activation is complete. The admin cannot choose or view the owner's password.

With email disabled, creating the record does not give the owner usable access. There is currently no admin UI to resend an owner invite or copy its activation link. An expired or undelivered invitation needs platform/operator assistance; do not try to create the same email again.

## Owner: activate your account

**Needs:** a valid owner invitation from Sentry and working email delivery.

1. Open the invitation email and follow its complete activation link.
2. On **Activate your account**, enter a password of at least eight characters.
3. Enter the same password in the confirmation field.
4. Choose **Activate account**.
5. When returned to sign-in, enter your email and the password you just chose.

**Result:** your owner portal is available. A demo business is created for practice as part of activation. An invitation expires after **seven days** and cannot be reused once accepted.

If the page says the token is missing, reopen the original link without removing any part of it. If it is expired or already used, contact the platform team. The sign-in password field will not activate an unused invitation.

## Owner: create manager or cashier access

**Where:** open the relevant business, then **Staff**. **Needs:** at least one branch in that business.

1. Find **Add staff** on **Staff access**.
2. Enter **Name**.
3. Choose **Manager** or **Cashier** under **Role**.
4. Enter **Email address** for a manager. A cashier's email is optional.
5. Tick at least one **Assigned branches** checkbox.
6. Choose **Add staff member**.
7. For a cashier, record the temporary PIN shown once, give it directly to that person, then choose **I have shared this PIN** to hide it.
8. For a manager, have them check their email for the setup PIN when email delivery is enabled.

**Result:** staff status is **Pending** until the person finishes their role's setup. The role determines access; a manager's portal access is limited to assigned branches. A cashier's email does not grant portal access.

The manager's temporary PIN is not shown to the owner. In the current email-disabled deployment, new manager setup stops here. Existing active managers can continue using their existing credentials.

## Manager: complete first-time setup

**Needs:** owner-created pending manager account, assigned branches and the latest emailed temporary PIN.

1. Open [Set up staff access](https://sentry-pos-landing.vercel.app/login/staff), or follow the staff setup link from sign-in.
2. Enter the email address used by the owner.
3. Enter your six-digit **temporary PIN**.
4. Choose a password of at least eight characters and confirm it.
5. Choose a different six-digit **terminal PIN** and confirm it.
6. Submit setup.

**Result:** your account becomes **Active** and you enter the manager portal. Use your password for portal sign-in and your permanent PIN at assigned branch terminals.

An expired/used challenge needs the owner to issue a new temporary PIN. Always use the latest one. See [Manager](manager.md) for your everyday workflow.

## Cashier: complete first-time setup

**Needs:** owner-created cashier, temporary PIN from the owner and a terminal paired to an assigned branch.

1. Open the POS on the paired counter device.
2. Select your name from the operator list.
3. Enter the temporary six-digit PIN given to you by the owner.
4. Choose a different permanent six-digit PIN and enter it again to confirm.
5. Finish setup.

**Result:** your account becomes **Active** and the terminal unlocks for you. If your name is absent, the owner must check your branch assignment and staff status. See [Cashier](cashier.md) and [POS terminal](pos-terminal.md).

## Sign in after setup

**Owner or manager:** open portal sign-in, enter your email/password and choose **Sign in**. Sentry sends you to your role's portal. The password visibility button lets you check your typing before submitting.

**Cashier:** open a paired terminal, choose your name and enter your permanent PIN. Cashiers do not sign in to the owner/manager portal.

**Owner at POS:** set your **Owner terminal PIN** in owner settings first, then select your owner identity at the terminal and use that PIN. Pairing a device with your owner password and unlocking as an operator are separate steps.

**CMS user:** open `/cms` and use your CMS credentials. Signing in there does not sign you into the platform or store portal.

Portal passwords and permanent operator PINs lock temporarily after **four failed attempts**. Wait **five minutes** or follow the displayed countdown before trying again. This differs from the temporary staff PIN's five-attempt limit.

## Owner: edit staff details and branch access

**Where:** the business's **Staff** page → person's card → **Edit name, role and branches**.

1. Change the name, role, email or assigned branches as needed.
2. Keep at least one branch assignment.
3. Provide a manager email when changing to the manager role.
4. Choose **Save access** and confirm the new details.

A role change clears both password and PIN and requires the new role's setup. Email, role or branch updates end current staff sessions; tell the staff member to sign in/unlock again. The full edit form submits branch assignments even if they look unchanged, so saving it can end sessions even when you only edit the name. Existing credentials are kept when the role is unchanged. Deactivated staff cannot be edited until reactivated.

## Owner: issue a new temporary PIN

**When:** setup expired, the temporary PIN was lost, or the person is still pending.

1. Open that staff member's controls on **Staff**.
2. Tick **I confirm this access change and any session revocation**.
3. Choose **Issue fresh setup PIN** for a pending cashier or **Resend setup email** for a pending manager.
4. For a cashier, capture the newly displayed PIN and hand it to them.
5. For a manager, have them use the newly emailed PIN when email is available.
6. Have the person finish the appropriate setup within 15 minutes.

**Result:** previous temporary PINs no longer work. Manager challenges remain email-only.

## Owner: reset a staff member's credentials

| Action | What changes | How the person finishes |
| --- | --- | --- |
| **Reset terminal PIN** | Clears PIN, ends active sessions and makes staff pending | Use the new temporary PIN at a paired assigned terminal; choose a new PIN. |
| **Reset portal password** (manager) | Clears password, ends active sessions and makes the manager pending | Open staff setup in password-reset mode; use the emailed temporary PIN and choose a new password. |

1. Open the staff member's controls.
2. Tick **I confirm this access change and any session revocation**.
3. Choose the reset action you need.
4. Give the cashier the PIN shown on screen, or direct the manager to their email.
5. Complete reset before the challenge expires.

A manager password-only reset uses [Staff password reset](https://sentry-pos-landing.vercel.app/login/staff?mode=password) and preserves an existing terminal PIN. A PIN-only reset normally finishes at POS. If either credential was already missing before the manager reset, Sentry requires full manager setup and clears both credentials.

These actions interrupt access immediately. With email disabled, managers cannot finish the emailed reset challenge through the current UI.

## Owner: deactivate or reactivate staff

**Deactivate:** open staff controls, tick **I confirm this access change and any session revocation**, then choose **Deactivate**. The person loses portal and terminal sessions, and existing temporary challenges are invalidated. Use this when someone should no longer work in the business.

**Reactivate:** tick the same confirmation checkbox and choose **Reactivate** on the deactivated staff member. Complete retained credentials can be reused; if setup credentials are missing, a new setup challenge is issued. Check status and tell the person whether to use existing credentials or complete setup. A manager who needs a new challenge still needs email delivery.

Do not deactivate the operator of an open drawer as a routine handover method. Close the shift normally first. See emergency-close limits in [POS terminal](pos-terminal.md).

## Forgot your portal password?

**When email is enabled:**

1. Choose **Forgot password?** on sign-in.
2. Enter the account email and submit.
3. Open the reset email within **one hour**.
4. Follow the link, set a password of at least eight characters and confirm it.
5. Sign in again. Existing portal sessions are ended.

The request screen gives a general response even when an email is not found. It does not confirm that an account exists or that delivery happened.

This works for an already active manager's portal password as well as owner/admin passwords when email works. It does not activate pending staff, reactivate deactivated staff, change terminal PINs, or replace manager first-time setup. With email disabled, ask your account administrator for help; no reset email will arrive.

## End your session

Use portal **Sign out** when finished. At a shared counter, use **Lock** whenever stepping away. Lock preserves the current cart and drawer, so another operator cannot simply take over your open shift. Close your shift before a regular handover. See [POS terminal](pos-terminal.md).

[Next: complete workflows →](workflows.md)
