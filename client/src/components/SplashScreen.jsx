import styles from './SplashScreen.module.css';

export default function SplashScreen() {
    return (
        <div className={styles.container}>
            <div className={styles.logoWrapper}>
                <img src="/zege.png" alt="Zege Logo" className={styles.logo} />
            </div>
        </div>
    );
}
