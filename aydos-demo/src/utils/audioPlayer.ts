/**
 * Audio Engine managing pre-recorded audio tracks and Web Speech synthesis fallback.
 */

type BoundaryCallback = (charIndex: number, charLength: number) => void;
type StateCallback = (isPlaying: boolean, isPaused: boolean) => void;
type EndCallback = () => void;
type ProgressCallback = (progressPct: number, currentTimeSec: number, durationSec: number) => void;

class AudioEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isSynthesizing = false;
  private isAudioElementPlaying = false;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private boundaryListeners: BoundaryCallback[] = [];
  private stateListeners: StateCallback[] = [];
  private endListeners: EndCallback[] = [];
  private progressListeners: ProgressCallback[] = [];

  // Playback parameters
  private currentRate = 1.0;
  private currentPitch = 1.0;
  private currentVolume = 1.0;
  private isMuted = false;

  // Active track cache for rewind/replay
  private currentText = "";
  private currentAudioUrl?: string;
  private currentOnSlideEnd?: () => void;
  private estimatedDuration = 10;
  private speechStartTime = 0;
  private speechElapsedBeforePause = 0;
  private speechTimer: number | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.selectBestVoice();
      };
      this.selectBestVoice();
    }
  }

  private selectBestVoice(genderPreference?: "female" | "male" | "default") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const englishVoices = voices.filter(
      (v) => v.lang.startsWith("en-") || v.lang === "en"
    );

    let selected: SpeechSynthesisVoice | undefined;

    if (genderPreference === "female") {
      selected = englishVoices.find(
        (v) =>
          v.name.includes("Female") ||
          v.name.includes("Samantha") ||
          v.name.includes("Zira") ||
          v.name.includes("Victoria") ||
          v.name.includes("Natural")
      );
    } else if (genderPreference === "male") {
      selected = englishVoices.find(
        (v) =>
          v.name.includes("Male") ||
          v.name.includes("Daniel") ||
          v.name.includes("David") ||
          v.name.includes("Guy") ||
          v.name.includes("George")
      );
    }

    if (!selected) {
      selected =
        englishVoices.find(
          (v) =>
            v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.default
        ) ||
        englishVoices[0] ||
        voices[0];
    }

    this.currentVoice = selected;
  }

  public setVoicePreference(gender: "female" | "male" | "default") {
    this.selectBestVoice(gender);
  }

  public setRate(rate: number) {
    this.currentRate = Math.max(0.5, Math.min(2.5, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.currentRate;
    }
    // If synthesizing and actively playing, seamlessly restart to apply new rate
    if (this.isSynthesizing && typeof window !== "undefined" && !window.speechSynthesis.paused && this.currentText) {
      const text = this.currentText;
      const onEnd = this.currentOnSlideEnd;
      this.speakSlideParagraph(text, onEnd);
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
    }
    if (this.utterance) {
      this.utterance.volume = this.isMuted ? 0 : this.currentVolume;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
    }
    if (this.utterance) {
      this.utterance.volume = this.isMuted ? 0 : this.currentVolume;
    }
  }

  public setPitch(pitch: number) {
    this.currentPitch = Math.max(0.5, Math.min(1.5, pitch));
  }

  public onBoundary(cb: BoundaryCallback) {
    this.boundaryListeners.push(cb);
    return () => {
      this.boundaryListeners = this.boundaryListeners.filter((l) => l !== cb);
    };
  }

  public onStateChange(cb: StateCallback) {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  public onEnd(cb: EndCallback) {
    this.endListeners.push(cb);
    return () => {
      this.endListeners = this.endListeners.filter((l) => l !== cb);
    };
  }

  public onProgress(cb: ProgressCallback) {
    this.progressListeners.push(cb);
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== cb);
    };
  }

  private notifyState(isPlaying: boolean, isPaused: boolean) {
    this.stateListeners.forEach((cb) => cb(isPlaying, isPaused));
  }

  private notifyProgress(pct: number, curSec: number, durSec: number) {
    this.progressListeners.forEach((cb) => cb(pct, curSec, durSec));
  }

  /**
   * Main slide audio player:
   * If an uploaded audio file URL is supplied, play the audio file.
   * Otherwise, fallback to the Web Speech API with word-level highlight boundaries.
   */
  public playSlideAudio(
    text: string,
    audioUrl?: string,
    onSlideEnd?: () => void
  ) {
    this.stop();

    this.currentText = text;
    this.currentAudioUrl = audioUrl;
    this.currentOnSlideEnd = onSlideEnd;

    if (audioUrl && audioUrl.trim().length > 0) {
      try {
        const audio = new Audio(audioUrl);
        this.audioElement = audio;
        audio.playbackRate = this.currentRate;
        audio.volume = this.isMuted ? 0 : this.currentVolume;

        audio.onplay = () => {
          this.isAudioElementPlaying = true;
          this.notifyState(true, false);
        };

        audio.ontimeupdate = () => {
          const cur = audio.currentTime || 0;
          const dur = audio.duration || 1;
          const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
          this.notifyProgress(pct, cur, dur);
        };

        audio.onpause = () => {
          if (!audio.ended) {
            this.notifyState(true, true);
          }
        };

        audio.onended = () => {
          this.isAudioElementPlaying = false;
          this.notifyState(false, false);
          this.notifyProgress(100, audio.duration || 0, audio.duration || 0);
          this.endListeners.forEach((cb) => cb());
          if (onSlideEnd) onSlideEnd();
        };

        audio.onerror = (e) => {
          console.warn("Audio file playback error, falling back to Web Speech:", e);
          this.audioElement = null;
          this.isAudioElementPlaying = false;
          // Fallback to synthesis
          this.speakSlideParagraph(text, onSlideEnd);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio element play error:", err);
            this.speakSlideParagraph(text, onSlideEnd);
          });
        }
        return;
      } catch (err) {
        console.warn("Failed initializing Audio element:", err);
      }
    }

    // Default: Web Speech synthesis
    this.speakSlideParagraph(text, onSlideEnd);
  }

  /**
   * Reads a slide paragraph using Web Speech synthesis with boundary tracking.
   */
  public speakSlideParagraph(text: string, onSlideEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    this.stop();

    this.currentText = text;
    this.currentOnSlideEnd = onSlideEnd;

    // Approximate speaking duration in seconds (~140 wpm at 1.0 rate)
    const wordCount = text.trim().split(/\s+/).length;
    const baseSeconds = Math.max(3, (wordCount / 140) * 60);
    this.estimatedDuration = baseSeconds / this.currentRate;
    this.speechStartTime = Date.now();
    this.speechElapsedBeforePause = 0;

    const utterance = new SpeechSynthesisUtterance(text);
    this.utterance = utterance;

    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    utterance.rate = this.currentRate;
    utterance.pitch = this.currentPitch;
    utterance.volume = this.isMuted ? 0 : this.currentVolume;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      this.isSynthesizing = true;
      this.speechStartTime = Date.now();
      this.notifyState(true, false);
      this.startSpeechTimer();
    };

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const charLength = event.charLength || 0;
        this.boundaryListeners.forEach((cb) => cb(charIndex, charLength));

        // Calculate progress percentage by character position
        const pct = Math.min(100, Math.max(0, ((charIndex + charLength) / Math.max(1, text.length)) * 100));
        const curSec = (pct / 100) * this.estimatedDuration;
        this.notifyProgress(pct, curSec, this.estimatedDuration);
      }
    };

    utterance.onend = () => {
      this.isSynthesizing = false;
      this.clearSpeechTimer();
      this.notifyState(false, false);
      this.notifyProgress(100, this.estimatedDuration, this.estimatedDuration);
      this.boundaryListeners.forEach((cb) => cb(-1, 0));
      this.endListeners.forEach((cb) => cb());
      if (onSlideEnd) onSlideEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e.error);
      this.isSynthesizing = false;
      this.clearSpeechTimer();
      this.notifyState(false, false);
      this.boundaryListeners.forEach((cb) => cb(-1, 0));
    };

    window.speechSynthesis.speak(utterance);
  }

  private startSpeechTimer() {
    this.clearSpeechTimer();
    this.speechTimer = window.setInterval(() => {
      if (
        this.isSynthesizing &&
        typeof window !== "undefined" &&
        !window.speechSynthesis.paused
      ) {
        const elapsedSec =
          this.speechElapsedBeforePause +
          (Date.now() - this.speechStartTime) / 1000;
        const pct = Math.min(
          99,
          Math.max(0, (elapsedSec / Math.max(1, this.estimatedDuration)) * 100)
        );
        this.notifyProgress(
          pct,
          Math.min(elapsedSec, this.estimatedDuration),
          this.estimatedDuration
        );
      }
    }, 250);
  }

  private clearSpeechTimer() {
    if (this.speechTimer !== null) {
      clearInterval(this.speechTimer);
      this.speechTimer = null;
    }
  }

  /**
   * Speak an individual vocabulary word (e.g. inside Dictionary modal).
   */
  public speakWord(word: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const wordUtterance = new SpeechSynthesisUtterance(word);
    if (this.currentVoice) wordUtterance.voice = this.currentVoice;
    wordUtterance.rate = 0.85;
    wordUtterance.pitch = 1.05;
    wordUtterance.volume = this.isMuted ? 0 : this.currentVolume;
    wordUtterance.lang = "en-US";
    window.speechSynthesis.speak(wordUtterance);
  }

  public pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.notifyState(true, true);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      this.speechElapsedBeforePause += (Date.now() - this.speechStartTime) / 1000;
      this.notifyState(true, true);
    }
  }

  public resume() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
      this.notifyState(true, false);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      this.speechStartTime = Date.now();
      this.notifyState(true, false);
    }
  }

  /**
   * Rewinds playback by specified seconds (default 5s) or replays current slide.
   */
  public rewind(seconds = 5) {
    if (this.audioElement) {
      const newTime = Math.max(0, this.audioElement.currentTime - seconds);
      this.audioElement.currentTime = newTime;
      if (this.audioElement.paused) {
        this.audioElement.play();
      }
      return;
    }

    // For speech synthesis, restart the current slide text cleanly
    if (this.currentText) {
      this.speakSlideParagraph(this.currentText, this.currentOnSlideEnd);
    }
  }

  /**
   * Fast-forwards audio by specified seconds.
   */
  public forward(seconds = 5) {
    if (this.audioElement) {
      const maxTime = this.audioElement.duration || this.audioElement.currentTime + 10;
      this.audioElement.currentTime = Math.min(maxTime, this.audioElement.currentTime + seconds);
      return;
    }
  }

  /**
   * Replays from beginning of slide.
   */
  public replay() {
    if (this.currentText) {
      this.playSlideAudio(this.currentText, this.currentAudioUrl, this.currentOnSlideEnd);
    }
  }

  public stop() {
    this.clearSpeechTimer();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
      this.isAudioElementPlaying = false;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSynthesizing = false;
    }

    this.notifyState(false, false);
    this.notifyProgress(0, 0, this.estimatedDuration);
    this.boundaryListeners.forEach((cb) => cb(-1, 0));
  }

  public get isPlaying(): boolean {
    return this.isSynthesizing || this.isAudioElementPlaying;
  }
}

export const audioEngine = new AudioEngine();

