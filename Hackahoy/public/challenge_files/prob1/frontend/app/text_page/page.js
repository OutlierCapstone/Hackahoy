'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
const API_BASE = '/api';

export default function TextPage() {
    const router = useRouter();
    const [text, setText] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${API_BASE}/document`);
                const data = await res.json();
                setText(data.text || '');
            } catch (err) {
                console.error('Load document error:', err);
            }
        }
        load();
    }, []);

    const saveText = async () => {
        try {
            await fetch(`${API_BASE}/document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        } catch (err) {
            console.error('Save document error:', err);
        }
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundImage: "url('/game-bg.png')",
                backgroundSize: 'cover',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <div
                style={{
                    width: '900px',
                    height: '550px',
                    backgroundImage: "url('/text-page-bg-box.png')",
                    backgroundSize: '100% 100%',
                    padding: '120px 50px 50px 50px',
                    position: 'relative'
                }}
            >
                <button
                    onClick={async () => {
                        await saveText();
                        router.push('/game');
                    }}
                    style={{
                        position: 'absolute',
                        top: '85px',
                        right: '100px',
                        width: '48px',
                        height: '48px',
                        backgroundImage: "url('/text-page-game-button.png')",
                        backgroundSize: 'cover',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                    }}
                />

                <textarea
                    value={text}
                    placeholder="여기에 문서를 작성하시오."
                    onChange={(e) => setText(e.target.value)}
                    style={{
                        width: '93%',
                        height: 'calc(100% - 50px)',
                        resize: 'none',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '28px',
                        paddingTop: '40px',
                        paddingLeft: '40px',
                        outline: 'none',
                        fontFamily: "'NeoDunggeunmo', monospace"
                    }}
                />
            </div>
        </div>
    );
}
