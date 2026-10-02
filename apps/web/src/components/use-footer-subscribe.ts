"use client";

import { useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeStatus =
  | "idle"
  | "submitting"
  | "success"
  | "invalid"
  | "error";

export type SubscribeFields = {
  company: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
};

const EMPTY_FIELDS: SubscribeFields = {
  company: "",
  email: "",
  firstName: "",
  lastName: "",
  title: "",
};

export function useFooterSubscribe() {
  const [fields, setFields] = useState<SubscribeFields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  function setField<Key extends keyof SubscribeFields>(
    key: Key,
    value: SubscribeFields[Key],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    if (status === "invalid" || status === "error") setStatus("idle");
  }

  async function submit() {
    if (status === "submitting" || status === "success") return false;
    const email = fields.email.trim();
    if (!EMAIL.test(email)) {
      setStatus("invalid");
      return false;
    }
    const payload = email === fields.email ? fields : { ...fields, email };
    if (email !== fields.email) setFields(payload);
    setStatus("submitting");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 422) {
        setStatus("invalid");
        return false;
      }
      if (!response.ok) {
        setStatus("error");
        return false;
      }
      setStatus("success");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  function reset() {
    setFields(EMPTY_FIELDS);
    setStatus("idle");
  }

  return { fields, reset, setField, status, submit };
}
