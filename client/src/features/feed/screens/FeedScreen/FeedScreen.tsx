import { useEffect, useState } from 'react';
import useSocialStore from '../../../social/store/social.store';
import FeedTabs from '../../components/FeedTabs';
import ActivityCard from '../../components/ActivityCard';
import Button from '../../../../components/shared/Button';
import Spinner from '../../../../components/shared/Spinner';
import './FeedScreen.scss';

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'following' | 'for-you'>('following');
  const {
    followingFeed,
    forYouFeed,
    followingPage,
    followingTotalPages,
    forYouPage,
    forYouTotalPages,
    loading,
    fetchFollowingFeed,
    fetchForYouFeed,
  } = useSocialStore();

  useEffect(() => {
    fetchFollowingFeed(1);
    fetchForYouFeed(1);
  }, [fetchFollowingFeed, fetchForYouFeed]);

  const activities = activeTab === 'following' ? followingFeed : forYouFeed;
  const page = activeTab === 'following' ? followingPage : forYouPage;
  const totalPages = activeTab === 'following' ? followingTotalPages : forYouTotalPages;
  const fetchMore = activeTab === 'following' ? fetchFollowingFeed : fetchForYouFeed;

  return (
    <div className="FeedScreen">
      <h1 className="FeedScreen__title">Feed</h1>
      <FeedTabs activeTab={activeTab} onChange={setActiveTab} />

      {loading && activities.length === 0 ? (
        <div className="FeedScreen__loading">
          <Spinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <p className="FeedScreen__empty">
          {activeTab === 'following'
            ? 'Follow some users to see their activity here.'
            : 'No activity yet. Start training to see what others are up to!'}
        </p>
      ) : (
        <div className="FeedScreen__list">
          {activities.map((activity) => (
            <ActivityCard key={activity._id} activity={activity} />
          ))}
          {page < totalPages && (
            <Button
              variant="ghost"
              onClick={() => fetchMore(page + 1)}
              loading={loading}
              fullWidth
              className="FeedScreen__loadMore"
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
