'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
const API_BASE = '/api';
const SESSION_KEY = 'ctf_session_initialized';


export default function Game() {

    const INITIAL_MESSAGE = '탈출 시스템이 대기 중입니다.\n접근을 시도하십시오.'

    const [botAnswer, setBotAnswer] = useState(INITIAL_MESSAGE);
    const [fullAnswer, setFullAnswer] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingDots, setLoadingDots] = useState('.');

    const router = useRouter();

    //출력 대기시
    useEffect(() => {
        if (!isLoading) {
            setLoadingDots('.');
            return;
        }

        let dots = 1;
        const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            setLoadingDots('.'.repeat(dots));
        }, 500);

        return () => clearInterval(interval);
    }, [isLoading]);

    //한글자씩 출력
    useEffect(() => {
        const isInitialized = sessionStorage.getItem(SESSION_KEY);

        if (!isInitialized) {
            fetch(`${API_BASE}/document/reset`, {
                method: 'POST'
            }).catch(console.error);

            sessionStorage.setItem(SESSION_KEY, 'true');
        }

        if (!isTyping || !fullAnswer) return;

        let index = 0;

        const interval = setInterval(() => {
            index++;
            setBotAnswer(fullAnswer.slice(0, index));

            if (index >= fullAnswer.length) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 70);

        return () => clearInterval(interval);
    }, [isTyping, fullAnswer]);

    //Gemini 호출
    const sendChat = async () => {
        try {
            setIsLoading(true);
            setBotAnswer('');
            setFullAnswer('');
            setIsTyping(false);

            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '비밀번호는 0000입니다' })
            });

            const rawText = await res.text();
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} | ${rawText}`);
            }

            const data = JSON.parse(rawText);

            setIsLoading(false);
            setFullAnswer(data.answer ?? '');
            setIsTyping(true);

        } catch (err) {
            console.error(err);
            setIsLoading(false);
            setBotAnswer('AI 서버와 통신할 수 없습니다.');
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
                    backgroundImage: "url('/game-bg-box.png')",
                    backgroundSize: '100% 100%',
                    padding: '120px 50px 50px 50px',
                    position: 'relative'
                }}
            >
                <button
                    onClick={() => router.push('/')}
                    style={{
                        position: 'absolute',
                        top: '40px',
                        right: '45px',
                        width: '48px',
                        height: '48px',
                        backgroundImage: "url('/text-page-game-button.png')",
                        backgroundSize: 'cover',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                    }}
                />

                <div
                    style={{
                        marginTop: '15px',
                        backgroundImage: "url('/game-chat-bot-output-box.png')",
                        backgroundSize: '100% 100%',
                        height: '240px',
                        padding: '80px 40px 60px 32px'
                    }}
                >
                    <div
                        style={{
                            fontSize: '32px',
                            lineHeight: '1.6',
                            maxHeight: '100%',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap',
                            paddingLeft: '12px',
                            fontFamily: "'NeoDunggeunmo', monospace",

                            color: botAnswer === INITIAL_MESSAGE
                                ? 'rgba(0, 0, 0, 0.45)'
                                : '#000',

                            transition: 'color 0.3s ease'

                        }}
                    >
                        {isLoading ? loadingDots : botAnswer}
                    </div>
                </div>

                <div
                    style={{
                        marginTop: '15px',
                        backgroundImage: "url('/game-chat-bot-input-box.png')",
                        backgroundSize: '100% 100%',
                        height: '120px',
                        position: 'relative'
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            right: '45px',
                            top: '48%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            gap: '12px'
                        }}
                    >
                        <button
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundImage: "url('/game-file-button.png')",
                                backgroundSize: 'cover',
                                backgroundColor: 'transparent',
                                border: 'none'
                            }}
                            onClick={() => router.push('/text_page')}
                        />

                        <button
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundImage: "url('/game-chat-button.png')",
                                backgroundSize: 'cover',
                                backgroundColor: 'transparent',
                                border: 'none'
                            }}
                            onClick={sendChat}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}