"use client";

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for that email, a password-reset link has been sent.";

export const PASSWORD_UPDATED_MESSAGE = "Your password has been updated.";

export const EMAIL_CHANGE_SENT_MESSAGE =
  "Confirmation instructions have been sent. Your current email remains active until the change is confirmed.";

export function safeAccountAccessErrorMessage(message?: string | null) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "This action is temporarily unavailable. Please wait a moment and try again.";
  }

  if (normalized.includes("invalid email") || normalized.includes("email address")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("session") || normalized.includes("jwt") || normalized.includes("expired")) {
    return "Your session has expired. Sign in again and try this action once more.";
  }

  if (normalized.includes("password")) {
    return "The password could not be updated. Check the fields and try again.";
  }

  return "This account action could not be completed. Try again in a moment.";
}

export function validatePasswordPair(password: string, confirmation: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password !== confirmation) return "The password fields must match.";
  return "";
}
