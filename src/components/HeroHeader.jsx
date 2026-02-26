import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import styles from './HeroHeader.module.css';

const NAV_ITEMS = [
    { label: 'Home', icon: '/home.png', to: '/' },
    { label: 'Task', icon: '/task.png', to: '/task' },
    { label: 'Files', icon: '/file.png', to: '/files' },
];

export default function HeroHeader() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <header className={styles.hero}>

                {/* ── Title row: heading + avatar ── */}
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>Build Slowly. Build Strong.</h1>
                    <button
                        className={styles.avatarBtn}
                        onClick={() => setSheetOpen(true)}
                        aria-label="Open profile"
                    >
                        <img
                            src={`/${user?.avatar}.jpg`}
                            alt={user?.username}
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav className={styles.nav}>
                    {NAV_ITEMS.map(({ label, icon, to }) => (
                        <NavLink
                            key={label}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                            }
                        >
                            <img src={icon} alt={label} className={styles.icon} />
                            <span className={styles.label}>{label}</span>
                            <span className={styles.underline} aria-hidden="true" />
                        </NavLink>
                    ))}
                </nav>
            </header>

            {/* ── Profile bottom sheet ── */}
            {sheetOpen && (
                <div className={styles.backdrop} onClick={() => setSheetOpen(false)}>
                    <div className={styles.sheet} onClick={e => e.stopPropagation()}>

                        <div className={styles.handle} />

                        {/* Avatar + name */}
                        <div className={styles.sheetUser}>
                            <div className={styles.sheetAvatar}>
                                <img
                                    src={`/${user?.avatar}.jpg`}
                                    alt={user?.username}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div>
                                <p className={styles.sheetUsername}>@{user?.username}</p>
                                <p className={styles.sheetRole}>Team Member</p>
                            </div>
                        </div>

                        <div className={styles.sheetDivider} />

                        {/* Info rows */}
                        <div className={styles.sheetRows}>
                            <div className={styles.sheetRow}>
                                <span className={styles.sheetRowLabel}>Username</span>
                                <span className={styles.sheetRowValue}>{user?.username}</span>
                            </div>
                            <div className={styles.sheetRow}>
                                <span className={styles.sheetRowLabel}>Password</span>
                                <div className={styles.passwordWrap}>
                                    <span className={styles.sheetRowValue}>
                                        {showPassword ? user?.password : '********'}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Logout */}
                        <button className={styles.sheetLogout} onClick={handleLogout}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Log Out
                        </button>

                    </div>
                </div>
            )}
        </>
    );
}
