import { cn } from '@/lib/utils';
// import { MapPin } from 'lucide-react'; // Removed MapPin

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
    iconSize = 32,
    variant = 'default'
}: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {showIcon && (
                <img 
                    src="/logo.png" 
                    alt="Next Stop" 
                    style={{ width: iconSize, height: iconSize }} 
                    className="rounded-lg object-contain"
                />
            )}
            {showText && (
                <span
                    style={{ fontFamily: "'Pacifico', cursive" }}
                    className={cn(
                        "font-normal tracking-wide bg-gradient-to-r from-[#FFBA08] via-[#E85D04] to-[#DC2F02] bg-clip-text text-transparent pb-1",
                        variant === 'large' && "text-4xl",
                        variant === 'default' && "text-2xl",
                        variant === 'small' && "text-xl",
                        textClassName
                    )}
                >
                    Next Stop
                </span>
            )}
        </div>
    );
};
