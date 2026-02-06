"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SelectDropdown({
  options = [],
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  disabled = false,
  className
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  const selectedOption = options.find(opt => opt.value === selectedValue)

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    onValueChange?.(optionValue)
    setIsOpen(false)
  }

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(
          selectedOption ? "text-foreground" : "text-foreground/70"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-foreground/70 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div 
            className="fixed inset-0 z-10"
            onMouseDown={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-input bg-background shadow-lg">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-foreground/70">
                Aucune option disponible
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedValue === option.value
                const isDisabled = Boolean(option.disabled)

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      "focus:outline-none",
                      isDisabled
                        ? "cursor-not-allowed text-foreground/40"
                        : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      isSelected && !isDisabled && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="flex flex-col gap-1">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-foreground/60">{option.description}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Composants compatibles Radix UI pour la page integrations
const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>({})

interface RadixSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function SelectRoot({ value, onValueChange, children }: RadixSelectProps) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, onOpenChange: setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const { open, onOpenChange } = React.useContext(SelectContext)
  
  return (
    <button
      type="button"
      onClick={() => onOpenChange?.(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open, onOpenChange } = React.useContext(SelectContext)
  
  if (!open) return null
  
  return (
    <>
      <div 
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
        {children}
      </div>
    </>
  )
}

export function SelectItem({ 
  value, 
  children 
}: { 
  value: string
  children: React.ReactNode 
}) {
  const { value: selectedValue, onValueChange, onOpenChange } = React.useContext(SelectContext)
  
  return (
    <div
      onClick={() => {
        onValueChange?.(value)
        onOpenChange?.(false)
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        selectedValue === value && "bg-accent text-accent-foreground"
      )}
    >
      {selectedValue === value && (
        <Check className="absolute left-2 h-3.5 w-3.5" />
      )}
      {children}
    </div>
  )
}

// Export des composants Radix UI compatibles
export { SelectRoot as Select }
