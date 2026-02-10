import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Avatar from '../../../../components/shared/Avatar';
import Spinner from '../../../../components/shared/Spinner';
import useSocialStore from '../../store/social.store';
import './SearchResultsScreen.scss';

export default function SearchResultsScreen() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { searchResults, searchLoading, searchUsers } = useSocialStore();

  useEffect(() => {
    if (q.length >= 2) {
      searchUsers(q);
    }
  }, [q, searchUsers]);

  return (
    <div className="SearchResultsScreen">
      <h1 className="SearchResultsScreen__title">
        Search results for "{q}"
      </h1>

      {searchLoading ? (
        <div className="SearchResultsScreen__loading">
          <Spinner size="lg" />
        </div>
      ) : searchResults.length === 0 ? (
        <p className="SearchResultsScreen__empty">No users found.</p>
      ) : (
        <div className="SearchResultsScreen__list">
          {searchResults.map((user) => (
            <Link
              key={user._id}
              to={`/u/${user.username}`}
              className="SearchResultsScreen__card"
            >
              <Avatar avatar={user.avatar} name={user.name} username={user.username} size="lg" />
              <div className="SearchResultsScreen__info">
                <span className="SearchResultsScreen__name">{user.name || user.username}</span>
                <span className="SearchResultsScreen__username">@{user.username}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
