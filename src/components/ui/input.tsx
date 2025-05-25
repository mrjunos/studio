import * as React from "react";
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
} from "@chakra-ui/react";
import { cn } from "@/lib/utils";

// We can extend ChakraInputProps if we need to add custom props later,
// or Omit some Chakra props if we want to hide them.
// For now, let's define our props to be closely aligned with ChakraInputProps,
// ensuring compatibility with React.InputHTMLAttributes.
// ChakraInputProps already includes most HTML input attributes.
// Explicitly include 'disabled' for compatibility if users are passing it,
// and we will map it to 'isDisabled'.
export interface InputProps extends Omit<ChakraInputProps, 'disabled'> {
  disabled?: boolean;
  // className is already part of ChakraInputProps (via ChakraComponent common props)
  // type is also part of ChakraInputProps
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, disabled, isDisabled: explicitIsDisabled, ...props }, ref) => {
    // Original Tailwind classes for reference:
    // "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base 
    //  ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    //  file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none 
    //  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
    //  disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

    // Most of these styles are handled by Chakra's Input component by default
    // through its theme (e.g., size="md" for h-10, variant="outline" for border).
    // - h-10: Chakra's size="md" (default) is 40px.
    // - w-full: Chakra Input takes full width of its container by default.
    // - rounded-md: Default for Chakra Input.
    // - border border-input bg-background: Chakra's variant="outline" (default) with theme colors.
    // - px-3 py-2: Chakra's size="md" has appropriate padding.
    // - text-base / md:text-sm: Chakra's Input font size is themed.
    // - ring-offset-background, focus-visible:*: Chakra has focusBorderColor.
    // - disabled:*: Chakra handles disabled styles.
    // - placeholder:text-muted-foreground: Chakra themes placeholder via _placeholder.
    // - file:*: Styling for type="file". Chakra's Input has some default styling for this.
    //   If precise matching of the original file input style is needed,
    //   it might require specific theming for `Input[type=file]` in the Chakra theme.
    //   For this component, we'll rely on Chakra's default file input styling.

    // Prioritize explicit isDisabled prop, otherwise use mapped disabled prop.
    const finalIsDisabled = explicitIsDisabled !== undefined ? explicitIsDisabled : disabled;

    return (
      <ChakraInput
        ref={ref}
        type={type}
        className={cn(className)} // Allow users to pass additional Tailwind classes
        isDisabled={finalIsDisabled}
        // Default Chakra variant is 'outline', size is 'md'.
        // These usually provide a good base that's similar to the original component.
        // If specific overrides are needed for all instances of this Input,
        // they could be applied here (e.g., variant="filled") or through Chakra theme.
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
