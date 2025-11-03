import React from 'react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6'];
const OTHER_COLOR = '#6b7280';
const UNUSED_COLOR = '#e5e7eb';

export interface DonutSegment {
    name: string;
    power: number;
}

interface PowerDonutProps {
    segments: DonutSegment[];
    totalPower: number;
    powerLimit: number;
}

export const PowerDonut: React.FC<PowerDonutProps> = ({
                                                          segments,
                                                          totalPower,
                                                          powerLimit,
                                                      }) => {
    let accumulatedPercentage = 0;
    const gradientSegments = segments.map((segment, index) => {
        const percentage = (segment.power / powerLimit) * 100;
        const start = accumulatedPercentage;
        accumulatedPercentage += percentage;
        const end = accumulatedPercentage;

        const color = segment.name === 'Інше' ? OTHER_COLOR : COLORS[index % COLORS.length];

        return `${color} ${start}% ${end}%`;
    });

    if (accumulatedPercentage < 100) {
        gradientSegments.push(`${UNUSED_COLOR} ${accumulatedPercentage}% 100%`);
    }

    const gradientStyle = {
        background: `conic-gradient(${gradientSegments.join(', ')})`,
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative flex h-32 w-32 items-center justify-center rounded-full"
                style={gradientStyle}
            >
                <div className="absolute h-24 w-24 rounded-full bg-card"/>
                <div className="relative z-10 text-center">
                    <p className="text-2xl font-bold">{totalPower.toFixed(0)} W</p>
                    <p className="text-xs text-muted-foreground">/ {powerLimit} W</p>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {segments.map((segment, index) => (
                    <div key={segment.name} className="flex items-center gap-1.5">
            <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                    backgroundColor: segment.name === 'Інше' ? OTHER_COLOR : COLORS[index % COLORS.length]
                }}
            />
                        <span>{segment.name} ({segment.power.toFixed(0)} W)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};