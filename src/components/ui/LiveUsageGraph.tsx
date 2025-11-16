import React from 'react';

interface PowerHistoryPoint {
    time: number;
    power: number;
}

interface LiveUsageGraphProps {
    history: PowerHistoryPoint[];
    powerLimit: number;
    height?: number;
    isOnline: boolean;
}

const MAX_BARS = 60;

export const LiveUsageGraph: React.FC<LiveUsageGraphProps> = ({
                                                                  history,
                                                                  powerLimit,
                                                                  height = 40,
                                                                  isOnline,
                                                              }) => {
    const displayedHistory = history.slice(-MAX_BARS);

    const bars = [
        ...Array(Math.max(0, MAX_BARS - displayedHistory.length)).fill(0),
        ...displayedHistory.map((p) => p.power),
    ];

    const getBarHeight = (power: number) => {
        if (powerLimit === 0 || power === 0) return '1px';
        const percentage = power / powerLimit;
        const barHeight = Math.max(1, percentage * height);
        return `${barHeight}px`;
    };

    const getBarColor = (power: number) => {
        if (powerLimit === 0) return 'bg-muted-foreground';
        const percentage = power / powerLimit;
        if (percentage > 0.9) return 'bg-destructive';
        if (percentage > 0.6) return 'bg-yellow-500';
        return 'bg-primary';
    };

    let title = "Поточне споживання (Ост. ~2 хв)";
    if (!isOnline) {
        if (history.length > 0) {
            title = "Поточне споживання (Застарілі дані)";
        } else {
            title = "Поточне споживання (Монітор офлайн)";
        }
    }

    if (!isOnline && history.length === 0) {
        return (
            <div className="mt-4 space-y-1">
                <p className="text-xs text-muted-foreground text-left">{title}</p>
                <div
                    className="flex h-10 w-full items-center justify-center rounded border-2 border-dashed border-muted"
                    style={{height: `${height}px`}}
                >
                    <p className="text-xs text-muted-foreground">Немає даних</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground text-left">
                {title}
            </p>
            <div
                className="flex h-10 w-full items-end gap-[1.5px] overflow-hidden rounded"
                style={{height: `${height}px`}}
            >
                {bars.map((power, index) => (
                    <div
                        key={index}
                        className={`flex-1 ${getBarColor(power)}`}
                        style={{
                            height: getBarHeight(power),
                            minHeight: '1px',
                        }}
                        title={`${power.toFixed(0)} W`}
                    />
                ))}
            </div>
        </div>
    );
};