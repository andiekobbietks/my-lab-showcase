import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Copy, Play, ArrowLeft, Download, ExternalLink, Maximize, Save, Terminal as TerminalIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type Lab } from '@/lib/data';
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
    const saveLabMutation = useMutation(api.mutations.saveLab);
    const [url, setUrl] = useState("https://192.168.1.50/ui");
    const [events, setEvents] = useState<any[]>([]);
    const [jsonInput, setJsonInput] = useState("");
    const [replayerLoaded, setReplayerLoaded] = useState(false);
    const replayRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftSaved, setDraftSaved] = useState(false);

    const handleSaveAsDraft = async () => {
        if (!draftTitle.trim()) {
            alert('Please enter a title for your draft lab.');
            return;
        }
        if (events.length === 0) {
            alert('No recording loaded. Import events first.');
            return;
        }
        try {
            await saveLabMutation({
                title: draftTitle,
                description: `rrweb recording with ${events.length} events`,
                tags: ['rrweb-recording', 'draft'],
                objective: '',
                environment: '',
                steps: ['Recording captured via Lab Recorder Station'],
                outcome: '',
                status: 'draft',
                rrwebRecording: JSON.stringify(events),
            });
            setDraftSaved(true);
            alert(`✅ Draft lab "${draftTitle}" saved to Convex! Go to Admin → Labs to review and edit.`);
        } catch (err) {
            alert('❌ Failed to save draft to Convex.');
        }
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
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="container max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-12 w-12 rounded-2xl bg-secondary/50 hover:bg-secondary">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase flex items-center gap-3">
                                <Rocket className="h-10 w-10 text-blue-600" />
                                Lab Recorder Station
                            </h1>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 ml-1">Evidence Capture & Specification Hub</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="rounded-xl border-border/60">
                            Back to Registry
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="record" className="space-y-8">
                    <TabsList className="bg-secondary/30 p-1 border border-border/40 rounded-2xl w-full flex overflow-x-auto h-auto scrollbar-hide">
                        <TabsTrigger value="record" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">🔴 Record</TabsTrigger>
                        <TabsTrigger value="terminal" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md gap-2">
                            <TerminalIcon className="h-4 w-4" /> Terminal
                        </TabsTrigger>
                        <TabsTrigger value="import" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">📥 Import</TabsTrigger>
                        <TabsTrigger value="preview" className="rounded-xl px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md">▶️ Preview</TabsTrigger>
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
                    <TabsContent value="record" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden p-2">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Target Lab Infrastructure</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary/60">Configure orchestration endpoint for evidence capture</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono h-14 rounded-2xl bg-secondary/30 pr-12 focus:bg-background transition-all" placeholder="https://192.168.1.50/ui" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                        <ExternalLink className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => iframeRef.current?.setAttribute('src', url)} className="h-14 px-8 rounded-2xl font-bold">Initialize</Button>
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 h-14 px-8 rounded-2xl font-bold gap-3 shadow-lg shadow-blue-500/20" onClick={() => window.open(url, '_blank', 'noopener')}>
                                        <Maximize className="h-5 w-5" /> Open Full Screen
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT: Iframe */}
                            <div className="lg:col-span-2 border border-border/50 rounded-[2rem] h-[600px] bg-secondary/20 relative overflow-hidden shadow-inner group">
                                <iframe
                                    ref={iframeRef}
                                    src={url}
                                    title="Lab Infrastructure Preview"
                                    className="w-full h-full border-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                                    sandbox="allow-same-origin allow-scripts allow-forms"
                                />
                                <div className="absolute bottom-6 left-6 right-6 bg-background/80 backdrop-blur-md border border-border/40 p-4 rounded-2xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Infrastructure Status</p>
                                        <p className="text-muted-foreground text-xs font-medium">If frame is blocked (X-Frame-Options), use <b>Full Screen</b> mode.</p>
                                    </div>
                                    <Button size="sm" variant="secondary" className="gap-2 text-[10px] font-black uppercase h-9 px-4 rounded-xl" onClick={() => window.open(url, '_blank', 'noopener')}>
                                        <ExternalLink className="h-3 w-3" /> New Window
                                    </Button>
                                </div>
                            </div>

                            {/* RIGHT: Manual Instructions */}
                            <div className="space-y-6">
                                <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">Technical Evidence Protocol</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">High-Fidelity Manual Capture Strategy</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 space-y-6 text-sm">
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
