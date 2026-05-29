'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconSearch, IconX, IconTable, IconReceipt } from '@tabler/icons-react';

interface SearchItem {
  id: number | string;
  type: 'table' | 'order' | 'customer';
  label: string;
  sublabel?: string;
  status?: string;
}

interface SearchAutocompleteProps {
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  placeholder?: string;
  className?: string;
}

const typeIcons = {
  table: <IconTable className="w-4 h-4" />,
  order: <IconReceipt className="w-4 h-4" />,
  customer: <IconSearch className="w-4 h-4" />,
};

const typeColors = {
  table: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  order: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  customer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  items,
  onSelect,
  placeholder = 'Search tables, orders...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    (item.sublabel && item.sublabel.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (item: SearchItem) => {
    onSelect(item);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <IconSearch className="w-5 h-5 text-bodytext" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-12 pr-10 py-3 rounded-xl
            bg-gray-100 dark:bg-gray-800
            border-2 border-transparent
            focus:border-primary focus:bg-white dark:focus:bg-gray-900
            text-dark dark:text-white
            placeholder:text-bodytext
            transition-all duration-200
            outline-none
          "
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <IconX className="w-5 h-5 text-bodytext hover:text-dark dark:hover:text-white transition-colors" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query && (
        <div
          ref={listRef}
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            rounded-xl shadow-xl
            max-h-80 overflow-y-auto
          "
        >
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-bodytext">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors duration-100
                    ${index === highlightedIndex
                      ? 'bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                    {typeIcons[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark dark:text-white truncate">
                      {item.label}
                    </p>
                    {item.sublabel && (
                      <p className="text-sm text-bodytext truncate">{item.sublabel}</p>
                    )}
                  </div>
                  {item.status && (
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${item.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'occupied' ? 'bg-rose-100 text-rose-700' :
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {item.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
