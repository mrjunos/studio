import React from 'react';

export function Input({ label, error, className = '', ...props }) {
    return (
        <div className={`form-group ${className}`} style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'hsl(var(--color-text-muted))'
                }}>
                    {label}
                </label>
            )}
            <input className="input" {...props} />
            {error && (
                <span style={{ color: 'hsl(var(--color-danger))', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {error}
                </span>
            )}
        </div>
    );
}
