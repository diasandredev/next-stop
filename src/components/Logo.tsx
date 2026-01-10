import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface LogoProps {
    className?: string; // Additional classes for the container
    textClassName?: string; // Additional classes for the text
    showIcon?: boolean; // Whether to show the icon alongside the text
    showText?: boolean; // Whether to show the text
    iconSize?: number; // Size of the icon
    variant?: 'default' | 'large' | 'small'; // Variants for sizing
}

export const Logo = ({
    className,
    textClassName,
    showIcon = true,
    showText = true,
    iconSize = 24,
    variant = 'default'
}: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {showIcon && (
                <div className="flex items-center justify-center bg-primary rounded-lg p-1">
                    <MapPin
                        size={iconSize}
                        className="text-primary-foreground"
                        strokeWidth={2.5}
                    />
                </div>
            )}
            {showText && (
                <span
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                    className={cn(
                        "font-bold tracking-tight text-foreground uppercase",
                        variant === 'large' && "text-3xl",
                        variant === 'default' && "text-xl",
                        variant === 'small' && "text-lg",
                        textClassName
                    )}
                >
                    Next Stop
                </span>
            )}
        </div>
    );
};
