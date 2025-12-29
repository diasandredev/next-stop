import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"ghost"}
                    className={cn(
                        "w-full justify-start text-left font-medium p-2 text-base h-auto hover:bg-transparent hover:text-black/80",
                        !date && "text-black/30",
                        className
                    )}
                >
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#E8E1F5] border-none shadow-2xl rounded-2xl text-black" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3"
                    classNames={{
                        head_cell: "text-black/50 rounded-md w-9 font-normal text-[0.8rem]",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/50 rounded-md transition-colors text-black",
                        day_selected: "bg-[#Bfb6d3] text-white hover:bg-[#Bfb6d3]/90 focus:bg-[#Bfb6d3] focus:text-white rounded-md",
                        day_today: "bg-white/30 text-black font-semibold",
                        day_outside: "text-black/30 opacity-50",
                        day_disabled: "text-black/30 opacity-50",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-white/50 rounded-md text-black border-black/10 border",
                        caption: "flex justify-center pt-1 relative items-center text-black font-bold",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
