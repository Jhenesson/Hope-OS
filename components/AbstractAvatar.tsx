
import React from 'react';

interface AbstractAvatarProps {
  name: string;
  gender: 'male' | 'female';
  size?: number;
}

// Simple hash function to get deterministic values from a string
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const femaleColors = [
  ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff'],
  ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'],
  ['#ffafcc', '#bde0fe', '#a2d2ff', '#cdb4db', '#ffc8dd'],
];

const maleColors = [
  ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8'],
  ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  ['#3d405b', '#81b29a', '#f2cc8f', '#e07a5f', '#f4f1de'],
];


export const AbstractAvatar: React.FC<AbstractAvatarProps> = ({ name, gender, size = 40 }) => {
  if (!name) {
    return <div style={{ width: size, height: size }} className="bg-gray-200 rounded-full" />;
  }
  
  const hash = simpleHash(name);
  const colorPalette = gender === 'female' ? femaleColors[hash % femaleColors.length] : maleColors[hash % maleColors.length];
  
  const backgroundColor = colorPalette[hash % colorPalette.length];
  const shape1Color = colorPalette[(hash + 1) % colorPalette.length];
  const shape2Color = colorPalette[(hash + 2) % colorPalette.length];
  const shape3Color = colorPalette[(hash + 3) % colorPalette.length];

  const r1 = 15 + (hash % 10);
  const cx1 = 40 + (hash % 20);
  const cy1 = 40 + ((hash >> 4) % 20);
  
  const r2 = 10 + ((hash >> 8) % 10);
  const cx2 = 60 - (hash % 20);
  const cy2 = 60 - ((hash >> 12) % 20);
  
  const rotation = hash % 360;

  return (
    <div style={{ width: size, height: size }} className="rounded-full overflow-hidden">
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill={backgroundColor} />
        <g transform={`rotate(${rotation}, 50, 50)`}>
          <circle cx={cx1} cy={cy1} r={r1} fill={shape1Color} opacity="0.7" />
          <circle cx={cx2} cy={cy2} r={r2} fill={shape2Color} opacity="0.8" />
          <rect x="10" y="30" width={(hash % 30) + 30} height={(hash % 10) + 5} fill={shape3Color} opacity="0.75" />
        </g>
      </svg>
    </div>
  );
};