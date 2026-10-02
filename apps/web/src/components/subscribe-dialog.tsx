"use client";

import { useEffect, useId, useRef, type Ref } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { SubscribeFields, SubscribeStatus } from "./use-footer-subscribe";

const INVALID_INPUT_CLASS =
  "text-destructive aria-invalid:border-input aria-invalid:ring-0 dark:aria-invalid:border-input dark:aria-invalid:ring-0";

const OPTIONAL_FIELDS = [
  {
    autoComplete: "given-name",
    key: "firstName",
    label: "First",
    placeholder: "Jane…",
  },
  {
    autoComplete: "family-name",
    key: "lastName",
    label: "Last",
    placeholder: "Smith…",
  },
  {
    autoComplete: "organization",
    key: "company",
    label: "Company",
    placeholder: "Acme…",
  },
  {
    autoComplete: "organization-title",
    key: "title",
    label: "Title",
    placeholder: "Engineer…",
  },
] as const;

function Field({
  autoComplete,
  describedBy,
  id,
  inputMode,
  inputRef,
  invalid,
  label,
  name,
  onChange,
  placeholder,
  required,
  spellCheck,
  type = "text",
  value,
}: {
  autoComplete: string;
  describedBy?: string;
  id: string;
  inputMode?: "email" | "text";
  inputRef?: Ref<HTMLInputElement>;
  invalid?: boolean;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  spellCheck?: boolean;
  type?: "email" | "text";
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-[12px] text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <Input
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        autoComplete={autoComplete}
        className={cn("min-w-0", invalid && INVALID_INPUT_CLASS)}
        id={id}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        spellCheck={spellCheck}
        type={type}
        value={value}
      />
    </div>
  );
}

export function SubscribeDialogCard({
  fields,
  onFieldChange,
  onSubmit,
  status,
}: {
  fields: SubscribeFields;
  onFieldChange: <Key extends keyof SubscribeFields>(
    key: Key,
    value: SubscribeFields[Key],
  ) => void;
  onSubmit: () => void;
  status: SubscribeStatus;
}) {
  const baseId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const invalid = status === "invalid";
  const failed = status === "error";
  const submitting = status === "submitting";
  const errorId = `${baseId}-email-error`;
  const submitErrorId = `${baseId}-submit-error`;

  useEffect(() => {
    if (invalid) emailRef.current?.focus();
  }, [invalid]);

  return (
    <Card
      className="chooser-card w-full gap-0 overflow-hidden py-0"
      size="sm"
    >
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <CardTitle
          aria-hidden="true"
          className="text-body font-medium"
        >
          Get new results
        </CardTitle>
        <CardDescription aria-hidden="true">
          Get an email when new benchmarks are published.
        </CardDescription>
      </CardHeader>
      <form
        aria-busy={submitting || undefined}
        aria-describedby={failed ? submitErrorId : undefined}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:px-6">
          <div className="sm:col-span-2">
            <Field
              autoComplete="email"
              describedBy={invalid ? errorId : undefined}
              id={`${baseId}-email`}
              inputMode="email"
              inputRef={emailRef}
              invalid={invalid}
              label="Email"
              name="email"
              onChange={(value) => onFieldChange("email", value)}
              placeholder="you@work.com…"
              required
              spellCheck={false}
              type="email"
              value={fields.email}
            />
            <p className="mt-1 text-note text-destructive" id={errorId} role="alert">
              {invalid ? "Enter a valid email." : null}
            </p>
          </div>
          {OPTIONAL_FIELDS.map((field) => (
            <Field
              autoComplete={field.autoComplete}
              id={`${baseId}-${field.key}`}
              key={field.key}
              label={field.label}
              name={field.key}
              onChange={(value) => onFieldChange(field.key, value)}
              placeholder={field.placeholder}
              value={fields[field.key]}
            />
          ))}
        </CardContent>
        <CardFooter className="flex-wrap justify-end gap-2">
          {failed ? (
            <p
              className="mr-auto text-[12px] text-destructive"
              id={submitErrorId}
              role="alert"
            >
              Couldn’t subscribe. Try again.
            </p>
          ) : null}
          <DialogClose
            disabled={submitting}
            render={<Button type="button" variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button disabled={submitting} type="submit">
            {submitting ? "Subscribing…" : "Subscribe"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
