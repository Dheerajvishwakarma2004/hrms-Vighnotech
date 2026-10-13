import { forwardRef } from 'react';
import { describedBy, fieldClassName } from './fieldStyles';

/** Multi-line text input compatible with `register`. */
const Textarea = forwardRef(function Textarea({ id, rows = 3, error, hasHint, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, { error, hint: hasHint })}
      className={fieldClassName({ error, className: ['min-h-[5rem] resize-y px-3 py-2', className] })}
      {...props}
    />
  );
});

export default Textarea;
