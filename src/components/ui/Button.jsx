import React from 'react';

export function Button({
    children,
    variant = 'primary',
    className = '',
    icon: Icon,
    isLoading,
    ...props
}) {
    const baseClass = variant === 'icon' ? 'btn-icon' : `btn btn-${variant}`;

    return (
        <button className={`${baseClass} ${className}`} disabled={isLoading} {...props}>
            {isLoading ? (
                <span className="animate-spin">⌛</span> // Simple spinner placeholder
            ) : Icon ? (
                <Icon size={18} />
            ) : null}
            {children}
        </button>
    );
}
