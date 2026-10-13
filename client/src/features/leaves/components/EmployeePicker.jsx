import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { fieldClassName, describedBy } from "@/components/ui/fieldStyles";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { useSearchLeaveEmployeesQuery } from "../leavesApi";

const RESULT_LIMIT = 20;

/**
 * Searchable async combobox for choosing an active employee (WAI-ARIA combobox pattern).
 * Controlled with the selected employee object so the label is known without an extra request;
 * use with react-hook-form `Controller`.
 *
 * @param {{ _id: string, fullName: string, position?: string, department?: string } | null} value
 * @param {(employee: object | null) => void} onChange
 */
const EmployeePicker = forwardRef(function EmployeePicker(
  {
    id,
    value,
    onChange,
    onBlur,
    error,
    hasHint,
    disabled = false,
    placeholder = "Search employees by name…",
  },
  ref,
) {
  const listboxId = useId();
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const search = useDebounce(query.trim());

  const {
    data: employees = [],
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useSearchLeaveEmployeesQuery(
    { search, limit: RESULT_LIMIT },
    { skip: !open },
  );

  const pendingSearch = query.trim() !== search;
  const loading = isFetching || pendingSearch;

  // Keep the highlighted option in view while navigating with the keyboard.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Close when the user clicks or taps outside the component.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(0);
  };

  const select = (employee) => {
    onChange(employee);
    setQuery("");
    setOpen(false);
    onBlur?.();
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    onBlur?.();
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else
          setActiveIndex((index) =>
            Math.min(index + 1, Math.max(employees.length - 1, 0)),
          );
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter":
        if (open && employees[activeIndex]) {
          event.preventDefault();
          select(employees[activeIndex]);
        }
        break;
      case "Escape":
        if (open) {
          // Close only the list, not the surrounding modal.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    open && employees[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <div
          className={cn(
            fieldClassName({ error }),
            "flex min-h-10 items-center gap-3 px-3 py-1.5",
            disabled && "bg-slate-50",
          )}
        >
          <Avatar name={value.fullName} size="xs" />
          <button
            ref={ref}
            id={id}
            type="button"
            disabled={disabled}
            onClick={openList}
            aria-describedby={describedBy(id, { error, hint: hasHint })}
            aria-label={`Employee: ${value.fullName}. Change employee`}
            className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span className="block truncate text-sm font-medium text-slate-900">
              {value.fullName}
            </span>
            {(value.position || value.department) && (
              <span className="block truncate text-xs text-slate-500">
                {[value.position, value.department].filter(Boolean).join(" · ")}
              </span>
            )}
          </button>
          {!disabled && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear selected employee"
              className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={ref}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            autoFocus={Boolean(value)}
            disabled={disabled}
            value={query}
            placeholder={value ? value.fullName : placeholder}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { error, hint: hasHint })}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (!open) setOpen(true);
            }}
            onClick={() => !open && openList()}
            onBlur={() => onBlur?.()}
            onKeyDown={onKeyDown}
            className={fieldClassName({ error, className: "h-10 pl-9 pr-9" })}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {open && loading ? (
              <Spinner size="xs" label="Searching employees" />
            ) : (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
        </div>
      )}

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Employees"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-popover"
        >
          {isError && !loading && (
            <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm text-rose-600">
              <span>{getErrorMessage(queryError)}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded font-medium text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Retry
              </button>
            </li>
          )}
          {!isError && employees.length === 0 && (
            <li className="px-3 py-3 text-sm text-slate-500">
              {loading
                ? "Searching…"
                : search
                  ? `No active employees match “${search}”`
                  : "No active employees found"}
            </li>
          )}
          {!isError &&
            employees.map((employee, index) => {
              const selected = value?._id === employee._id;
              return (
                <li
                  key={employee._id}
                  id={`${listboxId}-option-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => select(employee)}
                  onMouseMove={() =>
                    index !== activeIndex && setActiveIndex(index)
                  }
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2",
                    index === activeIndex ? "bg-primary-50" : "bg-white",
                  )}
                >
                  <Avatar name={employee.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        selected
                          ? "font-semibold text-primary-700"
                          : "font-medium text-slate-900",
                      )}
                    >
                      {employee.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {[employee.position, employee.department]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </li>
              );
            })}
          {!isError && employees.length === RESULT_LIMIT && (
            <li className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
              Showing the first {RESULT_LIMIT} matches — keep typing to narrow
              down.
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

export default EmployeePicker;
