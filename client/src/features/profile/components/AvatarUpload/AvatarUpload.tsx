import { useRef } from 'react';
import Avatar from '../../../../components/shared/Avatar';
import useAuthStore from '../../../auth/store/auth.store';
import { uploadAvatar } from '../../../social/services/social.service';
import './AvatarUpload.scss';

interface AvatarUploadProps {
  avatar?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  username?: string;
}

export default function AvatarUpload({ avatar, avatarUrl, name, username }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        // Resize to max 256x256
        const canvas = document.createElement('canvas');
        const max = 256;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > max) { h = Math.round(h * max / w); w = max; }
        } else {
          if (h > max) { w = Math.round(w * max / h); h = max; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        try {
          const { user } = await uploadAvatar(base64);
          setUser(user);
        } catch (err) {
          console.error('Avatar upload failed:', err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="AvatarUpload" onClick={() => fileRef.current?.click()}>
      <Avatar avatar={avatar} avatarUrl={avatarUrl} name={name} username={username} size="xl" />
      <div className="AvatarUpload__overlay">
        <span className="AvatarUpload__icon">&#128247;</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFile}
        className="AvatarUpload__input"
      />
    </div>
  );
}
