'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundImage: "url('/home-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <button
                onClick={() => router.push('/game')}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.93)';
                    e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                }}
                style={{
                    width: '400px',
                    height: '150px',
                    backgroundImage: "url('/home-button.png')",
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease, filter 0.1s ease'
                }}
            />
        </div>
    );
}
