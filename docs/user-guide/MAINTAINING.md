# Maintaining the hosted user guide

The twelve Markdown chapters in this directory are the editable source for the public guide at `/docs`. The matching HTML and PDF are committed under `public/docs`, so a regular application build needs no additional documentation tools.

## Update and publish

1. Check actual UI labels, permissions and recovery rules through the repository's Graft graph.
2. Edit the affected role/task chapter and update the snapshot date when re-verifying the manual.
3. Generate the hosted HTML from the Markdown chapters:

   ```sh
   python3 -m venv /tmp/sentry-guide-tools
   /tmp/sentry-guide-tools/bin/pip install -r docs/user-guide/requirements.txt
   /tmp/sentry-guide-tools/bin/python scripts/build-user-guide.py
   ```

4. Open `/docs` in a local application browser. Confirm task search, chapter links, phone layout and PDF download. The site rewrite preserves the `/docs` address while serving the generated HTML.
5. Refresh `public/docs/SentryPOS-User-Guide.pdf` from the same content when instructions change. Print all chapters using the guide's print stylesheet and keep chapter bookmarks/page numbers when exporting.
6. Run the application's tests, lint and build, then commit the Markdown changes and generated outputs together. Deploy through the existing Vercel project.

The generator embeds the font, styling and search data. PDF links use `/docs/SentryPOS-User-Guide.pdf` so they work at `/docs` without a trailing slash. A Sentry link returns to the homepage. Canonical URL uses `NEXT_PUBLIC_SITE_URL`, with the current production domain as the default.

Public docs do not need portal sign-in. Keep all real credentials, invitation tokens, recovery codes, connection strings and private deployment evidence out of the chapters and public outputs. Document the current feature rather than promising behavior from older specifications.
