import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Copy, Play, ArrowLeft, Download, ExternalLink, Maximize, Save, Terminal as TerminalIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveLab, type Lab } from '@/lib/data';
import WebTerminal from '@/components/WebTerminal';

// The recorder script injects rrweb from CDN into the TARGET page (not our app)
const RECORD_SCRIPT = `
(function() {
  if (window._rrweb_stop) { window._rrweb_stop(); console.log('Stopped previous recording'); }

  // Load rrweb from CDN if not already loaded
  if (!window.rrweb) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
    s.onload = function() { startRecording(); };
    document.head.appendChild(s);
  } else {
    startRecording();
  }

  function startRecording() {
    var events = [];
    var paused = false;
    var startTime = Date.now();
    console.log('🎥 rrweb recording started...');
    console.log('Controls: pause() | resume() | stop() | status() | copyRecording()');
    var stopFn = rrweb.record({
      emit: function(event) {
        if (paused) return;
        if (events.length > 8000) return;
        events.push(event);
      },
      recordCanvas: true,
      collectFonts: true
    });

    window.pause = function() {
      if (paused) { console.log('⚠️ Already paused'); return; }
      paused = true;
      console.log('⏸️ Recording PAUSED (' + events.length + ' events so far)');
    };

    window.resume = function() {
      if (!paused) { console.log('⚠️ Already recording'); return; }
      paused = false;
      console.log('▶️ Recording RESUMED');
    };

    window.status = function() {
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log('📊 Status: ' + (paused ? 'PAUSED' : 'RECORDING'));
      console.log('   Events: ' + events.length + ' | Duration: ' + elapsed + 's');
    };

    window.stop = window._rrweb_stop = function() {
      stopFn();
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      var json = JSON.stringify(events);
      window._last_recording = json;
      console.log('🛑 Recording STOPPED');
      console.log('   ' + events.length + ' events | ' + elapsed + 's | ' + (json.length / 1024).toFixed(0) + ' KB');
      console.log('📋 Run: copy(window._last_recording) to copy to clipboard');
      return json;
    };

    window.copyRecording = function() {
      if (!window._last_recording) { console.log('⚠️ Call stop() first'); return; }
      navigator.clipboard.writeText(window._last_recording);
      console.log('✅ Copied ' + (window._last_recording.length / 1024).toFixed(0) + ' KB to clipboard!');
    };
  }
})();
`.trim();

