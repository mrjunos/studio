import React from 'react';

export function Card({ children, className = '', ...props }) {
    return (
        <div className={`glass-card ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ title, description, action }) {
    return (
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
                {title && <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{title}</h3>}
                {description && <p style={{ fontSize: '0.875rem' }}>{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
