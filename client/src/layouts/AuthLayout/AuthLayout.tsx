import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/auth.store';
import { APP_NAME, AUTHOR_NAME, BrandIcon } from '../../constants/app';
import './AuthLayout.scss';

export default function AuthLayout() {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="AuthLayout">
      <div className="AuthLayout__card">
        <h1 className="AuthLayout__logo">
          <BrandIcon size={36} />
          {APP_NAME}
        </h1>
        <Outlet />
      </div>
      {/* <footer className="AuthLayout__footer">
        
        &copy; {new Date().getFullYear()} {AUTHOR_NAME} <br/>
        Inspired by&nbsp;
        <a href="https://github.com/Cause-of-a-Kind/code-dojo-core" target="_blank" rel="noopener noreferrer">code-dojo-core</a>
      </footer> */}
    </div>
  );
}
