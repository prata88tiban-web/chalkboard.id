'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconX, IconTable, IconReceipt, IconUser, IconChevronRight } from '@tabler/icons-react';

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
  customer: <IconUser className="w-4 h-4" />,
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
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <IconSearch className={`w-5 h-5 transition-colors duration-200 ${isOpen ? 'text-primary' : 'text-bodytext'}`} />
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
            w-full pl-12 pr-12 py-4 rounded-2xl
            bg-gray-100 dark:bg-gray-800
            border-2 border-transparent
            focus:border-primary focus:bg-white dark:focus:bg-gray-900
            text-dark dark:text-white font-medium
            placeholder:text-bodytext/60
            transition-all duration-300
            shadow-inner outline-none
          "
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconX className="w-5 h-5 text-bodytext" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-[10px] font-black text-bodytext border border-gray-300 dark:border-gray-600">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && query && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="
              absolute top-full left-0 right-0 mt-3 z-50
              bg-white dark:bg-gray-900
              border border-gray-100 dark:border-gray-800
              rounded-2xl shadow-2xl shadow-primary/10
              max-h-[400px] overflow-hidden flex flex-col
            "
          >
            <div className="p-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-bodytext">
                Search Results
              </p>
            </div>

            <div className="overflow-y-auto custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <IconSearch className="w-8 h-8 text-bodytext/30" />
                  </div>
                  <p className="text-sm font-bold text-dark dark:text-white">No results found</p>
                  <p className="text-xs text-bodytext mt-1">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredItems.map((item, index) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-4 p-3 rounded-xl text-left
                        transition-all duration-200 group
                        ${index === highlightedIndex
                          ? 'bg-primary text-white shadow-lg shadow-primary/25'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className={`
                        p-2.5 rounded-xl transition-colors
                        ${index === highlightedIndex
                          ? 'bg-white/20 text-white'
                          : typeColors[item.type]
                        }
                      `}>
                        {typeIcons[item.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${index === highlightedIndex ? 'text-white' : 'text-dark dark:text-white'}`}>
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className={`text-xs truncate ${index === highlightedIndex ? 'text-white/80' : 'text-bodytext'}`}>
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status && (
                          <span className={`
                            px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-lg
                            ${index === highlightedIndex
                              ? 'bg-white/20 text-white'
                              : item.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'occupied' ? 'bg-rose-100 text-rose-700' :
                                'bg-gray-100 text-gray-700'}
                          `}>
                            {item.status}
                          </span>
                        )}
                        <IconChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${index === highlightedIndex ? 'text-white' : 'text-bodytext/30'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-50 dark:border-gray-800 text-[10px] text-bodytext flex justify-between">
              <span>Select with <span className="font-bold">Enter</span></span>
              <span>Navigate with <span className="font-bold">↑↓</span></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAutocomplete;
