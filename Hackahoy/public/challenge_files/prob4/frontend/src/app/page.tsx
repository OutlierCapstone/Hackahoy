"use client";

import React, { useState } from "react";
import Entity from "@/components/radio/entity";
import Screen from "@/components/radio/screen";
import TextBox from "@/components/button/textbox";
import DefaultButton from "@/components/button/default-button";
import { Speaker } from "@/components/radio/decorations";

export default function CursedRadioPage() {
    // 1. 상태 관리 (입력값, 출력값, 로딩상태)
    const [command, setCommand] = useState("ping -c 1 127.0.0.1");
    const [output, setOutput] = useState("> SYSTEM READY.\n> WAITING FOR SIGNAL...");
    const [loading, setLoading] = useState(false);

    // 2. 입력값 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(e.target.value);
    };

    // 3. 전송(Send) 버튼 핸들러
    const handleSend = async () => {
        if (!command) return;

        setLoading(true);
        setOutput("> SENDING SIGNAL...");

        try {
            const res = await fetch('/api/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command }),
            });

            const data = await res.json();

            setOutput(`> COMMAND: ${command}\n\n${data.output}`);
        } catch (error) {
            setOutput("> ERROR: FAILED TO CONNECT TO SERVER.");
        } finally {
            setLoading(false);
        }
    };

    // 4. 리셋 버튼 핸들러
    const handleReset = () => {
        setCommand("ping -c 1 127.0.0.1");
        setOutput("> SYSTEM REBOOTED.\n> READY.");
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Entity>
                <Screen>
                    <TextBox
                        mode="input"
                        placeholder="Enter Target IP..."
                        value={command}
                        onChange={handleChange}
                    />

                    <TextBox mode="output">
                        {output}
                    </TextBox>
                </Screen>
                <Speaker />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <DefaultButton
                        variant="danger"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Reset
                    </DefaultButton>

                    <DefaultButton
                        variant="primary"
                        onClick={handleSend}
                        disabled={loading}
                    >
                        {loading ? "Ping..." : "Send"}
                    </DefaultButton>
                </div>
            </Entity>
        </div>
    );
}