import styles from './FilesPage.module.css';

export default function FilesPage() {
    return (
        <section className={styles.content}>
            <div className={styles.center}>
                <img src="/file.png" alt="Files" className={styles.iconImg} />
                <h2 className={styles.title}>Coming Soon</h2>
                <p className={styles.sub}>Files are on their way. Stay tuned!</p>
            </div>
        </section>
    );
}
