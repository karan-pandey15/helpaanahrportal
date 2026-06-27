import Icon from "@/components/ui/Icon";

// Visual marker shown next to a candidate wherever they appear (lists, cards,
// detail) when they have an OPEN reschedule/cancel request submitted from their
// interview email. Driven by `interview.pendingRequestType` from the API
// ("reschedule" | "cancel" | null/undefined → nothing rendered).

const VARIANTS = {
  reschedule: {
    label: "Reschedule requested",
    short: "Reschedule",
    icon: "heroicons:calendar-days",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  cancel: {
    label: "Cancellation requested",
    short: "Cancel",
    icon: "heroicons:x-circle",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

const RequestBadge = ({ type, compact = false, className = "" }) => {
  const variant = VARIANTS[type];
  if (!variant) return null;

  // Icon-only pill for tight spaces (table cells); full label otherwise.
  if (compact) {
    return (
      <span
        title={variant.label}
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full align-middle ${variant.className} ${className}`}
      >
        <Icon icon={variant.icon} className="text-[12px]" />
      </span>
    );
  }

  return (
    <span
      title={variant.label}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none align-middle ${variant.className} ${className}`}
    >
      <Icon icon={variant.icon} className="text-[12px]" />
      {variant.short}
    </span>
  );
};

export default RequestBadge;
