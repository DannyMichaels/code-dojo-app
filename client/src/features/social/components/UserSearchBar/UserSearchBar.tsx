import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../../../components/shared/Avatar';
import useSocialStore from '../../store/social.store';
import './UserSearchBar.scss';

interface UserSearchBarProps {
  compact?: boolean;
}

export default function UserSearchBar({ compact }: UserSearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { searchResults, searchLoading, searchUsers, clearSearch } = useSocialStore();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      clearSearch();
      setOpen(false);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      searchUsers(query);
      setOpen(true);
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query, searchUsers, clearSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (username: string) => {
    setQuery('');
    setOpen(false);
    clearSearch();
    navigate(`/u/${username}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.length >= 2) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className={`UserSearchBar ${compact ? 'UserSearchBar--compact' : ''}`} ref={wrapperRef}>
      <input
        className="UserSearchBar__input"
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && (searchResults.length > 0 || searchLoading) && (
        <div className="UserSearchBar__dropdown">
          {searchLoading ? (
            <div className="UserSearchBar__loading">Searching...</div>
          ) : (
            searchResults.map((u) => (
              <button
                key={u._id}
                className="UserSearchBar__result"
                onClick={() => handleSelect(u.username)}
              >
                <Avatar avatar={u.avatar} name={u.name} username={u.username} size="sm" />
                <div className="UserSearchBar__resultInfo">
                  <span className="UserSearchBar__resultName">{u.name || u.username}</span>
                  <span className="UserSearchBar__resultUsername">@{u.username}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
