import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getTasks } from '../services/taskService';
import { getCurrentUser } from '../services/authService';
import ActivityHeatmap from '../components/ActivityHeatmap';
import styles from './HomePage.module.css';

export default function HomePage() {
    const currentUser = getCurrentUser();
    const navigate = useNavigate();

    const { data: tasksRes, isLoading: loading } = useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks,
    });
    const tasks = tasksRes?.data || [];

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const upcoming = total - completed;
    const assignedTask = tasks.filter(t => t.assignedTo?.some(u => u._id === currentUser?._id)).length;

    const STATS = [
        { value: total, label: 'Total' },
        { value: upcoming, label: 'Upcoming' },
        { value: completed, label: 'Completed' },
    ];

    return (
        <section className={styles.content}>

            <h2 className={styles.sectionTitle}>Task Overview</h2>

            <div className={styles.card} onClick={() => navigate('/task')}>
                {/* 3-column stats */}
                <div className={styles.statsGrid}>
                    {STATS.map(({ value, label }) => (
                        <div key={label} className={styles.statItem}>
                            {loading ? (
                                <span className={`${styles.skeleton} ${styles.skeletonValue}`}></span>
                            ) : (
                                <p className={styles.statValue}>{value}</p>
                            )}
                            <p className={styles.statLabel}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Assigned tasks banner */}
                <div className={styles.banner}>
                    <img
                        src="/Target.png"
                        alt="Target"
                        className={styles.bannerIcon}
                    />
                    <p className={styles.bannerText}>
                        You have {loading ? (
                            <span className={`${styles.skeleton} ${styles.skeletonStrong}`}></span>
                        ) : (
                            <strong>{assignedTask}</strong>
                        )} {assignedTask === 1 ? 'task' : 'tasks'} assigned
                    </p>
                </div>
            </div>

            <ActivityHeatmap />

        </section>
    );
}
