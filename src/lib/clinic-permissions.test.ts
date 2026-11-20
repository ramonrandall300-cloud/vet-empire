import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { canAccessClinicPath } from "./clinic-permissions";

describe("clinic route permissions", () => {
  test("front-desk staff cannot open examinations", () => {
    assert.equal(canAccessClinicPath("staff", "/app/examinations"), false);
  });

  test("front-desk staff can open invoices", () => {
    assert.equal(canAccessClinicPath("staff", "/app/invoices"), true);
  });

  test("veterinarians can open examinations but not invoices", () => {
    assert.equal(canAccessClinicPath("veterinarian", "/app/examinations"), true);
    assert.equal(canAccessClinicPath("veterinarian", "/app/invoices"), false);
  });

  test("admins can manage staff but cannot open owner-only billing", () => {
    assert.equal(canAccessClinicPath("admin", "/app/users"), true);
    assert.equal(canAccessClinicPath("admin", "/app/subscription"), false);
  });

  test("owners can open subscription billing", () => {
    assert.equal(canAccessClinicPath("owner", "/app/subscription"), true);
  });

  test("only platform admins can open the all-clinics console", () => {
    assert.equal(canAccessClinicPath("owner", "/app/clinics"), false);
    assert.equal(canAccessClinicPath(null, "/app/clinics", true), true);
  });
});
