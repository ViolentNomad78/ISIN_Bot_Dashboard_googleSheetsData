import React, { useState } from 'react';
import { Icons } from '../Icons';

export const Logo = ({ className = "h-16 w-16" }: { className?: string }) => {
    const [error, setError] = useState(false);
    
    if (error) {
        return (
            <div className={`${className} p-1`}>
                <Icons.Knot />
            </div>
        );
    }

    return (
        <img 
            src="Icon.png" 
            alt="Monopoli Meier & Son's" 
            className={`${className} object-contain`}
            onError={() => setError(true)}
        />
    );
};
