import { useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../features/auth/store/auth.store';
import useSkillStore from '../features/skills/store/skill.store';
import './AppLayout.scss';

export default function AppLayout() {
  const { token, user, logout } = useAuthStore();
  const { skills, fetchSkills } = useSkillStore();
  const location = useLocation();

  useEffect(() => {
    if (token) fetchSkills();
  }, [token, fetchSkills]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="AppLayout">
      <aside className="AppLayout__sidebar">
        <div className="AppLayout__brand">Code Dojo</div>
        <nav className="AppLayout__nav">
          <Link
            to="/dashboard"
            className={`AppLayout__link ${location.pathname === '/dashboard' ? 'AppLayout__link--active' : ''}`}
          >
            Dashboard
          </Link>
          {skills.length > 0 && (
            <div className="AppLayout__skills">
              <span className="AppLayout__skillsLabel">Skills</span>
              {skills.map(skill => (
                <Link
                  key={skill._id}
                  to={`/skills/${skill._id}`}
                  className={`AppLayout__link AppLayout__link--skill ${location.pathname === `/skills/${skill._id}` ? 'AppLayout__link--active' : ''}`}
                >
                  {skill.skillCatalogId?.name || 'Loading...'}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="AppLayout__user">
          <span className="AppLayout__username">{user?.name || user?.username || user?.email}</span>
          <button className="AppLayout__logout" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="AppLayout__main">
        <Outlet />
      </main>
    </div>
  );
}
