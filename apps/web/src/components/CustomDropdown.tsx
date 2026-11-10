import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption<T extends string = string> {
  value: T
  label: string
  desc?: string
}

export interface CustomDropdownProps<T extends string = string> {
  value: T | undefined
  onChange: (value: T) => void
  options: (DropdownOption<T> | string)[]
  placeholder?: string
  id?: string
  name?: string
  disabled?: boolean
  error?: string
  className?: string
  ariaLabel?: string
}

export function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  id,
  name,
  disabled = false,
  error,
  className = '',
  ariaLabel,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  // Normalize options to DropdownOption objects
  const normalizedOptions: DropdownOption<T>[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt as T, label: opt } : opt
  )

  const selectedOption = normalizedOptions.find(o => o.value === value)

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll<HTMLLIElement>('[role="option"]')
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const toggleDropdown = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (disabled) return
    if (!isOpen) {
      const selectedIdx = normalizedOptions.findIndex(o => o.value === value)
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0)
    }
    setIsOpen(prev => !prev)
  }

  const selectOption = (optValue: T, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsOpen(false)
    onChange(optValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex(prev => (prev < normalizedOptions.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(normalizedOptions.length - 1)
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : normalizedOptions.length - 1))
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && normalizedOptions[highlightedIndex]) {
        selectOption(normalizedOptions[highlightedIndex].value)
      } else {
        toggleDropdown()
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    } else if (e.key === 'Tab') {
      if (isOpen) {
        setIsOpen(false)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${error ? 'has-error' : ''} ${className}`}
    >
      {/* Hidden native input for form compatibility */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      <button
        type="button"
        id={id}
        className="custom-dropdown-trigger"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
      >
        <span className={`custom-dropdown-value ${!selectedOption ? 'is-placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`custom-dropdown-chevron ${isOpen ? 'is-rotated' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="custom-dropdown-popover"
          role="presentation"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <ul
            ref={listboxRef}
            className="custom-dropdown-menu"
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              highlightedIndex >= 0 ? `opt-${id || 'dd'}-${highlightedIndex}` : undefined
            }
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = opt.value === value
              const isHighlighted = idx === highlightedIndex

              return (
                <li
                  key={String(opt.value)}
                  id={`opt-${id || 'dd'}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`custom-dropdown-item ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={e => selectOption(opt.value, e)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="cd-item-text">
                    <span className="cd-item-label">{opt.label}</span>
                    {opt.desc && <span className="cd-item-desc">{opt.desc}</span>}
                  </div>
                  {isSelected && (
                    <span className="cd-item-check" aria-hidden="true">
                      <Check size={15} />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
