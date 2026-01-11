import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"


interface TimePickerProps {
    time: string
    onChange: (time: string) => void
    className?: string
}

export function TimePicker({ time, onChange, className }: TimePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse current time
    const [hours, minutes] = time ? time.split(':').map(Number) : [null, null]

    // Generate options
    const hourOptions = Array.from({ length: 24 }, (_, i) => i)
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

    const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
        let newHours = hours || 0
        let newMinutes = minutes || 0

        if (type === 'hour') {
            newHours = value
        } else {
            newMinutes = value
        }

        const formattedTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
        onChange(formattedTime)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"ghost"}
                    className={cn(
                        "justify-start text-left font-medium p-2 text-base h-auto hover:bg-white/5 hover:text-white transition-all duration-200",
                        "hover:pl-4 hover:pr-4",
                        "focus:outline-none focus:ring-0 focus:border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                        !time && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    {time ? (
                        <span>{time}</span>
                    ) : (
                        <span>--:--</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-[#1a1a1a] border-white/10 shadow-2xl rounded-xl text-white overflow-hidden"
                align="start"
                onWheel={(e) => e.stopPropagation()}
            >
                <div className="flex h-[300px] divide-x divide-white/10">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center h-10 text-xs text-muted-foreground font-medium border-b border-white/5 bg-[#252525] shrink-0">
                            Hours
                        </div>
                        <div className="h-[260px] w-[70px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="p-1">
                                {hourOptions.map((hour) => (
                                    <Button
                                        key={hour}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full justify-center font-normal h-8 mb-1 last:mb-0",
                                            hours === hour ? "bg-[#304D73] text-white hover:bg-[#304D73]/90 hover:text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/10"
                                        )}
                                        onClick={() => handleTimeChange('hour', hour)}
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center h-10 text-xs text-muted-foreground font-medium border-b border-white/5 bg-[#252525] shrink-0">
                            Minutes
                        </div>
                        <div className="h-[260px] w-[70px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="p-1">
                                {minuteOptions.map((minute) => (
                                    <Button
                                        key={minute}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full justify-center font-normal h-8 mb-1 last:mb-0",
                                            minutes === minute ? "bg-[#304D73] text-white hover:bg-[#304D73]/90 hover:text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/10"
                                        )}
                                        onClick={() => handleTimeChange('minute', minute)}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
