import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { DayPickerRangeProps } from "react-day-picker"

interface DateRangePickerProps extends Omit<DayPickerRangeProps, "mode" | "selected" | "onSelect"> {
    date?: DateRange
    setDate: (date?: DateRange) => void
    className?: string
}

export function DateRangePicker({
    date,
    setDate,
    className,
    ...props
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"ghost"}
                        className={cn(
                            "w-full justify-start text-left font-medium p-2 text-base h-auto hover:bg-transparent hover:text-white",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-white/10 shadow-2xl rounded-2xl text-white" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        className="p-3"
                        classNames={{
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md transition-colors text-white",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground rounded-md",
                            day_today: "bg-white/10 text-white font-semibold",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-white/10 rounded-md text-white border-white/10 border",
                            caption: "flex justify-center pt-1 relative items-center text-white font-bold",
                        }}
                        {...props}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