const LabRecorder = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState("https://192.168.1.50/ui");
    const [events, setEvents] = useState<any[]>([]);
    const [jsonInput, setJsonInput] = useState("");
    const [replayerLoaded, setReplayerLoaded] = useState(false);
    const replayRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftSaved, setDraftSaved] = useState(false);

    const handleSaveAsDraft = () => {
        if (!draftTitle.trim()) {
            alert('Please enter a title for your draft lab.');
            return;
        }
        if (events.length === 0) {
            alert('No recording loaded. Import events first.');
            return;
        }
        const newLab: Lab = {
            id: crypto.randomUUID(),
            title: draftTitle,
            description: `rrweb recording with ${events.length} events`,
            tags: ['rrweb-recording', 'draft'],
            objective: '',
            environment: '',
            steps: ['Recording captured via Lab Recorder Station'],
            outcome: '',
            createdAt: new Date().toISOString(),
            status: 'draft',
            rrwebRecording: JSON.stringify(events),
        };
        saveLab(newLab);
        setDraftSaved(true);
        alert(`✅ Draft lab "${draftTitle}" saved! Go to Admin → Labs to review and edit.`);
    };

    const handleCopyScript = () => {
        navigator.clipboard.writeText(RECORD_SCRIPT);
        alert("✅ Recorder script copied to clipboard!\n\nNow paste it into the browser console (F12) on your Lab page.");
    };

    const handleDownloadScript = () => {
        const blob = new Blob([RECORD_SCRIPT], { type: 'text/javascript' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rrweb-recorder.js';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const loadJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                alert("JSON must be a non-empty array of rrweb events.");
                return;
            }
            setEvents(parsed);
            alert(`✅ Loaded ${parsed.length} events! Go to the 'Preview' tab to watch.`);
        } catch (e) {
            alert("❌ Invalid JSON. Make sure you copied the full output from window._rrweb_stop()");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                setEvents(parsed);
                alert(`✅ Loaded ${parsed.length} events from file!`);
            } catch {
                alert("❌ Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    // Load rrweb-player from CDN dynamically for replay
    const loadReplayerAndPlay = useCallback(async () => {
        if (!replayRef.current || events.length === 0) return;
        replayRef.current.innerHTML = '';

        // Load rrweb-player CSS + JS from CDN
        if (!replayerLoaded) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/style.css';
            document.head.appendChild(css);

            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/index.js';
                script.onload = () => { setReplayerLoaded(true); resolve(); };
                script.onerror = () => reject(new Error('Failed to load rrweb-player'));
                document.head.appendChild(script);
            });
        }

        // Use the global rrwebPlayer constructor
        const RRWebPlayer = (window as any).rrwebPlayer;
        if (RRWebPlayer) {
            new RRWebPlayer({
                target: replayRef.current,
                props: {
                    events,
                    showController: true,
                    autoPlay: true,
                    width: 1200,
                    height: 500,
                },
            });
        } else {
            replayRef.current.innerHTML = '<p class="p-10 text-red-500">Failed to load rrweb-player. Check your internet connection.</p>';
        }
    }, [events, replayerLoaded]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
                        <Rocket className="h-8 w-8 text-blue-600" />
                        Lab Recorder Station
                    </h1>
                </div>

                <Tabs defaultValue="record" className="w-full">
                    <TabsList>
                        <TabsTrigger value="record">🔴 Record</TabsTrigger>
                        <TabsTrigger value="terminal" className="gap-2">
                            <TerminalIcon className="h-4 w-4" /> Terminal
                        </TabsTrigger>
                        <TabsTrigger value="import">📥 Import</TabsTrigger>
                        <TabsTrigger value="preview">▶️ Preview</TabsTrigger>
                    </TabsList>

                    {/* 🖥️ TERMINAL TAB */}
                    <TabsContent value="terminal" className="space-y-4">
                        <WebTerminal />
                        <Card className="border-blue-500/20 bg-blue-500/5">
                            <CardHeader>
                                <CardTitle className="text-sm">💡 Tip: Recording the Terminal</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Just like with other labs, you can paste the **Recorder Script** into this terminal's browser console (F12) to capture your CLI interactions!
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══════════ RECORD TAB ═══════════ */}
                    <TabsContent value="record" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Target Lab URL</CardTitle>
                                <CardDescription>Enter the URL of your vSphere/ESXi client. The iframe below will attempt to load it.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" placeholder="https://192.168.1.50/ui" />
                                <Button variant="outline" onClick={() => iframeRef.current?.setAttribute('src', url)}>Load</Button>
                                <Button variant="default" className="bg-green-600 hover:bg-green-700 gap-2 whitespace-nowrap" onClick={() => window.open(url, '_blank', 'noopener')}>
                                    <Maximize className="h-4 w-4" /> Open Full Screen
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT: Iframe */}
                            <div className="lg:col-span-2 border rounded-lg h-[500px] bg-gray-900 relative overflow-hidden">
                                <iframe
                                    ref={iframeRef}
                                    src={url}
                                    className="w-full h-full border-0"
                                    sandbox="allow-same-origin allow-scripts allow-forms"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                                    <p className="text-white text-xs">⚠️ If this iframe is blank/blocked, use <b>Manual Mode</b> → or click <b>Open Full Screen</b> above</p>
                                    <Button size="sm" variant="secondary" className="gap-1 text-xs" onClick={() => window.open(url, '_blank', 'noopener')}>
                                        <ExternalLink className="h-3 w-3" /> New Tab
                                    </Button>
                                </div>
                            </div>

                            {/* RIGHT: Manual Instructions */}
                            <div className="space-y-4">
                                <Card className="border-blue-500/20 bg-blue-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg">📋 Manual Recording</CardTitle>
                                        <CardDescription>The recommended approach — works with any web UI:</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                                            <li>
                                                <strong className="text-foreground">Open Lab in New Tab</strong>
                                                <p className="pl-5 mt-0.5">Navigate to your vSphere, ESXi, or VCSA web client.</p>
                                            </li>
                                            <li>
                                                <strong className="text-foreground">Open DevTools → Console</strong>
                                                <p className="pl-5 mt-0.5">Press <code className="bg-muted px-1 rounded">F12</code> → click <b>Console</b> tab.</p>
                                            </li>
                                            <li>
                                                <strong className="text-foreground">Paste the Script & Enter</strong>
                                                <p className="pl-5 text-xs italic text-green-600">You'll see: "🎥 rrweb recording started..."</p>
                                            </li>
                                            <li>
                                                <strong className="text-foreground">Do Your Lab Work</strong>
                                                <p className="pl-5 mt-0.5">Click menus, run commands, navigate. Pause anytime!</p>
                                            </li>
                                        </ol>

                                        {/* Controls Reference */}
                                        <div className="border rounded p-3 bg-muted/20 space-y-1.5">
                                            <p className="font-semibold text-foreground text-xs">🎮 Console Commands:</p>
                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                <code className="bg-muted px-1.5 py-0.5 rounded">pause()</code>
                                                <span className="text-muted-foreground">⏸️ Pause recording</span>
                                                <code className="bg-muted px-1.5 py-0.5 rounded">resume()</code>
                                                <span className="text-muted-foreground">▶️ Resume recording</span>
                                                <code className="bg-muted px-1.5 py-0.5 rounded">status()</code>
                                                <span className="text-muted-foreground">📊 Check events & time</span>
                                                <code className="bg-muted px-1.5 py-0.5 rounded">stop()</code>
                                                <span className="text-muted-foreground">🛑 Stop recording</span>
                                                <code className="bg-muted px-1.5 py-0.5 rounded">copyRecording()</code>
                                                <span className="text-muted-foreground">📋 Copy JSON to clipboard</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleCopyScript} className="flex-1 gap-2">
                                                <Copy className="h-4 w-4" /> Copy Script
                                            </Button>
                                            <Button onClick={handleDownloadScript} variant="outline" className="gap-2">
                                                <Download className="h-4 w-4" /> .js
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ═══════════ IMPORT TAB ═══════════ */}
                    <TabsContent value="import">
                        <Card>
                            <CardHeader>
                                <CardTitle>Import Recording</CardTitle>
                                <CardDescription>Paste the JSON from <code className="bg-muted px-1 rounded">window._last_recording</code> or upload a .json file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    className="w-full h-[300px] font-mono text-xs p-4 border rounded bg-muted/30"
                                    placeholder='Paste JSON here: [{"type":1,"data":{...}}, ...]'
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={loadJson} className="gap-2">
                                        <Play className="h-4 w-4" /> Load JSON
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <label className="cursor-pointer gap-2">
                                            📁 Upload .json File
                                            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </Button>
                                    {events.length > 0 && (
                                        <span className="text-sm text-green-600 self-center ml-auto">✅ {events.length} events loaded</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══════════ PREVIEW TAB ═══════════ */}
                    <TabsContent value="preview">
                        <Card>
                            <CardHeader>
                                <CardTitle>Replay Preview</CardTitle>
                                <CardDescription>
                                    {events.length > 0
                                        ? `${events.length} events ready. Click Play to watch.`
                                        : 'No events loaded yet. Import a recording first.'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-4">
                                    <Button onClick={loadReplayerAndPlay} disabled={events.length === 0} className="gap-2">
                                        <Play className="h-4 w-4" /> Play Recording
                                    </Button>
                                </div>
                                <div
                                    ref={replayRef}
                                    className="border rounded shadow-lg w-full min-h-[500px] bg-white overflow-hidden relative"
                                >
                                    {events.length === 0 && (
                                        <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                                            No events loaded. Go to 📥 Import first.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* SAVE AS DRAFT */}
                        {events.length > 0 && (
                            <Card className="border-green-500/20 bg-green-500/5 mt-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">💾 Save as Draft Lab</CardTitle>
                                    <CardDescription>Save this recording as a draft lab. It will appear in Admin → Labs for you to review, add details, and publish.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-4">
                                        <Input
                                            value={draftTitle}
                                            onChange={(e) => setDraftTitle(e.target.value)}
                                            placeholder="Lab title, e.g. 'vSphere VM Provisioning Demo'"
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleSaveAsDraft}
                                            disabled={draftSaved}
                                            className="bg-green-600 hover:bg-green-700 gap-2 whitespace-nowrap"
                                        >
                                            <Save className="h-4 w-4" />
                                            {draftSaved ? '✅ Saved!' : 'Save as Draft'}
                                        </Button>
                                    </div>
                                    {draftSaved && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2">
                                                <ArrowLeft className="h-4 w-4" /> Go to Admin → Labs
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setDraftSaved(false); setDraftTitle(''); }}>
                                                Save Another
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default LabRecorder;
