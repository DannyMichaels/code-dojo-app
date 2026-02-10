import cn from 'classnames';
import './Avatar.scss';

interface AvatarProps {
  avatar?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeMap = { sm: 28, md: 40, lg: 64, xl: 96 };

export default function Avatar({
  avatar,
  avatarUrl,
  name,
  username,
  size = 'md',
  className,
  onClick,
}: AvatarProps) {
  const src = avatar || avatarUrl || null;
  const initial = (name || username || '?')[0].toUpperCase();
  const px = sizeMap[size];

  return src ? (
    <img
      className={cn('Avatar', `Avatar--${size}`, className)}
      src={src}
      alt={username || name || 'avatar'}
      width={px}
      height={px}
      onClick={onClick}
    />
  ) : (
    <div
      className={cn('Avatar', 'Avatar--fallback', `Avatar--${size}`, className)}
      onClick={onClick}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
    >
      {initial}
    </div>
  );
}
