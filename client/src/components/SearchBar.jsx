import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

const MAX_BROTHER_MATCHES = 8;
const MAX_MAJOR_MATCHES = 6;

const SearchBar = ({
  brothers = [],
  onSelectBrother,
  onSelectMajor,
  palette,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const resolvedPalette = useMemo(
    () => ({
      background: palette?.background || 'rgba(255, 255, 255, 0.95)',
      border: palette?.border || 'rgba(0, 0, 0, 0.12)',
      inputColor: '#000000',
    }),
    [palette],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { brotherMatches, majorMatches, combinedItems } = useMemo(() => {
    if (!debouncedQuery) {
      return { brotherMatches: [], majorMatches: [], combinedItems: [] };
    }

    const brotherMatches = brothers
      .filter((brother) => (brother.name || '').toLowerCase().includes(debouncedQuery))
      .slice(0, MAX_BROTHER_MATCHES);

    const majorCountMap = new Map();
    brothers.forEach((brother) => {
      const major = (brother.major || '').trim();
      if (!major) return;
      if (major.toLowerCase().includes(debouncedQuery)) {
        majorCountMap.set(major, (majorCountMap.get(major) || 0) + 1);
      }
    });

    const majorMatches = Array.from(majorCountMap.entries())
      .map(([major, count]) => ({ major, count }))
      .slice(0, MAX_MAJOR_MATCHES);

    const combinedItems = [
      ...brotherMatches.map((match) => ({ type: 'brother', payload: match })),
      ...majorMatches.map((match) => ({ type: 'major', payload: match })),
    ];

    return { brotherMatches, majorMatches, combinedItems };
  }, [debouncedQuery, brothers]);

  const shouldShowDropdown = isDropdownOpen && query.trim().length > 0;
  const hasResults = brotherMatches.length > 0 || majorMatches.length > 0;

  const handleBrotherSelection = useCallback(
    (brother) => {
      if (!brother) return;
      onSelectBrother?.(brother.id);
      setQuery('');
      setIsDropdownOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.focus();
    },
    [onSelectBrother],
  );

  const handleMajorSelection = useCallback(
    (major) => {
      if (!major) return;
      onSelectMajor?.(major);
      setQuery('');
      setIsDropdownOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.focus();
    },
    [onSelectMajor],
  );

  const handleKeyDown = (event) => {
    if (!shouldShowDropdown || combinedItems.length === 0) {
      if (event.key === 'ArrowDown' && combinedItems.length > 0) {
        setIsDropdownOpen(true);
        setHighlightIndex(0);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % combinedItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
    } else if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault();
      const item = combinedItems[highlightIndex];
      if (!item) return;
      if (item.type === 'brother') {
        handleBrotherSelection(item.payload);
      } else {
        handleMajorSelection(item.payload.major);
      }
    } else if (event.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', color: '#000000' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 260,
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or major…"
          style={{
            width: '100%',
            borderRadius: 20,
            border: `1px solid ${resolvedPalette.border}`,
            background: resolvedPalette.background,
            color: resolvedPalette.inputColor,
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 500,
            outline: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
        {shouldShowDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 14,
              boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
              padding: '10px 0',
              zIndex: 5,
            }}
          >
            {hasResults ? (
              <>
                {brotherMatches.length > 0 && (
                  <div style={{ padding: '0 10px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Brothers
                  </div>
                )}
                {brotherMatches.map((brother, index) => {
                  const highlighted = highlightIndex === index;
                  return (
                    <button
                      key={brother.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleBrotherSelection(brother)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        background: highlighted ? 'rgba(0,0,0,0.07)' : 'transparent',
                        border: 'none',
                        color: '#000000',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{brother.name}</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>
                        {[brother.major, brother.pledgeClass, brother.gradYear ? `Class of ${brother.gradYear}` : null]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    </button>
                  );
                })}
                {majorMatches.length > 0 && (
                  <div style={{ marginTop: 8, padding: '6px 10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Majors
                  </div>
                )}
                {majorMatches.map((major, index) => {
                  const combinedIndex = brotherMatches.length + index;
                  const highlighted = highlightIndex === combinedIndex;
                  return (
                    <button
                      key={major.major}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleMajorSelection(major.major)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        background: highlighted ? 'rgba(0,0,0,0.07)' : 'transparent',
                        border: 'none',
                        color: '#000000',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{major.major}</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>{major.count} brother{major.count === 1 ? '' : 's'}</div>
                    </button>
                  );
                })}
              </>
            ) : (
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#000000', opacity: 0.7 }}>
                No brothers or majors found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

