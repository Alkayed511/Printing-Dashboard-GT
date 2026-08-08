import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Radio, Volume2, Square, RefreshCw, Check, AlertCircle, Play, Pause, Layers, Smartphone, MessageSquareText, ShieldAlert } from 'lucide-react';
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
  const [textAnnouncement, setTextAnnouncement] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<VoiceNote[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<'hold' | 'click'>('click');
  const [tabMode, setTabMode] = useState<'voice' | 'text'>('voice');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Trigger mobile phone native audio recorder directly via HTML input
  const triggerMobileNativeRecorder = () => {
    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.click();
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setRecordingTime(Math.max(3, Math.round(file.size / 12000))); // estimate duration
      setErrorMessage(null);
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setSendSuccess(false);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Check if web mediaDevices is blocked (common on HTTP on mobile)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback directly to native mobile voice recorder!
      triggerMobileNativeRecorder();
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
      // Fallback automatically to native phone audio picker/recorder
      triggerMobileNativeRecorder();
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

  const sendVoiceNote = async (overrideBlob?: Blob, durationOverride?: number) => {
    const targetBlob = overrideBlob || audioBlob;
    if (!targetBlob) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
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

  // Send Text-to-Speech Announcement
  const sendTextAnnouncement = async (textToSend?: string) => {
    const msg = textToSend || textAnnouncement;
    if (!msg.trim()) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: `tts:${encodeURIComponent(msg)}`,
          sender: senderName,
          departmentId: selectedDept,
          durationSeconds: 5
        })
      });

      setIsSending(false);
      if (res.ok) {
        setSendSuccess(true);
        setTextAnnouncement('');
        fetchHistory();
        if (onNoteSent) onNoteSent();
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        setErrorMessage(isAr ? 'فشل إرسال التنبيه النصي' : 'Failed to send announcement');
      }
    } catch (e) {
      console.error(e);
      setIsSending(false);
      setErrorMessage(isAr ? 'حدث خطأ أثناء الإرسال' : 'Error sending announcement');
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

    if (note.audioUrl.startsWith('tts:')) {
      const text = decodeURIComponent(note.audioUrl.replace('tts:', ''));
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isAr ? 'ar-SA' : 'en-US';
        setPlayingHistoryId(note.id);
        utterance.onend = () => setPlayingHistoryId(null);
        window.speechSynthesis.speak(utterance);
      }
      return;
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
      {/* Hidden Mobile Native Audio Recorder Input */}
      <input
        ref={mobileFileInputRef}
        type="file"
        accept="audio/*"
        capture="microphone"
        onChange={handleMobileFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'البث والتنبيهات الصوتية المباشرة (Push To Talk)' : 'Live Voice Broadcast'}</span>
              <span className="text-xs bg-red-500/20 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                {isAr ? 'مُصمّم للهواتف وشاشات الورشة' : 'Mobile & Screen Ready'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAr 
                ? 'إرسال تنبيهات وصوتيات فورية من الهاتف أو الكمبيوتر إلى شاشات العرض' 
                : 'Send instant audio & voice alerts from mobile or PC to workshop displays'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Voice Mic vs Text Broadcast */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="bg-zinc-950 p-1 border border-zinc-800 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setTabMode('voice')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tabMode === 'voice' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isAr ? 'ميكروفون صوتي 🎤' : 'Voice Mic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTabMode('text')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tabMode === 'text' ? 'bg-secondary-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>{isAr ? 'تنبيه نصي وصوتي 📢' : 'Text Announcement'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
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
        <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {sendSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-bold">
            {isAr 
              ? 'تم بث الملاحظة والتنبيه الصوتي بنجاح إلى شاشات العرض!' 
              : 'Voice announcement broadcasted successfully to display screens!'}
          </span>
        </div>
      )}

      {/* TAB 1: VOICE RECORDING TAB */}
      {tabMode === 'voice' && (
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden space-y-4">
          {/* Animated Ripple pulse background when recording */}
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-48 h-48 rounded-full bg-red-500/10 animate-ping"></span>
              <span className="w-32 h-32 rounded-full bg-red-500/20 animate-pulse"></span>
            </div>
          )}

          {/* Mode Switcher for Mic */}
          <div className="flex items-center gap-2 self-center z-10 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setMode('click')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                mode === 'click' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAr ? 'نقر للبدء/الإيقاف' : 'Click Mode'}
            </button>
            <button
              type="button"
              onClick={() => setMode('hold')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                mode === 'hold' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAr ? 'ضغط مستمر للحديث' : 'Hold Mode'}
            </button>
          </div>

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
                  {mode === 'hold' ? (isAr ? 'اضغط للحديث' : 'Hold Mic') : (isAr ? 'سجّل صوتياً' : 'Tap Mic')}
                </span>
              </>
            )}
          </button>

          {/* Direct Mobile Native Mic Trigger Button for 100% guarantee on all phones */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={triggerMobileNativeRecorder}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Smartphone className="w-4 h-4 text-red-400" />
              <span>{isAr ? 'سجّل فوري عبر مسجل الهاتف (الموبايل) 📱' : 'Record via Phone Voice App 📱'}</span>
            </button>
          </div>

          {/* Recording Status & Preview */}
          <div className="text-center space-y-2 relative z-10 w-full">
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
                  ✨ {isAr ? `تم تسجيل الملاحظة الصوتية بنجاح - جاهزة للبث` : `Audio Recorded - Ready to broadcast`}
                </p>

                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <audio src={audioUrl} controls className="h-8 max-w-xs rounded-lg" />

                  <button
                    type="button"
                    onClick={() => sendVoiceNote()}
                    disabled={isSending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all"
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
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: TEXT-TO-SPEECH ANNOUNCEMENT TAB */}
      {tabMode === 'text' && (
        <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-secondary-400" />
              <span>{isAr ? 'اكتب التنبيه ليتم بثه بصوت واضح وشكل بارز على شاشات العرض:' : 'Type announcement to broadcast aloud:'}</span>
            </label>
            <textarea
              value={textAnnouncement}
              onChange={(e) => setTextAnnouncement(e.target.value)}
              rows={3}
              placeholder={isAr ? 'مثال: يرجى تجهيز طلب المطبعة رقم 105 فوراً، أو توجيه العميل بقسم الاستقبال...' : 'Example: Print job #105 is ready for delivery...'}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-secondary-500 resize-none font-medium"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-semibold">{isAr ? 'عبارات سريعة جاهزة بلمسة واحدة:' : 'Quick Presets:'}</span>
            <div className="flex flex-wrap gap-2">
              {[
                isAr ? 'أمر الطباعة جاهز للتسليم' : 'Order ready for pickup',
                isAr ? 'يرجى التوجه إلى قسم الاستقبال' : 'Please check reception',
                isAr ? 'تنبيه هام لفني المطبعة' : 'Important note for technician',
                isAr ? 'يرجى مراجعة ملف التصميم' : 'Please review design file'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTextAnnouncement(preset)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => sendTextAnnouncement()}
              disabled={isSending || !textAnnouncement.trim()}
              className="bg-secondary-600 hover:bg-secondary-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-secondary-600/20 transition-all"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isAr ? 'بث التنبيه الصوتي والنصي الآن 📢' : 'Broadcast Announcement 📢'}</span>
            </button>
          </div>
        </div>
      )}

      {/* History of Sent Broadcasts */}
      {history.length > 0 && (
        <div className="space-y-3 border-t border-zinc-800/80 pt-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-secondary-400" />
            {isAr ? 'سجل الملاحظات والتنبيهات الصوتية السابقة:' : 'Previous Broadcasts:'}
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {history.map((note) => {
              const isPlaying = playingHistoryId === note.id;
              const isTts = note.audioUrl.startsWith('tts:');
              const ttsText = isTts ? decodeURIComponent(note.audioUrl.replace('tts:', '')) : '';
              const formattedDate = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={note.id}
                  className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handlePlayHistory(note)}
                      className={`p-2 rounded-lg transition-all shrink-0 ${
                        isPlaying
                          ? 'bg-secondary-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="truncate">
                      <div className="font-bold text-zinc-200 flex items-center gap-2 flex-wrap">
                        <span>{note.sender}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                          {note.departmentId === 'all' 
                            ? (isAr ? 'جميع الشاشات' : 'All Screens')
                            : departments.find(d => d.id === note.departmentId)?.name || note.departmentId}
                        </span>
                      </div>
                      {isTts ? (
                        <p className="text-[11px] text-amber-300 font-medium truncate mt-0.5">📢 {ttsText}</p>
                      ) : (
                        <div className="text-[10px] text-zinc-500 mt-0.5">{formattedDate}</div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRebroadcast(note)}
                    disabled={isSending}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
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

