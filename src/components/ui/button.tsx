import * as React from "react";
import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  IconButton as ChakraIconButton, // For true icon buttons
} from "@chakra-ui/react";
import { As } from "@chakra-ui/system"; // Reverted to @chakra-ui/system

// Define the variant and size types based on the original component
type OriginalVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type OriginalSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends Omit<ChakraButtonProps, "variant" | "size" | "as"> {
  variant?: OriginalVariant;
  size?: OriginalSize;
  asChild?: boolean;
  children?: React.ReactNode;
  // Explicitly include className as it's a common HTML attribute and was used in the original
  className?: string; 
  // Allow any other HTML button attributes
  [key: string]: any;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      asChild = false,
      children,
      className,
      ...props // Spread remaining props
    },
    ref
  ) => {
    const chakraSpecificProps: Partial<ChakraButtonProps> = {};

    // Map original variants to Chakra variants and colorSchemes
    switch (variant) {
      case "default":
        chakraSpecificProps.variant = "solid";
        // This would ideally map to a theme color like 'primary'
        // For now, using a common default.
        chakraSpecificProps.colorScheme = "blue";
        break;
      case "destructive":
        chakraSpecificProps.variant = "solid";
        chakraSpecificProps.colorScheme = "red";
        break;
      case "outline":
        chakraSpecificProps.variant = "outline";
        // For outline, colorScheme often defines the border and text color on hover/active
        // If 'input' was a specific color, it might need mapping here or in theme.
        // Default outline will use theme's default colorScheme or a gray.
        break;
      case "secondary":
        // 'secondary' often maps to a less prominent solid button or a subtle variant.
        // Chakra's 'gray' colorScheme with 'solid' or 'subtle' variant can work.
        chakraSpecificProps.variant = "solid"; 
        chakraSpecificProps.colorScheme = "gray";
        break;
      case "ghost":
        chakraSpecificProps.variant = "ghost";
        break;
      case "link":
        chakraSpecificProps.variant = "link";
        break;
      default:
        chakraSpecificProps.variant = "solid";
    }

    // Map original sizes to Chakra sizes
    // Note: Chakra's IconButton might be more semantically correct for "icon" type,
    // but here we adapt the existing Button for it.
    let isIconOnlyButton = size === "icon";

    switch (size) {
      case "default":
        chakraSpecificProps.size = "md";
        break;
      case "sm":
        chakraSpecificProps.size = "sm";
        break;
      case "lg":
        chakraSpecificProps.size = "lg";
        break;
      case "icon":
        chakraSpecificProps.size = "md"; // Chakra 'md' has h=10 (2.5rem)
        // For icon-only buttons, ensure padding is minimal if not using ChakraIconButton
        // and width/height are set.
        // If children is a single icon, ChakraButton might handle padding well.
        // The original had h-10 w-10. Chakra 'md' is h-10.
        // We'll apply width and ensure children are centered.
        props.style = { ...props.style, width: "2.5rem", height: "2.5rem" };
        // If it's truly an icon button with no text, aria-label is important.
        if (!children && !props["aria-label"]) {
          console.warn("Button: size='icon' used without children or aria-label. Please provide an aria-label for accessibility.");
        }
        break;
      default:
        chakraSpecificProps.size = "md";
    }

    // Handle asChild:
    // If asChild is true, the Button should take the form of its child.
    // Chakra's 'as' prop is used for this.
    if (asChild) {
      if (React.isValidElement(children)) {
        const child = children as React.ReactElement<any, As>; // Removed <any> from As
        
        // Merge props: child's props take precedence for things like 'onClick',
        // but our mapped variant/size (via chakraSpecificProps) and className should be applied.
        // Chakra's 'as' prop will render the child component with the Button's styles and behaviors.
        return (
          <ChakraButton
            ref={ref}
            as={child.type as As} // Removed <any> from As
            {...chakraSpecificProps} // Mapped styles
            {...props} // Other original props (e.g., onClick from usage)
            {...child.props} // Props from the child itself
            className={cn(props.className, child.props.className, className)} // Combine classNames
          >
            {child.props.children}
          </ChakraButton>
        );
      } else {
        console.warn("Button: asChild was true but children was not a single ReactElement.");
        // Fallback to rendering a normal button if asChild is misused.
        return (
          <ChakraButton
            ref={ref}
            {...chakraSpecificProps}
            {...props}
            className={className}
          >
            {children}
          </ChakraButton>
        );
      }
    }
    
    // If it's an "icon" size and we are not using asChild,
    // and if we want to strictly use ChakraIconButton for icon-only:
    // This part is tricky if children can be an Icon component or text.
    // The original `buttonVariants` just set height and width.
    // If `isIconOnlyButton` and children is a single icon, ChakraButton can work,
    // but ChakraIconButton is more semantic.
    // For simplicity and direct replacement of the previous behavior, we'll stick to styling ChakraButton.
    // The `props.style` for width/height under 'icon' size case handles this.

    return (
      <ChakraButton
        ref={ref}
        {...chakraSpecificProps}
        {...props} // Pass down all other props
        className={className}
      >
        {children}
      </ChakraButton>
    );
  }
);
Button.displayName = "Button";

