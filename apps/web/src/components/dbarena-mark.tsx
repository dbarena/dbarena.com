import { cn } from "@/lib/utils";

export function DbarenaMark({
  className = "h-7 shrink-0",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("w-auto shrink-0", className)}
      fill="none"
      viewBox="0 0 499 88"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(20.11 5.54) scale(0.76923) skewX(-13) scale(0.98 1)">
        <defs>
          <mask
            id="dbarena-cut"
            maskUnits="userSpaceOnUse"
            x="-8"
            y="-8"
            width="648.25"
            height="116"
          >
            <rect x="-8" y="-8" width="648.25" height="116" fill="white" />
            <path d="M-3 47H178.35V52H-3Z" fill="black" />
          </mask>
        </defs>
        <g mask="url(#dbarena-cut)">
          <path
            d="M8.73 100L8.73 0L45.49 0Q70.70 0 84.23 13.03Q97.75 26.06 97.75 50.14Q97.75 74.08 84.44 87.04Q71.13 100 46.34 100ZM36.34 77.89L45.49 77.89Q58.03 77.89 63.73 71.13Q69.44 64.37 69.44 50Q69.44 35.63 63.73 28.87Q58.03 22.11 45.49 22.11L36.34 22.11Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(-8.73 0)"
          />
          <path
            d="M8.73 100L8.73 0L50.70 0Q69.86 0 80.35 6.55Q90.85 13.10 90.85 27.32Q90.85 33.38 88.52 37.75Q86.20 42.11 81.55 44.72Q76.90 47.32 70.14 48.17L70.14 48.45Q82.68 49.72 88.87 55.85Q95.07 61.97 95.07 72.39Q95.07 86.48 84.65 93.24Q74.23 100 54.93 100ZM36.34 78.87L53.10 78.87Q59.15 78.87 63.31 76.41Q67.46 73.94 67.46 68.59Q67.46 63.24 63.38 60.70Q59.30 58.17 53.10 58.17L36.34 58.17ZM36.34 40.14L49.58 40.14Q55.49 40.14 59.37 37.82Q63.24 35.49 63.24 30.70Q63.24 25.63 59.44 23.38Q55.63 21.13 49.58 21.13L36.34 21.13Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(82.28 0)"
          />
          <path
            d="M2.54 100L38.59 0L70 0L106.06 100L77.89 100L72.25 83.52L36.20 83.52L30.56 100ZM43.52 62.11L65.07 62.11L54.37 30.42Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(172.82 0)"
          />
          <path
            d="M8.73 100L8.73 0L56.48 0Q67.75 0 76.13 3.66Q84.51 7.32 89.08 13.94Q93.66 20.56 93.66 29.58Q93.66 36.62 90.99 42.04Q88.31 47.46 83.24 50.99Q78.17 54.51 70.99 55.77L70.70 54.37Q81.27 54.37 86.48 58.80Q91.69 63.24 92.25 71.83L94.51 100L66.34 100L64.93 76.62Q64.65 71.13 61.97 68.52Q59.30 65.92 52.54 65.92L36.34 65.92L36.34 100ZM36.34 43.80L51.41 43.80Q58.31 43.80 61.90 40.92Q65.49 38.03 65.49 32.82Q65.49 27.46 61.90 24.79Q58.31 22.11 51.41 22.11L36.34 22.11Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(268.14 0)"
          />
          <path
            d="M8.73 100L8.73 0L82.82 0L82.82 22.11L36.34 22.11L36.34 38.87L81.13 38.87L81.13 60.85L36.34 60.85L36.34 77.89L83.94 77.89L83.94 100Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(355.92 0)"
          />
          <path
            d="M8.73 100L8.73 0L36.62 0L70 56.34L70 0L97.61 0L97.61 100L69.72 100L36.34 46.48L36.34 100Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(433.13 0)"
          />
          <path
            d="M2.54 100L38.59 0L70 0L106.06 100L77.89 100L72.25 83.52L36.20 83.52L30.56 100ZM43.52 62.11L65.07 62.11L54.37 30.42Z"
            fill="currentColor"
            fillRule="evenodd"
            transform="translate(526.20 0)"
          />
        </g>
      </g>
    </svg>
  );
}
