import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authReturnKind, shouldEnterApp } from "./auth-return";

describe("authentication return", () => {
  it("enters the app on the first email confirmation return", () => {
    assert.equal(shouldEnterApp(authReturnKind("/", "#access_token=test&type=signup"), "/"), true);
  });
  it("handles a SIGNED_IN event after the client already removed the fragment", () => {
    assert.equal(shouldEnterApp(authReturnKind("/", ""), "/", "SIGNED_IN"), true);
  });
  it("handles callback initialization even when the fragment is already consumed", () => {
    assert.equal(shouldEnterApp(authReturnKind("/auth/callback", ""), "/auth/callback", "INITIAL_SESSION"), true);
  });
  it("does not redirect ordinary homepage visits with a saved session", () => {
    assert.equal(shouldEnterApp("none", "/", "INITIAL_SESSION"), false);
  });
  it("keeps recovery links on the password reset screen", () => {
    assert.equal(shouldEnterApp(authReturnKind("/reset-password", "#access_token=test&type=recovery"), "/reset-password", "SIGNED_IN"), false);
  });
  it("does not treat failed verification as success", () => {
    assert.equal(shouldEnterApp(authReturnKind("/auth/callback", "#error=access_denied&error_code=otp_expired"), "/auth/callback", "SIGNED_IN"), false);
  });
});