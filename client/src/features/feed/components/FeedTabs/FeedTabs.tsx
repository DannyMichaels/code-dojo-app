import cn from 'classnames';
import './FeedTabs.scss';

interface FeedTabsProps {
  activeTab: 'following' | 'for-you';
  onChange: (tab: 'following' | 'for-you') => void;
}

export default function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  return (
    <div className="FeedTabs">
      <button
        className={cn('FeedTabs__tab', { 'FeedTabs__tab--active': activeTab === 'following' })}
        onClick={() => onChange('following')}
      >
        Following
      </button>
      <button
        className={cn('FeedTabs__tab', { 'FeedTabs__tab--active': activeTab === 'for-you' })}
        onClick={() => onChange('for-you')}
      >
        For You
      </button>
    </div>
  );
}
