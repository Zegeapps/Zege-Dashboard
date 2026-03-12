import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import activityService from '../services/activityService';
import { getCurrentUser } from '../services/authService';
import styles from './ActivityHeatmap.module.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ActivityHeatmap() {
    const user = getCurrentUser();
    const queryClient = useQueryClient();

    // Default to current month/year (March 2026 in current context)
    const [viewDate, setViewDate] = useState(new Date());

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    // Accuracy: Get today's actual date string
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const { data: activityRes, isLoading } = useQuery({
        queryKey: ['activities', user?._id],
        queryFn: () => activityService.getActivities(user?._id),
        enabled: !!user?._id,
    });

    const markMutation = useMutation({
        mutationFn: () => activityService.toggleManualActivity(user?._id, todayStr),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities', user?._id] });
        },
    });

    const activities = activityRes?.data || [];
    const activityMap = useMemo(() => {
        const map = {};
        activities.forEach(a => {
            map[a.date] = a;
        });
        return map;
    }, [activities]);

    // Calendar generation logic for the current viewMonth
    const calendarDays = useMemo(() => {
        const days = [];

        // First day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        // Last day of the month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        // Days needed from previous month to align with week (Starting Monday)
        // firstDay.getDay() returns 0 for Sunday, 1 for Monday...
        // We want Monday (1) to be start
        let startOffset = firstDay.getDay() - 1;
        if (startOffset === -1) startOffset = 6; // Sunday becomes offset 6

        // Padding for the start of the grid
        for (let i = 0; i < startOffset; i++) {
            days.push({ type: 'empty', id: `emp-start-${i}` });
        }

        // Days of the actual month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const activity = activityMap[dateStr];

            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const isFuture = dateStr > todayStr;
            const worked = (activity?.count > 0 || activity?.manual);
            const count = activity?.count || 0;

            let tooltip = '';
            if (isFuture) {
                tooltip = 'Upcoming';
            } else if (worked) {
                tooltip = `Worked${count > 0 ? ` (${count} tasks)` : ''}`;
            } else if (isPast || isToday) {
                // Tracking starts from March 13
                if (dateStr < '2026-03-13') {
                    tooltip = 'Activity not tracked';
                } else {
                    tooltip = 'Not worked';
                }
            }

            days.push({
                type: 'day',
                dayNum: d,
                date: dateStr,
                worked,
                manual: activity?.manual || false,
                isToday,
                isPast,
                isFuture,
                tooltip,
                id: dateStr
            });
        }

        return days;
    }, [currentMonth, currentYear, activityMap, todayStr]);

    const isMarkedToday = activityMap[todayStr]?.manual;

    const navigateMonth = (direction) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(viewDate.getMonth() + direction);

        // Restrict to 2026 and starting from March as requested
        if (newDate.getFullYear() === 2026 && newDate.getMonth() >= 2) {
            setViewDate(newDate);
        }
    };

    if (isLoading) return <div className={styles.container}>Loading Overview...</div>;

    const isNextDisabled = currentYear === 2026 && currentMonth === 11;
    const isPrevDisabled = currentYear === 2026 && currentMonth === 2;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Your work streak and contributions</h3>
            </div>

            <div className={styles.navHeader}>
                <button
                    className={styles.navBtn}
                    onClick={() => navigateMonth(-1)}
                    disabled={isPrevDisabled}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div className={styles.monthDisplay}>
                    {MONTHS[currentMonth]} {currentYear}
                </div>
                <button
                    className={styles.navBtn}
                    onClick={() => navigateMonth(1)}
                    disabled={isNextDisabled}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </div>

            <div className={styles.heatmapScroll}>
                <div className={styles.dayOfWeekLabels}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
                <div className={`${styles.heatmapGrid} ${markMutation.isPending ? styles.loadingGrid : ''}`}>
                    {calendarDays.map((item) => (
                        <div
                            key={item.id}
                            data-tooltip={item.tooltip}
                            className={`
                                ${styles.day} 
                                ${item.type === 'empty' ? styles.empty : ''} 
                                ${item.worked ? styles['level-work'] : ''}
                                ${item.isToday && !item.worked ? styles['level-missed'] : ''}
                                ${item.isPast && !item.worked ? styles['level-inactive'] : ''}
                                ${item.isFuture ? styles['level-future'] : ''}
                            `}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.bottomSection}>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBox} ${styles.notWorkedBox}`} />
                        <span>Not Worked</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBox} ${styles.workedBox}`} />
                        <span>Worked</span>
                    </div>
                </div>

                <button
                    className={`${styles.markBtn} ${isMarkedToday ? styles.active : ''}`}
                    onClick={() => markMutation.mutate()}
                    disabled={markMutation.isPending}
                >
                    {isMarkedToday ? '✓ Worked' : 'Mark Today'}
                </button>
            </div>
        </div>
    );
}
