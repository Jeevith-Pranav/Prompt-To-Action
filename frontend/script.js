class PromptToESP32 {
  constructor() {
    this.backendURL = "http://localhost:5000"
    this.recognition = null
    this.audioContext = null
    this.analyser = null
    this.microphone = null
    this.isRecording = false
    this.finalTranscript = ""
    this.interimTranscript = ""

    this.initializeElements()
    this.setupEventListeners()
    this.setupSpeechRecognition()
  }

  initializeElements() {
    // Main elements
    this.promptInput = document.getElementById("promptInput")
    this.micButton = document.getElementById("micButton")
    this.languageSelect = document.getElementById("languageSelect")
    this.autoGenerate = document.getElementById("autoGenerate")

    // Action buttons
    this.generateButton = document.getElementById("generateButton")
    this.uploadUSBButton = document.getElementById("uploadUSBButton")
    this.uploadOTAButton = document.getElementById("uploadOTAButton")

    // Code section
    this.codeOutput = document.getElementById("codeOutput")
    this.copyButton = document.getElementById("copyButton")

    // Status bar
    this.statusBar = document.getElementById("statusBar")

    // Modal elements
    this.speechModal = document.getElementById("speechModal")
    this.currentLanguage = document.getElementById("currentLanguage")
    this.audioMeterBar = document.getElementById("audioMeterBar")
    this.interimText = document.getElementById("interimText")
    this.finalText = document.getElementById("finalText")
    this.confidenceText = document.getElementById("confidenceText")
    this.stopRecording = document.getElementById("stopRecording")
    this.cancelRecording = document.getElementById("cancelRecording")
    this.sendToPrompt = document.getElementById("sendToPrompt")
  }

  setupEventListeners() {
    // Action buttons
    this.generateButton.addEventListener("click", () => this.generateCode())
    this.uploadUSBButton.addEventListener("click", () => this.uploadCode(false))
    this.uploadOTAButton.addEventListener("click", () => this.uploadCode(true))

    // Copy button
    this.copyButton.addEventListener("click", () => this.copyCode())

    // Mic button
    this.micButton.addEventListener("click", () => this.toggleRecording())

    // Modal buttons
    this.stopRecording.addEventListener("click", () => this.stopSpeechRecognition())
    this.cancelRecording.addEventListener("click", () => this.cancelSpeechRecognition())
    this.sendToPrompt.addEventListener("click", () => this.sendTranscriptToPrompt())

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (document.activeElement !== this.promptInput) {
          e.preventDefault()
          this.toggleRecording()
        }
      }
    })

    // Language select change
    this.languageSelect.addEventListener("change", () => {
      this.updateLanguageDisplay()
    })
  }

  setupSpeechRecognition() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      this.showStatus("Speech recognition not supported. Please use Chrome or Edge.", "error")
      this.micButton.disabled = true
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      this.isRecording = true
      this.showSpeechModal()
      this.setupAudioMeter()
    }

    this.recognition.onresult = (event) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const confidence = event.results[i][0].confidence

        if (event.results[i].isFinal) {
          final += transcript
          this.confidenceText.textContent = `Confidence: ${Math.round(confidence * 100)}%`
        } else {
          interim += transcript
        }
      }

      this.interimTranscript = interim
      this.finalTranscript += final

      this.interimText.textContent = interim || "Listening..."
      this.finalText.textContent = this.finalTranscript || "No speech detected yet"

      if (final) {
        this.sendToPrompt.classList.remove("hidden")
      }
    }

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      this.showStatus(`Speech recognition error: ${event.error}`, "error")
      this.hideSpeechModal()
    }

    this.recognition.onend = () => {
      this.isRecording = false
      this.cleanupAudioMeter()
    }
  }

  async setupAudioMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.microphone = this.audioContext.createMediaStreamSource(stream)

      this.analyser.fftSize = 256
      this.microphone.connect(this.analyser)

      this.updateAudioMeter()
    } catch (error) {
      console.error("Error setting up audio meter:", error)
    }
  }

  updateAudioMeter() {
    if (!this.analyser || !this.isRecording) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    let sum = 0
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i]
    const average = sum / bufferLength
    const percentage = (average / 255) * 100

    this.audioMeterBar.style.width = `${percentage}%`

    if (this.isRecording) requestAnimationFrame(() => this.updateAudioMeter())
  }

  cleanupAudioMeter() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
    this.microphone = null
    this.audioMeterBar.style.width = "0%"
  }

  toggleRecording() {
    if (this.isRecording) this.stopSpeechRecognition()
    else this.startSpeechRecognition()
  }

  startSpeechRecognition() {
    if (!this.recognition) {
      this.showStatus("Speech recognition not available", "error")
      return
    }

    const language = this.languageSelect.value
    this.recognition.lang = language !== "auto" ? language : "ta-IN"

    this.finalTranscript = ""
    this.interimTranscript = ""
    this.updateLanguageDisplay()

    try { this.recognition.start() }
    catch (error) {
      console.error("Error starting speech recognition:", error)
      this.showStatus("Failed to start speech recognition", "error")
    }
  }

  stopSpeechRecognition() {
    if (this.recognition && this.isRecording) this.recognition.stop()
    this.hideSpeechModal()
  }

  cancelSpeechRecognition() {
    if (this.recognition && this.isRecording) this.recognition.abort()
    this.finalTranscript = ""
    this.interimTranscript = ""
    this.hideSpeechModal()
  }

  sendTranscriptToPrompt() {
    if (this.finalTranscript.trim()) {
      this.promptInput.value = this.finalTranscript.trim()
      this.hideSpeechModal()
      if (this.autoGenerate.checked) setTimeout(() => this.generateCode(), 500)
    }
  }

  showSpeechModal() {
    this.speechModal.classList.remove("hidden")
    this.interimText.textContent = "Listening..."
    this.finalText.textContent = "No speech detected yet"
    this.confidenceText.textContent = "Confidence: --"
    this.sendToPrompt.classList.add("hidden")
  }

  hideSpeechModal() {
    this.speechModal.classList.add("hidden")
    this.cleanupAudioMeter()
  }

  updateLanguageDisplay() {
    const language = this.languageSelect.value
    let displayName = "Auto"
    if (language === "ta-IN") displayName = "Tamil"
    else if (language === "en-IN") displayName = "English"
    this.currentLanguage.textContent = displayName
  }

  async generateCode() {
    const prompt = this.promptInput.value.trim()
    if (!prompt) { this.showStatus("Please enter a prompt", "error"); return }

    this.setLoading(true)
    this.showStatus("Generating Arduino code...", "info")

    try {
      const response = await fetch(`${this.backendURL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to generate code")

      this.codeOutput.textContent = data.code
      this.showStatus("Code generated successfully!", "success")
    } catch (error) {
      console.error("Error generating code:", error)
      this.showStatus(`Error: ${error.message}`, "error")
      this.codeOutput.textContent = "// Error generating code. Please try again."
    } finally { this.setLoading(false) }
  }

  async uploadCode(ota = false) {
    const code = this.codeOutput.textContent.trim()
    if (!code || code.includes("// Generated Arduino code will appear here") || code.includes("// Error generating code")) {
      this.showStatus("Please generate code first", "error")
      return
    }

    const uploadType = ota ? "OTA" : "USB"
    this.showStatus(`Uploading code via ${uploadType}...`, "info")
    this.setUploadLoading(true, ota)

    try {
      const response = await fetch(`${this.backendURL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ota }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to upload code")

      this.showStatus(data.message || `Code uploaded successfully via ${uploadType}!`, "success")
    } catch (error) {
      console.error("Error uploading code:", error)
      this.showStatus(`Upload failed: ${error.message}`, "error")
    } finally { this.setUploadLoading(false, ota) }
  }

  setLoading(loading) {
    const spinner = this.generateButton.querySelector(".spinner")
    const btnText = this.generateButton.querySelector(".btn-text")
    if (loading) {
      if (spinner) spinner.classList.remove("hidden")
      if (btnText) btnText.textContent = "Generating..."
      this.generateButton.disabled = true
    } else {
      if (spinner) spinner.classList.add("hidden")
      if (btnText) btnText.textContent = "Generate Code"
      this.generateButton.disabled = false
    }
  }

  setUploadLoading(loading, ota = false) {
    const button = ota ? this.uploadOTAButton : this.uploadUSBButton
    const spinner = button.querySelector(".spinner")
    const btnText = button.querySelector(".btn-text")
    if (loading) {
      if (spinner) spinner.classList.remove("hidden")
      if (btnText) btnText.textContent = "Uploading..."
      button.disabled = true
    } else {
      if (spinner) spinner.classList.add("hidden")
      if (btnText) btnText.textContent = ota ? "Upload OTA" : "Upload USB"
      button.disabled = false
    }
  }

  copyCode() {
    const code = this.codeOutput.textContent
    if (!code || code.includes("// Generated Arduino code will appear here")) {
      this.showStatus("No code to copy", "error")
      return
    }
    navigator.clipboard.writeText(code).then(() => {
      this.showStatus("Code copied to clipboard!", "success")
    }).catch(() => this.showStatus("Failed to copy code", "error"))
  }

  showStatus(message, type = "info") {
    this.statusBar.className = `status-bar ${type}`
    this.statusBar.querySelector(".status-text").textContent = message
    this.statusBar.classList.remove("hidden")

    if (type === "success" || type === "info") {
      setTimeout(() => this.statusBar.classList.add("hidden"), 5000)
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => new PromptToESP32())
