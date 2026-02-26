import styles from './AppLayout.module.css';

/**
 * AppLayout — mobile-first layout wrapper.
 *
 * Usage:
 *   <AppLayout>
 *     <YourPageContent />
 *   </AppLayout>
 *
 * The outer #root / body provides the grey (#f5f5f5) page background.
 * This component provides the centred white container (max 500px).
 */
export default function AppLayout({ children }) {
    return (
        <div className={styles.container}>
            {children}
        </div>
    );
}
