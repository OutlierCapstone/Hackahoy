const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());
app.post('/api/ping', (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.json({ output: "ERROR: No command provided." });
    }

    if (!/^ping -c 1 /.test(command)) {
        return res.json({
            output: "[!] SYSTEM ERROR: INVALID FORMAT.\n[!] USAGE: ping -c 1 <IP_ADDRESS>"
        });
    }

    // 금지어 목록
    const forbiddenWords = [
        'cat', 'more', 'less', 'tail', 'head', 'nl', 'od', 'vi', 'vim', 'nano', 'pico', 'rev',
        'rm', 'mv', 'cp', 'mkdir', 'rmdir', 'chmod', 'chown', 'touch', 'echo',
        'wget', 'curl', 'nc', 'netcat', 'ncat', 'ssh', 'telnet', 'ftp',
        'kill', 'pkill', 'reboot', 'shutdown', 'halt',
        'python', 'perl', 'ruby', 'php', 'node', 'deno', 'gcc', 'make',
        'flag', 'txt'
    ];

    for (const word of forbiddenWords) {
        if (command.includes(word)) {
            return res.json({
                output: `[!] CURSED SIGNAL DETECTED: '${word}'\n[!] TRANSMISSION BLOCKED.`
            });
        }
    }

    console.log(`Executing: ${command}`);

    exec(command, (error, stdout, stderr) => {
        const result = stdout || stderr || error?.message || "No signal.";
        res.json({ output: result });
    });
});

app.listen(5000, () => {
    console.log('Backend running on port 5000');
});