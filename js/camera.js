/**
 * Walibi Live In-App Kamera & Foto-Manager
 * Unterstützt Echtzeit-Sucher (WebRTC getUserMedia), Front-/Rückkamera-Switch,
 * 3-Sekunden-Selbstauslöser, Blitz-Animation und native Datei-/Galerie-Fallbacks.
 */
const CameraModule = {
  activeStream: null,
  currentFacingMode: "environment", // "environment" | "user"
  capturedPhotoBase64: null,
  capturedVideoBase64: null,
  onCaptureCallback: null,
  timerCountdown: 0,
  timerInterval: null,
  isVideoMode: false,
  mediaRecorder: null,
  recordedChunks: [],

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
      retakeBtn.onclick = () => this.retakePhoto();
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
  },

  open(options = {}) {
    if (window.GameAudio) window.GameAudio.playClick();

    this.onCaptureCallback = options.onCapture || null;
    this.currentFacingMode = options.facingMode || "environment";
    this.isVideoMode = options.isVideoMode || false;
    this.capturedPhotoBase64 = null;
    this.capturedVideoBase64 = null;
    this.timerCountdown = 0;

    const modal = document.getElementById("inAppCameraModal");
    const titleEl = document.getElementById("cameraModalTitle");
    if (titleEl) {
      titleEl.textContent = options.title || (this.currentFacingMode === "user" ? "🤳 Selfie-Kamera" : "📸 Walibi Live-Kamera");
    }

    // UI-Zustände zurücksetzen
    this.resetCameraUI();

    if (modal) {
      modal.classList.remove("hidden");
      if (window.app && window.app.navigationManager) {
        window.app.navigationManager.pushModal("inAppCameraModal", () => this.close());
      }
    }

    this.startCameraStream();
  },

  async startCameraStream() {
    this.stopCameraStream();

    const videoEl = document.getElementById("cameraLiveStream");
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const controlsRow = document.getElementById("cameraLiveControls");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showFallback("Web-Kamera wird von diesem Browser nicht direkt unterstützt.");
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.activeStream = stream;

      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.classList.remove("hidden");
        videoEl.play().catch(e => console.warn("Video Play Error:", e));
      }

      if (fallbackBox) fallbackBox.classList.add("hidden");
      if (controlsRow) controlsRow.classList.remove("hidden");
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

    // Blitz-Effekt & Sound
    if (flashEl) {
      flashEl.classList.remove("hidden");
      flashEl.classList.add("trigger-flash");
      setTimeout(() => {
        flashEl.classList.remove("trigger-flash");
        flashEl.classList.add("hidden");
      }, 300);
    }

    if (window.GameAudio) window.GameAudio.playReward();

    // Canvas Frame zeichnen & komprimieren
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

    // Wenn Front-Kamera (Selfie) gespiegelt zeichnen
    if (this.currentFacingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoEl, 0, 0, w, h);

    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
    this.capturedPhotoBase64 = compressedBase64;

    // Live Stream anhalten & Vorschau einblenden
    this.stopCameraStream();

    if (videoEl) videoEl.classList.add("hidden");
    if (previewImg) {
      previewImg.src = compressedBase64;
      previewImg.classList.remove("hidden");
    }

    this.showConfirmationControls();
  },

  handleFileInput(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (window.GameAudio) window.GameAudio.playClick();
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();

    if (isVideo) {
      reader.onload = (e) => {
        const b64 = e.target.result;
        this.capturedVideoBase64 = b64;
        this.capturedPhotoBase64 = null;
        if (this.onCaptureCallback) {
          this.onCaptureCallback(b64, true);
        }
        this.close();
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

          const previewImg = document.getElementById("cameraFreezePreview");
          const videoEl = document.getElementById("cameraLiveStream");
          const fallbackBox = document.getElementById("cameraFallbackBox");

          this.stopCameraStream();
          if (videoEl) videoEl.classList.add("hidden");
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
    if (liveControls) liveControls.classList.add("hidden");
    if (confirmControls) confirmControls.classList.remove("hidden");
  },

  retakePhoto() {
    if (window.GameAudio) window.GameAudio.playClick();
    this.capturedPhotoBase64 = null;
    this.capturedVideoBase64 = null;
    this.resetCameraUI();
    this.startCameraStream();
  },

  confirmCapture() {
    if (window.GameAudio) window.GameAudio.playCoin();

    if (this.onCaptureCallback && (this.capturedPhotoBase64 || this.capturedVideoBase64)) {
      this.onCaptureCallback(this.capturedPhotoBase64 || this.capturedVideoBase64, !!this.capturedVideoBase64);
    }

    this.close();
  },

  showFallback(message) {
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const fallbackMsg = document.getElementById("cameraFallbackMsg");
    const videoEl = document.getElementById("cameraLiveStream");
    const liveControls = document.getElementById("cameraLiveControls");

    if (videoEl) videoEl.classList.add("hidden");
    if (liveControls) liveControls.classList.add("hidden");
    if (fallbackMsg) fallbackMsg.textContent = message || "Kamera nicht verfügbar.";
    if (fallbackBox) fallbackBox.classList.remove("hidden");
  },

  resetCameraUI() {
    const videoEl = document.getElementById("cameraLiveStream");
    const previewImg = document.getElementById("cameraFreezePreview");
    const fallbackBox = document.getElementById("cameraFallbackBox");
    const liveControls = document.getElementById("cameraLiveControls");
    const confirmControls = document.getElementById("cameraConfirmControls");
    const timerOverlay = document.getElementById("cameraTimerOverlay");
    const flashEl = document.getElementById("cameraFlashEffect");

    if (previewImg) {
      previewImg.classList.add("hidden");
      previewImg.src = "";
    }
    if (videoEl) videoEl.classList.remove("hidden");
    if (fallbackBox) fallbackBox.classList.add("hidden");
    if (liveControls) liveControls.classList.remove("hidden");
    if (confirmControls) confirmControls.classList.add("hidden");
    if (timerOverlay) timerOverlay.classList.add("hidden");
    if (flashEl) flashEl.classList.add("hidden");
  },

  close() {
    this.stopCameraStream();
    const modal = document.getElementById("inAppCameraModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    this.resetCameraUI();
  }
};

window.CameraModule = CameraModule;
