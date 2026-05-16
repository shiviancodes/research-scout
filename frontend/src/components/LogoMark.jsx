export default function LogoMark({ size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon
        points="10,2 16.93,6 16.93,14 10,18 3.07,14 3.07,6"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="1.5" fill={color} />
      <line x1="12.5" y1="10" x2="15.5" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.75" y1="12.165" x2="7.25" y2="14.763" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.75" y1="7.835" x2="7.25" y2="5.237" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
