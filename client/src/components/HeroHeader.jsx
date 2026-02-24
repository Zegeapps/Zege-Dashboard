import { NavLink } from 'react-router-dom';
import styles from './HeroHeader.module.css';

const NAV_ITEMS = [
    { label: 'Home', icon: '/home.png', to: '/' },
    { label: 'Task', icon: '/task.png', to: '/task' },
    { label: 'Files', icon: '/file.png', to: '/files' },
];

export default function HeroHeader() {
    return (
        <header className={styles.hero}>
            {/* ── Main title ── */}
            <h1 className={styles.title}>Build Slowly. Build Strong.</h1>

            {/* ── Navigation row ── */}
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
    );
}
