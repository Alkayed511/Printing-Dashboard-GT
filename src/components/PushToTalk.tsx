import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Radio, Volume2, Square, RefreshCw, Check, AlertCircle, Play, Pause, Layers } from 'lucide-react';
import { Department, VoiceNote } from '../types';

interface PushToTalkProps {
  departments?: Department[];
  language?: 'ar' | 'en';
  onNoteSent?: () => void;
}

export const PushToTalk: React.FC<PushToTalkProps> = ({ departments = [], language = 'ar', onNoteSent }) => {
  const isAr = language === 'ar';
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [senderName, setSenderName] = useState<string>(isAr ? 'إدارة المطبعة' : 'Management');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<VoiceNote[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<'hold' | 'click'>('click');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch voice notes history
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/voice-notes');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.voiceNotes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Cleanup audio preview
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return undefined;
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return undefined;
  };

  const requestPermission = async () => {
    setErrorMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setErrorMessage(
          isAr
            ? 'متصفحات الهواتف تمنع الميكروفون على روابط الشبكة غير المشفرة. يُرجى فتح رابط WAN المباشر من قسم الإعدادات لتفعيل الميكروفون.'
            : 'Mobile browsers block microphone on unencrypted HTTP. Please open using the secure WAN link in Settings.'
        );
      } else {
        setErrorMessage(
          isAr
            ? 'المتصفح على هذا الهاتف لا يدعم التسجيل المباشر. يمكنك استخدام زر خيار التسجيل بالملف أسفله.'
            : 'Browser does not support direct mic recording. Use the audio file upload option below.'
        );
      }
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // stop test stream tracks
      stream.getTracks().forEach((track) => track.stop());
      setErrorMessage(null);
      return true;
    } catch (err: any) {
      console.error('Permission error:', err);
      let msg = isAr
        ? 'تعذر الوصول إلى الميكروفون. يُرجى النقر على إيقونة القفل 🔒 في أعلى المتصفح والسماح بالميكروفون.'
        : 'Microphone permission blocked. Please enable permission in your browser settings.';
      setErrorMessage(msg);
      return false;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setSendSuccess(false);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setErrorMessage(
          isAr
            ? 'متصفح الجوال يتطلب رابطًا مشفرًا (HTTPS) أو رابط WAN لتفعيل الميكروفون. يمكنك نسخ رابط WAN من قسم الإعدادات بلمسة واحدة.'
            : 'Mobile browsers require HTTPS or WAN secure connection for microphone. Get the WAN link from Settings.'
        );
      } else {
        setErrorMessage(
          isAr
            ? 'تعذر العثور على واجهة الميكروفون في المتصفح.'
            : 'Microphone API not available in this browser.'
        );
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(recordedBlob);
        const url = URL.createObjectURL(recordedBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      let msg = isAr 
        ? 'تعذر الوصول إلى الميكروفون. انقر على زر "تفعيل أذونات الميكروفون" أدناه أو اسمح بالصلاحيات من إعدادات المتصفح.' 
        : 'Could not access microphone. Tap "Grant Mic Permission" below or update browser settings.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = isAr
          ? 'تم حظر الميكروفون! اضغط على علامة القفل 🔒 بطلب المتصفح بجانب الرابط للسمح بالميكروفون.'
          : 'Microphone blocked by browser policy. Allow access via browser lock icon.';
      }
      setErrorMessage(msg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleMouseDown = () => {
    if (mode === 'hold') {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (mode === 'hold' && isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode === 'hold') {
      e.preventDefault();
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (mode === 'hold' && isRecording) {
      e.preventDefault();
      stopRecording();
    }
  };

  const handleMicClick = () => {
    if (mode === 'click') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setRecordingTime(5); // estimated duration
      setErrorMessage(null);
    }
  };

  const sendVoiceNote = async (overrideBlob?: Blob, durationOverride?: number) => {
    const targetBlob = overrideBlob || audioBlob;
    if (!targetBlob) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      // Convert blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(targetBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const durationSeconds = durationOverride || recordingTime || 3;

        const res = await fetch('/api/voice-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Data,
            sender: senderName,
            departmentId: selectedDept,
            durationSeconds
          })
        });

        setIsSending(false);

        if (res.ok) {
          setSendSuccess(true);
          setAudioBlob(null);
          setAudioUrl(null);
          setRecordingTime(0);
          fetchHistory();
          if (onNoteSent) onNoteSent();
          setTimeout(() => setSendSuccess(false), 3000);
        } else {
          setErrorMessage(isAr ? 'فشل إرسال الملاحظة الصوتية' : 'Failed to send voice note');
        }
      };
    } catch (err) {
      console.error(err);
      setIsSending(false);
      setErrorMessage(isAr ? 'حدث خطأ أثناء الإرسال' : 'Error sending audio');
    }
  };

  const handlePlayHistory = (note: VoiceNote) => {
    if (playingHistoryId === note.id && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setPlayingHistoryId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    const audio = new Audio(note.audioUrl);
    currentAudioRef.current = audio;
    setPlayingHistoryId(note.id);

    audio.play().catch(console.error);
    audio.onended = () => setPlayingHistoryId(null);
  };

  const handleRebroadcast = async (note: VoiceNote) => {
    setIsSending(true);
    try {
      const res = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: note.audioUrl,
          sender: note.sender,
          departmentId: note.departmentId,
          durationSeconds: note.durationSeconds
        })
      });

      setIsSending(false);
      if (res.ok) {
        setSendSuccess(true);
        fetchHistory();
        setTimeout(() => setSendSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {isAr ? 'الملاحظات الصوتية المباشرة (Push To Talk)' : 'Live Voice Notes (Push To Talk)'}
              <span className="text-xs bg-red-500/20 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                {isAr ? 'بث حي للشاشات' : 'Live Broadcast'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              {isAr 
                ? 'تسجيل وإرسال تنبيهات صوتية فورية لشاشات العرض في الورشة والمطبعة' 
                : 'Record & broadcast instant voice announcements to workshop display screens'}
            </p>
          </div>
        </div>

        {/* Mode & Dept controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-zinc-950 p-1 border border-zinc-800 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setMode('click')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === 'click' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAr ? 'نقر للبدء' : 'Click Mode'}
            </button>
            <button
              type="button"
              onClick={() => setMode('hold')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === 'hold' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAr ? 'ضغط مستمر' : 'Hold Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Target Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-secondary-400" />
            {isAr ? 'وجهة البث الصوتي (الشاشات المستهدفة):' : 'Target Display Screens:'}
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-secondary-500 font-semibold"
          >
            <option value="all">📢 {isAr ? 'جميع شاشات العرض والمطابع (عام)' : 'All Display Screens (Broadcasting)'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                🏬 {isAr ? `قسم: ${d.name}` : `Department: ${d.name}`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-primary-400" />
            {isAr ? 'اسم المرسل الظاهر على الشاشة:' : 'Sender Display Name:'}
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={isAr ? 'إدارة المطبعة' : 'Management'}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-secondary-500 font-semibold"
          />
        </div>
      </div>

      {/* Error / Success Alerts */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {sendSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-bold">
            {isAr 
              ? ' تم بث الملاحظة الصوتية بنجاح إلى شاشات العرض المستهدفة!' 
              : ' Voice note broadcasted successfully to display screens!'}
          </span>
        </div>
      )}

      {/* Push-To-Talk Main Recorder UI */}
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden space-y-4">
        {/* Animated Ripple pulse background when recording */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-48 h-48 rounded-full bg-red-500/10 animate-ping"></span>
            <span className="w-32 h-32 rounded-full bg-red-500/20 animate-pulse"></span>
          </div>
        )}

        {/* Big Recording Button */}
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleMicClick}
          disabled={isSending}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer select-none active:scale-95 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/50 ring-8 ring-red-500/30 scale-105'
              : audioUrl
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30'
              : 'bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border-2 border-zinc-700 text-zinc-100'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-8 h-8 fill-current mb-1 animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider">{formatTime(recordingTime)}</span>
            </>
          ) : (
            <>
              <Mic className={`w-9 h-9 mb-1 ${audioUrl ? 'text-white' : 'text-red-400'}`} />
              <span className="text-[11px] font-extrabold">
                {mode === 'hold' ? (isAr ? 'اضغط واستمر' : 'Hold Mic') : (isAr ? 'انقر للتحدث' : 'Tap Mic')}
              </span>
            </>
          )}
        </button>

        {/* Permission Request & Mobile File Recording Alternative */}
        <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
          <button
            type="button"
            onClick={requestPermission}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-all"
          >
            <Mic className="w-3.5 h-3.5 text-red-400" />
            <span>{isAr ? 'طلب أذونات الميكروفون 🎤' : 'Request Mic Permission 🎤'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-secondary-400" />
            <span>{isAr ? 'تسجيل/رفع ملف صوتي 📁' : 'Record/Upload Audio File 📁'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            capture="microphone"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Recording status & Live Wave Animation */}
        <div className="text-center space-y-2 relative z-10">
          {isRecording ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 h-6">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-6 bg-red-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
              </div>
              <p className="text-xs text-red-400 font-bold animate-pulse">
                🔴 {isAr ? 'جاري التسجيل الصوتي المباشر...' : 'Live Recording...'}
              </p>
            </div>
          ) : audioUrl ? (
            <div className="space-y-3">
              <p className="text-xs text-emerald-400 font-bold">
                ✨ {isAr ? `تم تسجيل ملاحظة بصوت ${formatTime(recordingTime)} - جاهزة للبث` : `Audio Recorded (${formatTime(recordingTime)}) - Ready to send`}
              </p>

              {/* Audio Player & Quick Actions */}
              <div className="flex items-center gap-3 justify-center">
                <audio src={audioUrl} controls className="h-8 max-w-xs rounded-lg" />

                <button
                  type="button"
                  onClick={() => sendVoiceNote()}
                  disabled={isSending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isAr ? 'بث الآن للشاشات 🚀' : 'Broadcast Now 🚀'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setRecordingTime(0);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-xl transition-all"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              {mode === 'hold'
                ? (isAr ? 'اضغط مع الاستمرار على الميكروفون للتحدث وسيبه عند الانتهاء' : 'Press and hold to speak, release to complete')
                : (isAr ? 'انقر على زر الميكروفون للبدء، ثم انقر مرة أخرى لإيقاف التسجيل' : 'Tap mic button to start recording, tap again to stop')}
            </p>
          )}
        </div>
      </div>

      {/* History of Sent Broadcasts */}
      {history.length > 0 && (
        <div className="space-y-3 border-t border-zinc-800/80 pt-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-secondary-400" />
            {isAr ? 'سجل الملاحظات الصوتية المباشرة السابقة:' : 'Previous Voice Announcements:'}
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {history.map((note) => {
              const isPlaying = playingHistoryId === note.id;
              const formattedDate = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={note.id}
                  className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlayHistory(note)}
                      className={`p-2 rounded-lg transition-all ${
                        isPlaying
                          ? 'bg-secondary-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="font-bold text-zinc-200 flex items-center gap-2">
                        <span>{note.sender}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                          {note.departmentId === 'all' 
                            ? (isAr ? 'جميع الشاشات' : 'All Screens')
                            : departments.find(d => d.id === note.departmentId)?.name || note.departmentId}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{formattedDate}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRebroadcast(note)}
                    disabled={isSending}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    <span>{isAr ? 'إعادة البث' : 'Re-broadcast'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
