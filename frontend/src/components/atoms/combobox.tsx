"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/atoms/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/atoms/popover"

interface Props {
    title?: string
    data: { value: string, label: string }[]
    defaultValue?: { value: string, label: string }
    value?: string
    buttonClassName?: string
    contentClassName?: string
    placeholder: string
    buttonStyles?: React.CSSProperties
    onValueChange?: (value: string) => void
    onSearch?: (value: string) => void
    isLoading?: boolean
    customTitleBeforeSearch?: string
}

export function Combobox({
    isLoading,
    title,
    data,
    defaultValue,
    value: controlledValue,
    buttonClassName,
    contentClassName,
    placeholder,
    buttonStyles,
    onValueChange,
    onSearch,
    customTitleBeforeSearch = "No Data found."
}: Props) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(controlledValue ?? defaultValue?.value ?? "")
    const [searched, setIsSearched] = React.useState(false)

    // Update internal state when controlled value changes
    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue)
        }
    }, [controlledValue])

    // Find the label for the current value
    const selectedItem = data.find(d => d.value === value)
    const displayText = selectedItem ? selectedItem.label : (title || "Select...")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between lg:placeholder:text-xs", buttonClassName)}
                    style={buttonStyles}
                >
                    {displayText}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0", contentClassName)}>
                <Command>
                    <CommandInput
                        onValueChange={(v) => {
                            onSearch?.(v);
                            setIsSearched(true)
                        }}
                        placeholder={placeholder}
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? "Loading..." : !searched ? customTitleBeforeSearch : "No Data found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {data.map((d) => (
                                <CommandItem
                                    key={d.value}
                                    value={d.label}
                                    onSelect={() => {
                                        setValue(d.value)
                                        setOpen(false)
                                        onValueChange?.(d.value)
                                    }}
                                >
                                    {d.label}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === d.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}