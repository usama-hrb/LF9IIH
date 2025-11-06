import * as React from "react";

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 w-full max-w-lg mx-4">{children}</div>
    </div>
  );
};

const DialogContent = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className = "", children, ...props }) => (
  <div
    className={`flex flex-col space-y-2 text-center sm:text-right ${className}`}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle = ({ className = "", children, ...props }) => (
  <h2
    className={`text-lg sm:text-xl font-bold font-cairo text-[#243048] ${className}`}
    {...props}
  >
    {children}
  </h2>
);

const DialogDescription = ({ className = "", children, ...props }) => (
  <p className={`text-sm text-gray-600 font-cairo ${className}`} {...props}>
    {children}
  </p>
);

const DialogFooter = ({ className = "", children, ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 mt-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
