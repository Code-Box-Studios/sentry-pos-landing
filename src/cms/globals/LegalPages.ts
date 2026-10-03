import type { GlobalConfig } from "payload";
import { revalidateTag } from "next/cache";

export const LegalPages: GlobalConfig = {
  slug: "legal-pages",
  label: "Terms and privacy",
  admin: { group: "Content", description: "Enter reviewed policies and business details before publishing. Unpublished drafts are never shown to visitors." },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: "businessName", type: "text" },
    { name: "contactEmail", type: "email" },
    ...(["terms", "privacy"] as const).map((name) => ({
      name, type: "group" as const,
      fields: [
        { name: "published", type: "checkbox" as const, defaultValue: false },
        { name: "effectiveDate", type: "date" as const },
        { name: "body", type: "textarea" as const, admin: { description: "Reviewed policy text. Separate paragraphs with a blank line." } },
      ],
    })),
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      for (const name of ["terms", "privacy"]) {
        if (data?.[name]?.published && (!data.businessName?.trim() || !data.contactEmail?.trim() || !data[name].body?.trim() || !data[name].effectiveDate)) {
          throw new Error("Publishing requires the business name, contact email, effective date, and reviewed policy text.");
        }
      }
      return data;
    }],
    afterChange: [({ doc }) => { revalidateTag("legal-pages"); return doc; }],
  },
};
