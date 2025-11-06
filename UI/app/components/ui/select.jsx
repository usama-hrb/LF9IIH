import * as React from "react";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={`flex h-10 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm font-cairo ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#027E01] focus-visible:ring-offset-2 focus-visible:border-[#027E01] disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export { Select };
