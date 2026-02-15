import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ResumeBuddy - AI-Powered Resume Analyzer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Twitter uses the same image as OpenGraph
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            opacity: 0.2,
            filter: 'blur(100px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            opacity: 0.2,
            filter: 'blur(100px)',
          }}
        />

        {/* Logo/Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0',
              lineHeight: 1.1,
            }}
          >
            ResumeBuddy
          </h1>
          <div
            style={{
              height: '4px',
              width: '200px',
              background: 'linear-gradient(to right, #7c3aed, #a855f7)',
              borderRadius: '4px',
              marginTop: '16px',
              marginBottom: '24px',
            }}
          />
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '32px',
            color: '#94a3b8',
            margin: '0',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          AI-Powered Resume Analyzer & ATS Score Checker
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          {['ATS Scoring', 'Interview Prep', 'AI Insights'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#a855f7',
                fontSize: '20px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <p
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: '#64748b',
          }}
        >
          www.resume-buddy.tech
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
