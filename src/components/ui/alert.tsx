import * as React from "react";
import {
  Alert as ChakraAlert,
  AlertIcon,
  AlertTitle as ChakraAlertTitle,
  AlertDescription as ChakraAlertDescription,
  AlertProps as ChakraAlertProps,
  AlertTitleProps as ChakraAlertTitleProps,
  AlertDescriptionProps as ChakraAlertDescriptionProps,
} from "@chakra-ui/react";
import { cn } from "@/lib/utils";

type OriginalVariant = "default" | "destructive";

export interface AlertProps extends Omit<ChakraAlertProps, "status" | "variant"> {
  variant?: OriginalVariant;
  children?: React.ReactNode;
  className?: string;
  chakraVariant?: ChakraAlertProps["variant"]; // To pass Chakra's own variant like "subtle", "solid"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, chakraVariant, ...props }, ref) => {
    let status: ChakraAlertProps["status"];

    switch (variant) {
      case "destructive":
        status = "error";
        break;
      case "default":
      default:
        status = "info";
        break;
    }

    return (
      <ChakraAlert
        ref={ref}
        status={status}
        variant={chakraVariant || "subtle"}
        className={cn(className)}
        {...props}
      >
        <AlertIcon />
        {/* Children typically include AlertTitle and AlertDescription */}
        {/* Chakra v2 Alert doesn't have Alert.Content, children are direct */}
        {children}
      </ChakraAlert>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & ChakraAlertTitleProps
>(({ className, children, ...props }, ref) => (
  <ChakraAlertTitle
    ref={ref}
    className={cn("font-medium", className)} // Original had "font-medium leading-none tracking-tight"
    {...props}
  >
    {children}
  </ChakraAlertTitle>
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement, // ChakraAlertDescription renders a div
  React.HTMLAttributes<HTMLParagraphElement> & ChakraAlertDescriptionProps
>(({ className, children, ...props }, ref) => (
  <ChakraAlertDescription
    ref={ref}
    className={cn("text-sm", className)} // Original had "text-sm [&_p]:leading-relaxed"
    {...props}
  >
    {children}
  </ChakraAlertDescription>
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
