import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Video, Square, Loader2, Play, Pause } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MediaRecorderProps {
  onRecordingComplete: (blob: Blob, type: 'audio' | 'video') => void;
  onCancel: () => void;
}

export function MediaRecorderComponent({ onRecordingComplete, onCancel }: MediaRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'audio' 
        ? { audio: true }
        : { video: { width: 1280, height: 720 }, audio: true };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setRecordingType(type);

      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.play();
      }

      const options = { 
        mimeType: type === 'audio' 
          ? 'audio/webm;codecs=opus' 
          : 'video/webm;codecs=vp8,opus'
      };
      
      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: type === 'audio' ? 'audio/webm' : 'video/webm' 
        });
        onRecordingComplete(blob, type);
        stopStream();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: error.message || 'Failed to access media devices',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      chunksRef.current = [];
    }
    stopStream();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setRecordingType(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && !recordingType) {
    return (
      <div className="flex gap-2 p-4 bg-muted rounded-lg">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => startRecording('audio')}
          className="flex-1"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Note
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => startRecording('video')}
          className="flex-1"
        >
          <Video className="h-4 w-4 mr-2" />
          Video Message
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted rounded-lg space-y-3">
      {recordingType === 'video' && (
        <video
          ref={videoPreviewRef}
          className="w-full rounded-lg border"
          muted
          playsInline
        />
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {recordingType === 'audio' ? (
            <Mic className={`h-5 w-5 ${isRecording && !isPaused ? 'text-destructive animate-pulse' : ''}`} />
          ) : (
            <Video className={`h-5 w-5 ${isRecording && !isPaused ? 'text-destructive animate-pulse' : ''}`} />
          )}
          <span className="text-sm font-medium">
            {isPaused ? 'Paused' : 'Recording'} {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePause}
            disabled={!isRecording}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelRecording}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            <Square className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </div>

      {recordingType === 'audio' && (
        <p className="text-xs text-muted-foreground">
          Max duration: 5 minutes
        </p>
      )}
      {recordingType === 'video' && (
        <p className="text-xs text-muted-foreground">
          Max duration: 2 minutes • Max size: 20MB
        </p>
      )}
    </div>
  );
}
