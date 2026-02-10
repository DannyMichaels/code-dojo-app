import { useState } from 'react';
import useAuthStore from '../../auth/store/auth.store';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import api from '../../../api/client';
import './SettingsScreen.scss';

export default function SettingsScreen() {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [sessionLength, setSessionLength] = useState<'short' | 'medium' | 'long'>(user?.preferences?.sessionLength || 'medium');
  const [difficultyPreference, setDifficultyPreference] = useState<'comfortable' | 'challenging' | 'intense'>(user?.preferences?.difficultyPreference || 'challenging');
  const [feedbackStyle, setFeedbackStyle] = useState<'encouraging' | 'direct' | 'minimal'>(user?.preferences?.feedbackStyle || 'direct');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/auth/me', {
        name: name || undefined,
        username,
        bio,
        preferences: { sessionLength, difficultyPreference, feedbackStyle },
      });
      setUser(res.data.user);
      setMessage({ type: 'success', text: 'Settings saved' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="SettingsScreen">
      <h1 className="SettingsScreen__title">Settings</h1>

      <form onSubmit={handleSave}>
        {message && (
          <div className={`SettingsScreen__message SettingsScreen__message--${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="SettingsScreen__section">
          <h3>Profile</h3>
          <div className="SettingsScreen__field">
            <label htmlFor="name">Name</label>
            <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" />
          </div>
          <div className="SettingsScreen__field">
            <label htmlFor="username">Username</label>
            <Input id="username" name="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="your_username" />
          </div>
          <div className="SettingsScreen__field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              className="SettingsScreen__textarea"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={500}
              rows={3}
            />
          </div>
        </section>

        <section className="SettingsScreen__section">
          <h3>Training Preferences</h3>
          <div className="SettingsScreen__field">
            <label htmlFor="sessionLength">Session Length</label>
            <select id="sessionLength" className="SettingsScreen__select" value={sessionLength} onChange={e => setSessionLength(e.target.value as 'short' | 'medium' | 'long')}>
              <option value="short">Short (~15 min)</option>
              <option value="medium">Medium (~30 min)</option>
              <option value="long">Long (~45+ min)</option>
            </select>
          </div>
          <div className="SettingsScreen__field">
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" className="SettingsScreen__select" value={difficultyPreference} onChange={e => setDifficultyPreference(e.target.value as 'comfortable' | 'challenging' | 'intense')}>
              <option value="comfortable">Comfortable</option>
              <option value="challenging">Challenging</option>
              <option value="intense">Intense</option>
            </select>
          </div>
          <div className="SettingsScreen__field">
            <label htmlFor="feedback">Feedback Style</label>
            <select id="feedback" className="SettingsScreen__select" value={feedbackStyle} onChange={e => setFeedbackStyle(e.target.value as 'encouraging' | 'direct' | 'minimal')}>
              <option value="encouraging">Encouraging</option>
              <option value="direct">Direct</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </section>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  );
}
