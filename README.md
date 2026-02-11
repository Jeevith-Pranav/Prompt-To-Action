# Prompt to ESP32

A vibrant, dark, neon-glowing web application that lets users speak or type commands in English or Tamil to control an ESP32 microcontroller. The app generates Arduino C++ code via OpenAI and uploads it via USB or OTA.

## Features

- 🎤 **Speech Recognition**: Speak commands in English or Tamil using Web Speech API
- 🤖 **AI Code Generation**: Generate Arduino C++ code using OpenAI GPT-4o-mini
- 📡 **Dual Upload Methods**: Upload code via USB or Over-the-Air (OTA)
- 🌟 **Modern Neon UI**: Dark theme with glass-morphism effects and smooth animations
- 🔊 **Audio Meter**: Visual feedback during speech recording
- 🌐 **Mixed Language Support**: Tamil inputs are translated internally while preserving technical terms
- ⚡ **Hardware Control**: Control LEDs (Red, Blue, White) and Motor on ESP32

## Hardware Setup

### ESP32 Pin Configuration
- **Red LED**: GPIO 2
- **Blue LED**: GPIO 4  
- **White LED**: GPIO 5
- **Motor**: GPIO 18
- **Board**: DOIT ESP32 DEVKIT V1

### WiFi Configuration
- **SSID**: "OC LA NET KEKUTHA?"
- **Password**: "11111111"

## Installation

### Prerequisites
- Node.js 18+
- Arduino CLI installed and configured
- ESP32 board package installed in Arduino CLI
- OpenAI API key

### Setup Steps

1. **Install Arduino CLI and ESP32 Core**
   \`\`\`bash
   # Install Arduino CLI (follow official instructions)
   # Add ESP32 board package
   arduino-cli core update-index
   arduino-cli core install espressif:esp32
   
   # Verify installation
   arduino-cli board listall esp32
   \`\`\`

2. **Clone and Setup Project**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

3. **Configure Environment Variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   \`\`\`

4. **Start Backend Server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Serve Frontend**
   \`\`\`bash
   # Option 1: Using any static server
   npx serve frontend
   
   # Option 2: Using Live Server in VS Code
   # Right-click on frontend/index.html and select "Open with Live Server"
   
   # Option 3: Simple Python server
   cd frontend
   python -m http.server 8000
   \`\`\`

## Usage

1. **Open the Application**
   - Navigate to `http://localhost:8080` (or your static server URL)

2. **Generate Code**
   - Type a command like "Turn on red LED for 2 seconds"
   - Or click the microphone button and speak your command
   - Click "Generate Code" to create Arduino C++ code

3. **Upload to ESP32**
   - **USB Upload**: Connect ESP32 via USB and click "Upload (USB)"
   - **OTA Upload**: Ensure ESP32 is connected to WiFi and click "Upload (OTA)"

### Example Commands

**English:**
- "Turn on red LED"
- "Blink blue LED 5 times"
- "Start motor for 3 seconds"
- "Turn off all LEDs"

**Tamil:**
- "சிவப்பு LED ஐ ஆன் செய்"
- "நீல LED ஐ 5 முறை blink செய்"
- "மோட்டரை 3 வினாடிகள் ஓட்டு"

## Environment Variables

Create a `.env` file in the `backend` directory:

\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
ESP32_PORT=COM8                    # Windows: COM8, Linux/Mac: /dev/ttyUSB0
ESP32_IP=192.168.254.200          # ESP32 IP address for OTA uploads
PORT=5000                         # Backend server port
\`\`\`

## Troubleshooting

### Speech Recognition Issues
- **Not working**: Use Chrome or Edge browser (Firefox/Safari have limited support)
- **Wrong language detected**: Manually select language from dropdown instead of "Auto"

### Upload Issues
- **USB Upload Fails**: 
  - Check ESP32 connection: `arduino-cli board list`
  - Verify correct COM port in `.env` file
  - Ensure ESP32 drivers are installed

- **OTA Upload Fails**:
  - Verify ESP32 is connected to WiFi
  - Check ESP32 IP address is correct in `.env`
  - Ensure ESP32 has OTA-enabled firmware

### Code Generation Issues
- **"ENTER VALID PROMPT"**: Command not related to LEDs or motor
- **API Errors**: Check OpenAI API key is valid and has credits
- **No response**: Verify backend server is running on correct port

## Project Structure

\`\`\`
prompt-to-esp32/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Node.js dependencies
│   ├── .env.example       # Environment variables template
│   └── Sketch/            # Generated Arduino sketches
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── style.css          # Neon dark theme styles
│   └── script.js          # Frontend JavaScript
└── README.md              # This file
\`\`\`

## API Endpoints

### POST /generate
Generate Arduino C++ code from natural language prompt.

**Request:**
\`\`\`json
{
  "prompt": "Turn on red LED for 2 seconds"
}
\`\`\`

**Response:**
\`\`\`json
{
  "code": "// Generated Arduino C++ code"
}
\`\`\`

### POST /upload
Compile and upload code to ESP32.

**Request:**
\`\`\`json
{
  "code": "// Arduino C++ code",
  "ota": false
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Code uploaded successfully via USB"
}
\`\`\`

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4o-mini
- **Hardware**: Arduino CLI, ESP32
- **Speech**: Web Speech API
- **Audio**: Web Audio API

## License

© 2025 TEAM ENGIUNITY

---

For support or questions, please check the troubleshooting section above or verify your hardware and software setup.
