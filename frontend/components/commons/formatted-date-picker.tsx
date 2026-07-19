"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface FormattedDatePickerProps {
  value?: string;
  onChange?: (date: string | undefined) => void;
  label?: string;
  id?: string;
  description?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  showOptional?: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function FormattedDatePicker({
  value,
  onChange,
  label,
  id,
  description,
  className = "",
  inputClassName = "",
  disabled = false,
  minDate,
  maxDate,
  required = false,
  showOptional = false,
}: FormattedDatePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!value) {
      setDay("");
      setMonth("");
      setYear("");
      setValidationMessage("");
      return;
    }

    const [nextYear, nextMonth, nextDay] = value.split("-");
    setDay(nextDay ?? "");
    setMonth(nextMonth ?? "");
    setYear(nextYear ?? "");
    setValidationMessage("");
  }, [value]);

  const validate = (
    nextDay: string,
    nextMonth: string,
    nextYear: string,
  ) => {
    if (!nextDay && !nextMonth && !nextYear) {
      setValidationMessage("");
      onChange?.(undefined);
      return;
    }

    if (
      nextDay.length !== 2 ||
      nextMonth.length !== 2 ||
      nextYear.length !== 4
    ) {
      setValidationMessage("");
      return;
    }

    const dayNumber = Number(nextDay);
    const monthNumber = Number(nextMonth);
    const yearNumber = Number(nextYear);
    const date = new Date(yearNumber, monthNumber - 1, dayNumber);
    const realDate =
      yearNumber >= 1900 &&
      date.getFullYear() === yearNumber &&
      date.getMonth() === monthNumber - 1 &&
      date.getDate() === dayNumber;

    if (!realDate) {
      setValidationMessage("Enter a valid date.");
      onChange?.(undefined);
      return;
    }

    if (minDate && normalizeDate(date) < normalizeDate(minDate)) {
      setValidationMessage(`Date must be on or after ${toIsoDate(minDate)}.`);
      onChange?.(undefined);
      return;
    }

    if (maxDate && normalizeDate(date) > normalizeDate(maxDate)) {
      setValidationMessage(`Date must be on or before ${toIsoDate(maxDate)}.`);
      onChange?.(undefined);
      return;
    }

    setValidationMessage("");
    onChange?.(toIsoDate(date));
  };

  const updateDay = (nextValue: string) => {
    const nextDay = nextValue.replace(/\D/g, "").slice(0, 2);
    setDay(nextDay);
    validate(nextDay, month, year);
    if (nextDay.length === 2) monthRef.current?.focus();
  };

  const updateMonth = (nextValue: string) => {
    const nextMonth = nextValue.replace(/\D/g, "").slice(0, 2);
    setMonth(nextMonth);
    validate(day, nextMonth, year);
    if (nextMonth.length === 2) yearRef.current?.focus();
  };

  const updateYear = (nextValue: string) => {
    const nextYear = nextValue.replace(/\D/g, "").slice(0, 4);
    setYear(nextYear);
    validate(day, month, nextYear);
  };

  const clear = () => {
    setDay("");
    setMonth("");
    setYear("");
    setValidationMessage("");
    onChange?.(undefined);
    dayRef.current?.focus();
  };

  const openCalendar = () => {
    const input = nativeInputRef.current;
    if (!input || disabled) return;

    if ("showPicker" in input) {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={pickerId}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          {label}
          {required && <span className="text-red-400"> *</span>}
          {showOptional && (
            <span className="ml-1 text-slate-300">(optional)</span>
          )}
        </label>
      )}

      <div
        id={pickerId}
        className={`relative flex min-h-10 items-center gap-1.5 rounded-xl border bg-white px-3 text-sm text-slate-700 focus-within:border-slate-400 ${
          validationMessage ? "border-red-300" : "border-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${inputClassName}`}
      >
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          aria-label="Day"
          placeholder="DD"
          value={day}
          disabled={disabled}
          onChange={(event) => updateDay(event.target.value)}
          className="w-6 bg-transparent text-center outline-none"
        />
        <span className="text-slate-300">/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          aria-label="Month"
          placeholder="MM"
          value={month}
          disabled={disabled}
          onChange={(event) => updateMonth(event.target.value)}
          className="w-7 bg-transparent text-center outline-none"
        />
        <span className="text-slate-300">/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          aria-label="Year"
          placeholder="YYYY"
          value={year}
          disabled={disabled}
          onChange={(event) => updateYear(event.target.value)}
          className="w-11 bg-transparent text-center outline-none"
        />

        <div className="ml-auto flex items-center gap-1">
          {(day || month || year) && (
            <button
              type="button"
              aria-label="Clear date"
              disabled={disabled}
              onClick={clear}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon icon="hugeicons:cancel-01" className="text-sm" />
            </button>
          )}
          <button
            type="button"
            aria-label="Open calendar"
            disabled={disabled}
            onClick={openCalendar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-primary"
          >
            <Icon icon="hugeicons:calendar-03" className="text-base" />
          </button>
        </div>

        <input
          ref={nativeInputRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={value ?? ""}
          min={minDate ? toIsoDate(minDate) : undefined}
          max={maxDate ? toIsoDate(maxDate) : undefined}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value || undefined)}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      </div>

      {(validationMessage || description) && (
        <p
          className={`mt-1 px-1 text-xs ${
            validationMessage ? "text-red-500" : "text-slate-400"
          }`}
        >
          {validationMessage || description}
        </p>
      )}
    </div>
  );
}
