"use client";
import Image from "next/image";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import type { MediaAsset, MediaKind } from "@/lib/api/media";
import { saveMediaAction } from "./actions";
export function MediaForm({ kind, id, asset }: { kind: MediaKind; id: string; asset: MediaAsset }) {
  const [state, action, pending] = useActionState(saveMediaAction, EMPTY_FORM_STATE);
  return (
    <section className="space-y-4 rounded-lg border border-hairline p-4">
      <h2 className="font-semibold">{kind === "business" ? "Receipt logo" : "Product image"}</h2>
      {asset.url && (
        <Image
          unoptimized
          width={256}
          height={160}
          src={asset.url}
          alt={kind === "business" ? "Business logo" : "Product image"}
          className="max-h-40 max-w-64 rounded object-contain"
        />
      )}
      {!asset.configured ? (
        <p className="text-sm text-steel">
          Image uploads are not configured. Contact your platform administrator to enable storage.
        </p>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          {state.message && <Alert>{state.message}</Alert>}
          {state.done && <Alert tone="info">Image updated.</Alert>}
          <Field
            name="file"
            label="Image file"
            hint="JPEG, PNG or WebP, up to 4 MB."
            error={state.fieldErrors?.file}
          >
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" name="operation" value="upload" disabled={pending}>
              Upload image
            </Button>
            {asset.url && (
              <Button type="submit" name="operation" value="remove" disabled={pending}>
                Remove image
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
