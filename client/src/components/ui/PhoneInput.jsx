import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  COUNTRY_CODE_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  joinPhone,
  maxNationalDigits,
  onlyDigits,
  splitPhone,
} from '@/lib/phone';
import Input from './Input';
import Select from './Select';

/**
 * Phone field with a country-code picker (India +91 by default) and a digits-only number box.
 * The value is a single string such as `+919876543210` (empty when no number is typed), so it works
 * with react-hook-form `Controller` (`value`, `onChange`, `onBlur`) and with the server as-is.
 */
export default function PhoneInput({ id, value = '', onChange, onBlur, name, error, hasHint, disabled, className }) {
  const parsed = splitPhone(value);
  // With an empty number the value carries no code, so the chosen code is kept here.
  const [pickedCode, setPickedCode] = useState(parsed.code);
  const code = parsed.number ? parsed.code : pickedCode;
  const maxDigits = maxNationalDigits(code);
  const isDefaultCountry = code === DEFAULT_COUNTRY_CODE;

  const handleCodeChange = (event) => {
    setPickedCode(event.target.value);
    onChange(joinPhone(event.target.value, parsed.number.slice(0, maxNationalDigits(event.target.value))));
  };

  const handleNumberChange = (event) => {
    onChange(joinPhone(code, onlyDigits(event.target.value).slice(0, maxDigits)));
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Select
        id={`${id}-country`}
        aria-label="Country code"
        options={COUNTRY_CODE_OPTIONS}
        value={code}
        onChange={handleCodeChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-[7.5rem] shrink-0 sm:w-36"
      />
      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={isDefaultCountry ? '98765 43210' : 'Phone number'}
        value={parsed.number}
        onChange={handleNumberChange}
        onBlur={onBlur}
        disabled={disabled}
        error={error}
        hasHint={hasHint}
        className="min-w-0 flex-1"
      />
    </div>
  );
}
