"use client";
import { useState } from "react";
import {
  suggestedSlug,
  type RegistrationDraft,
} from "../../../lib/registration";

import { Dropdown } from "../../../components/dropdown";
import { PhoneInput } from "../../../components/phone-input";

export function RegistrationFields({
  step,
  draft,
  onDraftChange,
  showPassword,
  onTogglePassword,
}: {
  step: number;
  draft: RegistrationDraft;
  onDraftChange: (patch: Partial<RegistrationDraft>) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  return (
    <>
      <section
        className="registration-step"
        hidden={step !== 0}
        aria-label="Your details"
      >
        <div className="registration-names">
          <label>
            First name <span className="required-mark">*</span>
            <input
              name="firstName"
              value={draft.firstName}
              onChange={(event) =>
                onDraftChange({ firstName: event.target.value })
              }
              required
              maxLength={60}
              pattern=".*\S.*"
              autoComplete="given-name"
              placeholder="First name"
            />
          </label>
          <label>
            Middle name <span className="optional">optional</span>
            <input
              name="middleName"
              value={draft.middleName}
              onChange={(event) =>
                onDraftChange({ middleName: event.target.value })
              }
              maxLength={60}
              autoComplete="additional-name"
              placeholder="Middle name"
            />
          </label>
          <label>
            Last name <span className="required-mark">*</span>
            <input
              name="lastName"
              value={draft.lastName}
              onChange={(event) =>
                onDraftChange({ lastName: event.target.value })
              }
              required
              maxLength={60}
              pattern=".*\S.*"
              autoComplete="family-name"
              placeholder="Last name"
            />
          </label>
        </div>
        <div className="registration-pair">
          <label>
            Email address <span className="required-mark">*</span>
            <input
              name="email"
              value={draft.email}
              onChange={(event) => onDraftChange({ email: event.target.value })}
              type="email"
              required
              maxLength={254}
              autoComplete="username"
              placeholder="you@company.com"
            />
          </label>
          <PhoneInput
            value={draft.phoneDisplay}
            country={draft.phoneCountry}
            onChange={(phoneDisplay, phoneCountry) =>
              onDraftChange({ phoneDisplay, phoneCountry })
            }
          />
        </div>
      </section>
      <section
        className="registration-step"
        hidden={step !== 1}
        aria-label="Company details"
      >
        <div className="registration-pair">
          <label>
            Company name <span className="required-mark">*</span>
            <input
              name="organizationName"
              value={draft.organizationName}
              onChange={(event) =>
                onDraftChange({
                  organizationName: event.target.value,
                  ...(!draft.slugEdited
                    ? { organizationSlug: suggestedSlug(event.target.value) }
                    : {}),
                })
              }
              required
              maxLength={120}
              pattern=".*\S.*"
              autoComplete="organization"
              placeholder="Your company"
            />
          </label>
          <label>
            Organization slug <span className="required-mark">*</span>
            <input
              name="organizationSlug"
              required
              value={draft.organizationSlug}
              onChange={(event) =>
                onDraftChange({
                  organizationSlug: event.target.value,
                  slugEdited: event.target.value.length > 0,
                })
              }
              minLength={3}
              maxLength={63}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="your-company"
            />
            <span className="field-hint">
              Suggested from your company name. You can edit it.
            </span>
          </label>
        </div>
        <div className="registration-pair">
          <label>
            Company website <span className="required-mark">*</span>
            <input
              name="companyWebsite"
              value={draft.companyWebsite}
              onChange={(event) =>
                onDraftChange({ companyWebsite: event.target.value })
              }
              type="url"
              required
              maxLength={2048}
              placeholder="https://www.example.com"
              autoComplete="url"
            />
          </label>
          <label>
            Number of employees <span className="required-mark">*</span>
            <Dropdown
              name="employeeCount"
              label="Number of employees"
              placeholder="Select company size"
              searchable={false}
              value={draft.employeeCount}
              onChange={(employeeCount) => onDraftChange({ employeeCount })}
              options={[
                "1-10",
                "11-50",
                "51-200",
                "201-500",
                "501-1000",
                "1001+",
              ].map((range) => ({ value: range, label: `${range} employees` }))}
            />
          </label>
        </div>
      </section>
      <section
        className="registration-step"
        hidden={step !== 2}
        aria-label="Security"
      >
        <div className="registration-pair">
          <label>
            Password <span className="required-mark">*</span>
            <div className="password-field">
              <input
                name="password"
                value={draft.password}
                onChange={(event) =>
                  onDraftChange({ password: event.target.value })
                }
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Create a password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={onTogglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span className="field-hint">Use at least 12 characters.</span>
          </label>
          <label>
            Confirm password <span className="required-mark">*</span>
            <div className="password-field">
              <input
                name="confirmPassword"
                value={draft.confirmPassword}
                onChange={(event) =>
                  onDraftChange({ confirmPassword: event.target.value })
                }
                type={showConfirmation ? "text" : "password"}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Repeat your password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                aria-label={
                  showConfirmation
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmation}
              >
                {showConfirmation ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        </div>
      </section>
    </>
  );
}