// cn utility for merging classNames (useful if asChild passes className)
// This is a simplified version. A more robust one handles various falsy values.
const cn = (...classes: (string | undefined | null)[]) => {
  return classes.filter(Boolean).join(" ");
};


// The `buttonVariants` cva function is specific to class-variance-authority and Tailwind.
// Since we are using Chakra UI, its own variant and styling system replaces `buttonVariants`.
// Thus, `buttonVariants` is no longer exported.
export { Button };

// General Notes on Styling and Behavior:
// 1. Base Styles: The original `buttonVariants` cva function included several base Tailwind classes:
//    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium 
//    ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
//    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
//    disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
//    - Chakra UI's Button component comes with its own comprehensive base styles that cover most of these
//      (flex layout, centering, focus rings, disabled states, transitions).
//    - `gap-2`: Chakra's Button handles spacing between `leftIcon`, `rightIcon`, and `children` automatically.
//      If you pass an Icon component as a direct child along with text, you might need to use `<HStack spacing="2">`
//      inside the button or ensure the icon has appropriate margins.
//    - `[&_svg]:size-4`: Chakra's icons (e.g., from `@chakra-ui/icons` or if you use `boxSize` prop on your own SVG)
//      can be sized. If you pass raw SVG, you might need to ensure it's sized `1rem` (for size-4) or use Chakra's
//      `Icon` wrapper. For "icon" size buttons, the icon should ideally fill the space or be sized appropriately.
//    - `font-medium`, `text-sm`, `rounded-md`: These are generally controlled by Chakra's theme and size props.
//      The default theme uses `font-medium` for buttons. `text-sm` corresponds to `size="sm"` or `size="md"` in Chakra.
//      `rounded-md` is the default radius for many Chakra components.
//
// 2. Custom Theme: For a perfect match with "primary", "secondary", "destructive" colors defined in Tailwind's theme,
//    you would typically extend the Chakra UI theme:
//    - Define these colors in `theme.colors`.
//    - Potentially create custom `colorScheme`s or adjust existing ones (`blue`, `red`, `gray`) to use these colors.
//    - For variants like "outline" that used `border-input bg-background hover:bg-accent hover:text-accent-foreground`,
//      you might need to customize the `Button` component's theme for the `outline` variant to match these specific colors.
//
// 3. `IconButton`: For the `size="icon"` case, especially if the button *only* contains an icon and no text,
//    using `<ChakraIconButton icon={<YourIcon />} />` is often more appropriate. It's designed for that purpose
//    and handles accessibility (e.g., requiring `aria-label`). My implementation attempts to make the ChakraButton
//    square for `size="icon"` but using `ChakraIconButton` where appropriate in the consuming code would be a good practice.
//
// 4. `cn` function: Added a simple `cn` for the `asChild` case to merge classNames. If `tailwindcss-merge` features
//    were heavily relied upon, a more robust `cn` would be needed, or ensure class conflicts are handled.
//    Chakra generally discourages heavy use of external `className` for styling its components, preferring props or theme.
//
// This implementation prioritizes using Chakra UI's props and conventions while mapping from the original component's API.
// The `buttonVariants` export is removed as Chakra's system supersedes it.
// The `asChild` functionality is mapped to Chakra's `as` prop.
