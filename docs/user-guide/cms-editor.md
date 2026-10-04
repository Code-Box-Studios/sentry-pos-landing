# Website and CMS editor guide

[Guide home](README.md) · [Accounts and access](accounts-and-access.md)

**Your job:** maintain the public Sentry marketing website and its terms/privacy pages. The CMS does not manage store products, staff, stock or payments.

## Sign in to the correct account

1. Open [Sentry CMS](https://sentry-pos-landing.vercel.app/cms).
2. Enter your CMS email and password.
3. Open the relevant item under **Content** or **Settings**.

CMS identities are separate from platform-admin identities. The same email can be supplied for separate accounts, but signing in to `/admin` or `/portal` does not give CMS access. Get your CMS account from an existing CMS administrator. The first CMS administrator is established during deployment; there is no public CMS registration link on the landing page.

The CMS has its own lockout: **five failed login attempts** can lock access for **ten minutes**. Its email recovery cannot deliver mail while email is disabled.

## Edit the public landing page

**Where:** **Content → Landing page**.

1. Open the appropriate tab from the table below.
2. Edit the text or list rows you want to change.
3. Preserve the required number of rows where the form sets a minimum/maximum.
4. Save the global document with the CMS save control.
5. Open the [public website](https://sentry-pos-landing.vercel.app/) and verify the saved change after refreshing.

Landing content saves update the live page; there is no separate draft/publish workflow configured for this global. Treat saving as publishing. Required fields must be valid before saving.

| Tab | Editable content | Notes |
| --- | --- | --- |
| **Meta** | Browser/search title and description | Describe the current POS product accurately. |
| **Nav & hero** | Navigation labels/links, badge, headline, supporting text, primary/secondary button labels, activity ticker | Up to six nav links. Ticker lines are example text, not a live activity feed. |
| **Features** | Icon, tone, title and body for feature cards | Exactly three cards; icons: counter/chart/record, tones: mint/purple/orange. |
| **Counter** | Eyebrow, heading and bullets next to the POS illustration | Lists can be edited and reordered. |
| **Numbers** | Eyebrow, heading and analytics bullets | Keep claims aligned with current reporting/email availability. |
| **Branches** | Heading and illustration/text cards | Exactly four cards; illustrations: transfer, expiry, stocktake, terminals. |
| **Product** | Showcase eyebrow/heading/subtext, three device captions, extra feature cards | Exactly three device captions. |
| **Call to action & footer** | Banner text/button label, contact email/links, footer links and copyright | Contact email is used by the Request access buttons. |

Useful navigation anchors are `#counter`, `#numbers`, `#branches`, `#product` and `#contact`. Use `/terms` and `/privacy` for the built-in policy pages. Check edited links on the public site.

**Request access** opens an email draft addressed to the configured contact email. Editing its label does not turn it into account registration. The primary sign-in destination remains portal sign-in. The page's device mockups and illustrations are built into the design; the listed fields edit their captions and content, not the application screenshots themselves.

## Upload or maintain marketing images

**Where:** **Content → Media**.

1. Create a media record and select a **JPEG**, **PNG** or **WebP** image, up to **4 MB**.
2. Enter the required **Alt** text describing the image.
3. Save and inspect the image/record.
4. Use the media list to open, replace or remove an image when appropriate.

The CMS produces wide/card versions for supported uses. CMS media is publicly readable marketing content. Uploading an image does not automatically add it to the landing page: the current landing-content form has no arbitrary hero-image selector. Store product images and business logos are managed by the owner in the store portal instead.

## Save a draft policy

**Where:** **Content → Terms and privacy**.

1. Enter the public **Business name** and **Contact email**.
2. Expand the **Terms** or **Privacy** group.
3. Enter the policy text in **Body** and set its **Effective date**.
4. Leave **Published** unchecked while it is a draft.
5. Save.

Use blank lines between paragraphs. Unpublished policy text is not shown to visitors; the public policy page instead says the policy is being prepared.

## Publish or unpublish terms/privacy

**Before publishing:** obtain the reviewed policy text your organization intends to publish.

1. Open **Terms and privacy**.
2. Ensure business name, contact email, effective date and body are complete for the policy.
3. Check that policy's **Published** box.
4. Save.
5. Open [Terms](https://sentry-pos-landing.vercel.app/terms) or [Privacy](https://sentry-pos-landing.vercel.app/privacy) and verify the text, date and contact information.

Terms and privacy have separate publication switches. Saving a published policy changes its live text. To remove a policy from public view, uncheck its **Published** box and save. The CMS refuses publication with missing required business details, date or body.

## Manage CMS users

**Where:** **Settings → CMS users**.

1. Open the user list and create a user through the CMS record-creation control.
2. Enter the person's name, email and password in the CMS user form.
3. Save and give the person their CMS access details through your usual account handover.
4. Use the user record to maintain name/email/password or remove CMS access when needed.

There is no separate limited “editor” role configured in this CMS collection. A CMS user can access CMS administration, so create these accounts only for people responsible for website content and CMS users. Creating one does not create a platform-admin, owner or staff account.

## Verify changes and sign out

After saving, refresh the relevant public page. If it appears unchanged, confirm that the save succeeded and that you are checking the matching page. Check **Published** for policies. See [Troubleshooting](troubleshooting.md) for further steps.

Use the CMS account/logout control to sign out when finished.

[Next: troubleshooting →](troubleshooting.md)
