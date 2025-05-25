import * as React from "react";
import {
  Card as ChakraCard,
  CardHeader as ChakraCardHeader,
  CardBody as ChakraCardBody,
  CardFooter as ChakraCardFooter,
  CardProps as ChakraCardProps,
  CardHeaderProps as ChakraCardHeaderProps,
  CardBodyProps as ChakraCardBodyProps,
  CardFooterProps as ChakraCardFooterProps,
  Heading, // For CardTitle
  Text,    // For CardDescription
  HeadingProps,
  TextProps,
} from "@chakra-ui/react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, ChakraCardProps>(
  ({ className, ...props }, ref) => (
    <ChakraCard
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, ChakraCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <ChakraCardHeader
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  HeadingProps // Use Chakra's HeadingProps
>(({ className, children, ...props }, ref) => (
  <Heading
    ref={ref}
    // Original Tailwind: "text-2xl font-semibold leading-none tracking-tight"
    // Apply font-semibold, allow users to control size via `size` prop on Heading or className
    className={cn("font-semibold", className)}
    // Users can pass size="lg", "xl", etc. or specific text-2xl via className.
    // Default Chakra Heading size might be different.
    {...props}
  >
    {children}
  </Heading>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement, // Text component can render as <p>
  TextProps // Use Chakra's TextProps
>(({ className, children, ...props }, ref) => (
  <Text
    ref={ref}
    // Original Tailwind: "text-sm text-muted-foreground"
    // Apply text-sm. "text-muted-foreground" can be achieved by Chakra's theme or color prop.
    className={cn("text-sm", className)}
    // Users can pass color="gray.500" or similar for muted text.
    {...props}
  >
    {children}
  </Text>
));
CardDescription.displayName = "CardDescription";

// CardContent was the original name, mapping to ChakraCardBody
const CardContent = React.forwardRef<HTMLDivElement, ChakraCardBodyProps>(
  ({ className, ...props }, ref) => (
    <ChakraCardBody
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, ChakraCardFooterProps>(
  ({ className, ...props }, ref) => (
    <ChakraCardFooter
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
