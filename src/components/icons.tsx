import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 3.75a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 .75.75V7.5h4.25a.75.75 0 0 1 .75.75v11.75a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V3.75Z" />
      <path d="M15 7.5V3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <path d="M8 12.5h3.5" />
      <path d="M8 16h5.5" />
      <path d="M15 13.5c1.5-1.5 1.5-4.5 0-6" />
      <path d="M15 17.5c2.5-2.5 2.5-7.5 0-10" />
      <circle cx="15" cy="13.5" r="1" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15" cy="17.5" r="1" fill="currentColor" />
    </svg>
  ),
  google: (props: SVGProps<SVGSVGElement>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Google</title>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.26-4.8 2.26-4.22 0-7.65-3.5-7.65-7.8s3.43-7.8 7.65-7.8c2.44 0 3.98 1.02 4.9 1.94l2.62-2.52C18.49 1.92 15.96 0 12.48 0 5.6 0 0 5.6 0 12.5S5.6 25 12.48 25c7.2 0 12-4.82 12-12.24 0-.76-.08-1.48-.2-2.24l-9.8.04z"
      />
    </svg>
  ),
};
