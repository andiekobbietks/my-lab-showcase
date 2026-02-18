import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebContainer } from '@webcontainer/api';
import '@xterm/xterm/css/xterm.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

let webcontainerInstance: WebContainer | null = null;

const WebTerminal = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const [status, setStatus] = useState<'booting' | 'ready' | 'error'>('booting');

    useEffect(() => {
        let isMounted = true;

        async function init() {
            try {
                if (!terminalRef.current) return;

                // 1. Initialize xterm.js
                const terminal = new Terminal({
                    cursorBlink: true,
                    theme: {
                        background: '#1a1b26',
                        foreground: '#a9b1d6',
                        cursor: '#f7768e',
                        selectionBackground: '#33467c',
                    },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                });
                const fitAddon = new FitAddon();
                terminal.loadAddon(fitAddon);
                terminal.open(terminalRef.current);
                fitAddon.fit();
                xtermRef.current = terminal;

                terminal.write('\x1b[1;34m⚡ WebContainer Booting...\x1b[0m\r\n');

                // 2. Boot WebContainer (only once)
                if (!webcontainerInstance) {
                    webcontainerInstance = await WebContainer.boot();
                }

                if (!isMounted) return;
                setStatus('ready');
                terminal.write('\x1b[1;32m✅ Ready.\x1b[0m\r\n');

                // 3. Start shell
                const shellProcess = await webcontainerInstance.spawn('jsh', {
                    terminal: {
                        cols: terminal.cols,
                        rows: terminal.rows,
                    }
                });

                // 4. Pipe I/O
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            terminal.write(data);
                        },
                    })
                );

                const input = shellProcess.input.getWriter();
                terminal.onData((data) => {
                    input.write(data);
                });

                window.addEventListener('resize', () => {
                    fitAddon.fit();
                    shellProcess.resize({
                        cols: terminal.cols,
                        rows: terminal.rows,
                    });
                });

            } catch (error) {
                console.error('WebContainer Boot Error:', error);
                if (isMounted) {
                    setStatus('error');
                    xtermRef.current?.write('\r\n\x1b[1;31m❌ Error booting WebContainer. Check Console.\x1b[0m');
                }
            }
        }

        init();

        return () => {
            isMounted = false;
            xtermRef.current?.dispose();
        };
    }, []);

    return (
        <Card className="w-full bg-[#1a1b26] border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-800 bg-[#16161e] flex flex-row items-center justify-between">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#f7768e]" />
                    <div className="w-3 h-3 rounded-full bg-[#e0af68]" />
                    <div className="w-3 h-3 rounded-full bg-[#9ae6b4]" />
                </div>
                <CardTitle className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    {status === 'booting' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {status === 'ready' ? 'jsh — webcontainer' : 'booting...'}
                </CardTitle>
                <div className="w-12" /> {/* spacer */}
            </CardHeader>
            <CardContent className="p-0">
                <div
                    ref={terminalRef}
                    className="h-[400px] w-full p-2"
                />
            </CardContent>
        </Card>
    );
};

export default WebTerminal;
