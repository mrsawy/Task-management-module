"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/atoms/button"
import { Calendar } from "@/components/atoms/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/atoms/popover"

export function DatePicker({ defaultValue, onChange }: { defaultValue?: Date, onChange?: (date: Date) => void }) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(defaultValue)

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal"
                    >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        required={true}
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(date: Date) => {
                            setDate(date)
                            setOpen(false)
                            onChange?.(date)
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
