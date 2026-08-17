/**
 * Walibi Live In-App Kamera & Foto-/Video-Manager
 * Unterstützt Foto-Aufnahmen & Live-Videoaufzeichnung (MediaRecorder),
 * Front-/Rückkamera-Switch, 3-Sekunden-Selbstauslöser, Blitz-Animation
 * sowie native Datei- & Galerie-Fallbacks.
 */
const CameraModule = {
  activeStream: null,
  currentFacingMode: "environment", // "environment" | "user"
  mode: "photo", // "photo" | "video"
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  recTimerInterval: null,
  recSeconds: 0,
  MAX_REC_SECONDS: 30,
  capturedPhotoBase64: null,
  capturedVideoBase64: null,
  onCaptureCallback: null,
  timerCountdown: 0,

  init() {
    this.setupModalElements();
  },

  setupModalElements() {
    const closeBtn = document.getElementById("closeInAppCamera");
    const switchBtn = document.getElementById("btnCameraSwitchFacing");
    const timerBtn = document.getElementById("btnCameraTimer");
    const shutterBtn = document.getElementById("btnCameraShutter");
    const retakeBtn = document.getElementById("btnCameraRetake");
    const confirmBtn = document.getElementById("btnCameraConfirm");
    const galleryBtn = document.getElementById("btnCameraPickGallery");
    const galleryInput = document.getElementById("cameraModalGalleryInput");
    const fallbackCamInput = document.getElementById("cameraModalFallbackCameraInput");
    const fallbackVidInput = document.getElementById("cameraModalFallbackVideoInput");

    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }

    if (switchBtn) {
      switchBtn.onclick = () => this.toggleFacingMode();
    }

    if (timerBtn) {
      timerBtn.onclick = () => this.toggleTimer();
    }

    if (shutterBtn) {
      shutterBtn.onclick = () => this.handleShutterClick();
    }

    if (retakeBtn) {
      retakeBtn.onclick = () => this.retakeMedia();
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmCapture();
    }

    if (galleryBtn && galleryInput) {
      galleryBtn.onclick = () => galleryInput.click();
    }

    if (galleryInput) {
      galleryInput.onchange = (e) => this.handleFileInput(e);
    }

    if (fallbackCamInput) {
      fallbackCamInput.onchange = (e) => this.handleFileInput(e);
    }

    if (fallbackVidInput) {
      fallbackVidInput.onchange = (e) => this.handleFileInput(e);
    }
  },

  open(options = {}) {
    if (window.GameAudio) window.GameAudio.playClick();

    this.onCaptureCallback = options.onCapture || null;
    this.currentFacingMode = options.facingMode || "environment";
    this.mode = options.isVideoMode ? "video" : "photo";
    this.capturedPhotoBase64 = null;
    this.capturedVideoBase64 = null;
    this.timerCountdown = 0;
    this.isRecording = false;
    this.recSeconds = 0;

    const modal = document.getElementById("inAppCameraModal");
    const titleEl = document.getElementById("cameraModalTitle");
    if (titleEl) {
      titleEl.textContent = options.title || (this.mode === "video" ? "🎥 Walibi Live-Video" : (this.currentFacingMode === "user" ? "🤳 Selfie-Kamera" : "📸 Walibi Live-Kamera"));
    }

    this.updateModeTabsUI();
    this.resetCameraUI();

    if (modal) {
      modal.classList.remove("hidden");
      if (window.app && window.app.navigationManager) {
        window.app.navigationManager.pushModal("inAppCameraModal", () => this.close());
      }
    }

    this.startCameraStream();
  },

  switchMode(newMode) {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.mode === newMode) return;
    if (window.GameAudio) window.GameAudio.playClick();

    this.mode = newMode;
    this.updateModeTabsUI();

    const titleEl = document.getElementById("cameraModalTitle");
    if (titleEl) {
      titleEl.textContent = this.mode === "video" ? "🎥 Walibi Live-Video" : (this.currentFacingMode === "user" ? "🤳 Selfie-Kamera" : "📸 Walibi Live-Kamera");
    }

    this.startCameraStream();
  },

  updateModeTabsUI() {
    const tabPhoto = document.getElementById("btnCameraModePhoto");
    const tabVideo = document.getElementById("btnCameraModeVideo");
    const shutterBtn = document.getElementById("btnCameraShutter");
    const timerBtn = document.getElementById("btnCameraTimer");

    if (tabPhoto) tabPhoto.classList.toggle("active", this.mode === "photo");
    if (tabVideo) tabVideo.classList.toggle("active", this.mode === "video");

    if (shutterBtn) {
      shutterBtn.classList.toggle("video-mode-shutter", this.mode === "video");
      shutterBtn.classList.remove("is-recording");
    }

    if (timerBtn) {
      timerBtn.style.display = this.mode === "photo" ? "flex" : "none";
    }
  },

  async startCameraStream() {
    this.stopCameraStream();

    const videoEl = document.getElementById("cameraLiveStream");
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const controlsRow = document.getElementById("cameraLiveControls");
    const modeSwitcher = document.getElementById("cameraModeSwitcher");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showFallback("Web-Kamera wird von diesem Browser nicht direkt unterstützt.");
      return;
    }

    const wantAudio = this.mode === "video";

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: wantAudio
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errWithAudio) {
        if (wantAudio) {
          constraints.audio = false;
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          throw errWithAudio;
        }
      }

      this.activeStream = stream;

      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.classList.remove("hidden");
        videoEl.play().catch(e => console.warn("Video Play Error:", e));
      }

      if (fallbackBox) fallbackBox.classList.add("hidden");
      if (controlsRow) controlsRow.classList.remove("hidden");
      if (modeSwitcher) modeSwitcher.classList.remove("hidden");
    } catch (err) {
      console.warn("Camera getUserMedia error:", err);
      this.showFallback("Kamerazugriff wurde abgelehnt oder ist blockiert.");
    }
  },

  stopCameraStream() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
    const videoEl = document.getElementById("cameraLiveStream");
    if (videoEl) {
      videoEl.srcObject = null;
    }
  },

  toggleFacingMode() {
    if (window.GameAudio) window.GameAudio.playClick();
    this.currentFacingMode = this.currentFacingMode === "user" ? "environment" : "user";
    this.startCameraStream();
  },

  toggleTimer() {
    if (window.GameAudio) window.GameAudio.playClick();
    const timerBtn = document.getElementById("btnCameraTimer");
    if (this.timerCountdown === 0) {
      this.timerCountdown = 3;
      if (timerBtn) timerBtn.classList.add("timer-active");
    } else {
      this.timerCountdown = 0;
      if (timerBtn) timerBtn.classList.remove("timer-active");
    }
  },

  handleShutterClick() {
    if (this.mode === "video") {
      if (!this.isRecording) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
      return;
    }

    if (this.timerCountdown > 0) {
      this.startTimerCountdown(() => this.snapPhoto());
    } else {
      this.snapPhoto();
    }
  },

  startTimerCountdown(callback) {
    const overlay = document.getElementById("cameraTimerOverlay");
    const countEl = document.getElementById("cameraTimerCount");
    let current = this.timerCountdown;

    if (overlay) overlay.classList.remove("hidden");
    if (countEl) countEl.textContent = current;
    if (window.GameAudio) window.GameAudio.playClick();

    const interval = setInterval(() => {
      current--;
      if (current > 0) {
        if (countEl) countEl.textContent = current;
        if (window.GameAudio) window.GameAudio.playClick();
      } else {
        clearInterval(interval);
        if (overlay) overlay.classList.add("hidden");
        if (callback) callback();
      }
    }, 1000);
  },

  snapPhoto() {
    const videoEl = document.getElementById("cameraLiveStream");
    const previewImg = document.getElementById("cameraFreezePreview");
    const flashEl = document.getElementById("cameraFlashEffect");

    if (!videoEl || !videoEl.videoWidth) {
      return;
    }

    if (flashEl) {
      flashEl.classList.remove("hidden");
      flashEl.classList.add("trigger-flash");
      setTimeout(() => {
        flashEl.classList.remove("trigger-flash");
        flashEl.classList.add("hidden");
      }, 300);
    }

    if (window.GameAudio) window.GameAudio.playReward();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const maxDim = 1080;
    let w = videoEl.videoWidth;
    let h = videoEl.videoHeight;

    if (w > h) {
      if (w > maxDim) {
        h *= maxDim / w;
        w = maxDim;
      }
    } else {
      if (h > maxDim) {
        w *= maxDim / h;
        h = maxDim;
      }
    }

    canvas.width = w;
    canvas.height = h;

    if (this.currentFacingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoEl, 0, 0, w, h);

    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
    this.capturedPhotoBase64 = compressedBase64;
    this.capturedVideoBase64 = null;

    this.stopCameraStream();

    if (videoEl) videoEl.classList.add("hidden");
    if (previewImg) {
      previewImg.src = compressedBase64;
      previewImg.classList.remove("hidden");
    }

    this.showConfirmationControls();
  },

  // --- 🎥 VIDEO AUFZEICHNUNG (MediaRecorder) ---
  startRecording() {
    if (!this.activeStream) {
      alert("Kamerazugriff wird noch initialisiert...");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      alert("Live-Videoaufnahme wird von diesem Browser leider nicht unterstützt. Bitte nutze die Galerie oder das Video-Fallback.");
      return;
    }

    this.recordedChunks = [];
    let options = {};

    const preferredMimes = [
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];

    if (typeof MediaRecorder.isTypeSupported === "function") {
      for (const mime of preferredMimes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          options = { mimeType: mime };
          break;
        }
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.activeStream, options);
    } catch (e1) {
      try {
        this.mediaRecorder = new MediaRecorder(this.activeStream);
      } catch (e2) {
        alert("Video-Aufnahme konnte nicht gestartet werden: " + e2.message);
        return;
      }
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.finishVideoRecording();
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    this.recSeconds = 0;

    if (window.GameAudio) window.GameAudio.playCoin();

    const shutterBtn = document.getElementById("btnCameraShutter");
    const recBadge = document.getElementById("cameraRecordingIndicator");
    const recTime = document.getElementById("cameraRecTime");
    const modeSwitcher = document.getElementById("cameraModeSwitcher");

    if (shutterBtn) shutterBtn.classList.add("is-recording");
    if (recBadge) recBadge.classList.remove("hidden");
    if (recTime) recTime.textContent = "REC 00:00";
    if (modeSwitcher) modeSwitcher.classList.add("hidden");

    clearInterval(this.recTimerInterval);
    this.recTimerInterval = setInterval(() => {
      this.recSeconds++;
      if (recTime) {
        const mins = String(Math.floor(this.recSeconds / 60)).padStart(2, "0");
        const secs = String(this.recSeconds % 60).padStart(2, "0");
        recTime.textContent = `REC ${mins}:${secs}`;
      }

      if (this.recSeconds >= this.MAX_REC_SECONDS) {
        this.stopRecording();
      }
    }, 1000);
  },

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;

    clearInterval(this.recTimerInterval);

    const shutterBtn = document.getElementById("btnCameraShutter");
    const recBadge = document.getElementById("cameraRecordingIndicator");

    if (shutterBtn) shutterBtn.classList.remove("is-recording");
    if (recBadge) recBadge.classList.add("hidden");

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        if (typeof this.mediaRecorder.requestData === 'function') {
          this.mediaRecorder.requestData();
        }
      } catch (e) {}
      this.mediaRecorder.stop();
    }

    if (window.GameAudio) window.GameAudio.playReward();
  },

  finishVideoRecording() {
    if (!this.recordedChunks || this.recordedChunks.length === 0) {
      alert("⚠️ Die Videoaufnahme war zu kurz. Bitte halte die Aufnahme mindestens 1 Sekunde lang.");
      this.retakeMedia();
      return;
    }

    let mimeType = (this.mediaRecorder && this.mediaRecorder.mimeType) || "";
    if (!mimeType) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        mimeType = "video/webm";
      }
    }

    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const reader = new FileReader();

    reader.onloadend = () => {
      const b64 = reader.result;
      this.capturedVideoBase64 = b64;
      this.capturedPhotoBase64 = null;

      this.stopCameraStream();

      const videoEl = document.getElementById("cameraLiveStream");
      const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
      const freezeImg = document.getElementById("cameraFreezePreview");

      if (videoEl) videoEl.classList.add("hidden");
      if (freezeImg) freezeImg.classList.add("hidden");

      if (freezeVideo) {
        freezeVideo.src = blobUrl;
        freezeVideo.classList.remove("hidden");
        freezeVideo.load();
        freezeVideo.play().catch(() => {});
      }

      this.showConfirmationControls();
    };

    reader.readAsDataURL(blob);
  },

  handleFileInput(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();
    const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|webm|m4v|3gp)$/i);
    const blobUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    if (isVideo) {
      reader.onload = (e) => {
        const b64 = e.target.result;
        this.capturedVideoBase64 = b64;
        this.capturedPhotoBase64 = null;

        this.stopCameraStream();

        const videoEl = document.getElementById("cameraLiveStream");
        const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
        const freezeImg = document.getElementById("cameraFreezePreview");
        const fallbackBox = document.getElementById("cameraFallbackBox");

        if (videoEl) videoEl.classList.add("hidden");
        if (freezeImg) freezeImg.classList.add("hidden");
        if (fallbackBox) fallbackBox.classList.add("hidden");

        if (freezeVideo) {
          freezeVideo.src = blobUrl;
          freezeVideo.classList.remove("hidden");
          freezeVideo.load();
          freezeVideo.play().catch(() => {});
        }

        this.showConfirmationControls();
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxDim = 1080;
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > maxDim) {
              h *= maxDim / w;
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w *= maxDim / h;
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);

          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          this.capturedPhotoBase64 = compressed;
          this.capturedVideoBase64 = null;

          const previewImg = document.getElementById("cameraFreezePreview");
          const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
          const videoEl = document.getElementById("cameraLiveStream");
          const fallbackBox = document.getElementById("cameraFallbackBox");

          this.stopCameraStream();
          if (videoEl) videoEl.classList.add("hidden");
          if (freezeVideo) freezeVideo.classList.add("hidden");
          if (fallbackBox) fallbackBox.classList.add("hidden");

          if (previewImg) {
            previewImg.src = compressed;
            previewImg.classList.remove("hidden");
          }

          this.showConfirmationControls();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  showConfirmationControls() {
    const liveControls = document.getElementById("cameraLiveControls");
    const confirmControls = document.getElementById("cameraConfirmControls");
    const modeSwitcher = document.getElementById("cameraModeSwitcher");

    if (liveControls) liveControls.classList.add("hidden");
    if (modeSwitcher) modeSwitcher.classList.add("hidden");
    if (confirmControls) confirmControls.classList.remove("hidden");
  },

  retakeMedia() {
    if (window.GameAudio) window.GameAudio.playClick();
    this.capturedPhotoBase64 = null;
    this.capturedVideoBase64 = null;

    const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
    if (freezeVideo) {
      freezeVideo.pause();
      freezeVideo.src = "";
      freezeVideo.classList.add("hidden");
    }

    this.resetCameraUI();
    this.startCameraStream();
  },

  confirmCapture() {
    if (window.GameAudio) window.GameAudio.playCoin();

    const isVideo = !!this.capturedVideoBase64;
    const mediaData = this.capturedVideoBase64 || this.capturedPhotoBase64;

    if (this.onCaptureCallback && mediaData) {
      this.onCaptureCallback(mediaData, isVideo);
    }

    this.close();
  },

  showFallback(message) {
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const fallbackMsg = document.getElementById("cameraFallbackMsg");
    const videoEl = document.getElementById("cameraLiveStream");
    const liveControls = document.getElementById("cameraLiveControls");
    const modeSwitcher = document.getElementById("cameraModeSwitcher");

    if (videoEl) videoEl.classList.add("hidden");
    if (liveControls) liveControls.classList.add("hidden");
    if (modeSwitcher) modeSwitcher.classList.add("hidden");
    if (fallbackMsg) fallbackMsg.textContent = message || "Kamera nicht verfügbar.";
    if (fallbackBox) fallbackBox.classList.remove("hidden");
  },

  resetCameraUI() {
    const videoEl = document.getElementById("cameraLiveStream");
    const previewImg = document.getElementById("cameraFreezePreview");
    const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const liveControls = document.getElementById("cameraLiveControls");
    const confirmControls = document.getElementById("cameraConfirmControls");
    const modeSwitcher = document.getElementById("cameraModeSwitcher");
    const timerOverlay = document.getElementById("cameraTimerOverlay");
    const flashEl = document.getElementById("cameraFlashEffect");
    const recBadge = document.getElementById("cameraRecordingIndicator");
    const shutterBtn = document.getElementById("btnCameraShutter");

    if (previewImg) {
      previewImg.classList.add("hidden");
      previewImg.src = "";
    }
    if (freezeVideo) {
      freezeVideo.pause();
      freezeVideo.classList.add("hidden");
      freezeVideo.src = "";
    }
    if (videoEl) videoEl.classList.remove("hidden");
    if (fallbackBox) fallbackBox.classList.add("hidden");
    if (liveControls) liveControls.classList.remove("hidden");
    if (modeSwitcher) modeSwitcher.classList.remove("hidden");
    if (confirmControls) confirmControls.classList.add("hidden");
    if (timerOverlay) timerOverlay.classList.add("hidden");
    if (flashEl) flashEl.classList.add("hidden");
    if (recBadge) recBadge.classList.add("hidden");
    if (shutterBtn) shutterBtn.classList.remove("is-recording");

    this.updateModeTabsUI();
  },

  close() {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.stopCameraStream();

    const freezeVideo = document.getElementById("cameraFreezeVideoPreview");
    if (freezeVideo) {
      freezeVideo.pause();
      freezeVideo.src = "";
    }

    const modal = document.getElementById("inAppCameraModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    this.resetCameraUI();
  }
};

window.CameraModule = CameraModule;
