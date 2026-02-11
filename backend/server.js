import express from "express"
import fetch from "node-fetch"
import cors from "cors"
import dotenv from "dotenv"
import { exec } from "child_process"
import fs from "fs"
import path from "path"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ==========================
// ✅ MIDDLEWARE (MUST BE FIRST)
// ==========================
app.use(cors())
app.use(express.json())

console.log("🚀 Server starting...")
console.log("Environment variables:")
console.log("- OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "Set" : "Not set")
console.log("- ESP32_PORT:", process.env.ESP32_PORT || "COM8 (default)")
console.log("- ESP32_IP:", process.env.ESP32_IP || "192.168.254.200 (default)")

// ==========================
// ✅ TEST ROUTE
// ==========================
app.get("/", (req, res) => {
  res.send("Backend working!")
})

// ==========================
// SYSTEM PROMPT
// ==========================
const SYSTEM_PROMPT = `You are an assistant that generates Arduino ESP32 C++ code.
Always target the board: DOIT ESP32 DEVKIT V1.
The WiFi SSID is "OC LA NET KEKUTHA?" and the password is "11111111".
The ESP32 must always stay connected to WiFi.
Enable OTA (Over-the-Air) upload so that the ESP32 can be programmed wirelessly.

There are three RGB LEDs (common cathode type):
- RGB LED 1 → RED: GPIO 2, GREEN: GPIO 4, BLUE: GPIO 5
- RGB LED 2 → RED: GPIO 12, GREEN: GPIO 13, BLUE: GPIO 14
- RGB LED 3 → RED: GPIO 25, GREEN: GPIO 26, BLUE: GPIO 27

A DC motor is connected through an L298N motor driver module:
- ENA pin → GPIO 23 (PWM speed control)
- IN1 pin → GPIO 18 (Direction control)
- IN2 pin → GPIO 19 (Direction control)
- OUT1 and OUT2 pins → DC motor terminals

If a prompt is not related to RGB LEDs or the DC motor, return the message: "ENTER VALID PROMPT".
Automatically correct spelling mistakes in user prompts.
Do not ask the user for pin numbers.

Language handling:
- If the user's prompt is in Tamil, first translate it to clear English internally and then interpret it.
- Preserve technical tokens (e.g., LED, WiFi, GPIO, L298N) during translation.
- Never output the translation or any explanation; only output the final Arduino C++ sketch.

Output rules:
- If prompted to generate morse code signals, compute internally and output only code.
- Always return ONLY pure Arduino C++ code (no markdown, no explanations).
- Always include both setup() and loop() functions.`


// ==========================
// ENSURE SKETCH FOLDER EXISTS
// ==========================
const sketchDir = path.join(process.cwd(), "Sketch")
if (!fs.existsSync(sketchDir)) {
  fs.mkdirSync(sketchDir, { recursive: true })
}


// ==========================
// ✅ GENERATE ROUTE (OpenRouter FREE)
// ==========================
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY missing in .env"
      })
    }

    console.log("Generating code for:", prompt)

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      }
    )

    const data = await response.json()

    if (!data.choices || !data.choices.length) {
      console.error("AI Response:", data)
      return res.status(500).json({
        error: "No response from AI"
      })
    }

    let code = data.choices[0].message.content

    // Clean markdown
    code = code.replace(/```cpp\n?/g, "")
    code = code.replace(/```\n?/g, "")

    if (!code.includes("void setup()") || !code.includes("void loop()")) {
      return res.status(400).json({
        error: "Generated code missing setup() or loop()"
      })
    }

    res.json({ code: code.trim() })

  } catch (error) {
    console.error("Generate error:", error)
    res.status(500).json({
      error: "Failed to generate code: " + error.message
    })
  }
})


// ==========================
// ✅ UPLOAD ROUTE (REAL COMPILE + UPLOAD)
// ==========================
app.post("/upload", async (req, res) => {
  try {
    const { code, ota = false } = req.body

    if (!code) {
      return res.status(400).json({ error: "Code is required" })
    }

    const sketchPath = path.join(sketchDir, "Sketch.ino")
    fs.writeFileSync(sketchPath, code)

    console.log("Saved sketch.")
    console.log("Upload method:", ota ? "OTA" : "USB")

    const compileCommand =
      `arduino-cli compile --fqbn espressif:esp32:esp32doit-devkit-v1 "${sketchDir}"`

    exec(compileCommand, (compileError, stdout, stderr) => {
      if (compileError) {
        return res.status(500).json({
          error: "Compilation failed: " + stderr
        })
      }

      let uploadCommand

      if (ota) {
        const esp32IP = process.env.ESP32_IP || "192.168.254.200"
        uploadCommand =
          `arduino-cli upload --fqbn espressif:esp32:esp32doit-devkit-v1 -p ${esp32IP} "${sketchDir}"`
      } else {
        const esp32Port = process.env.ESP32_PORT || "COM8"
        uploadCommand =
          `arduino-cli upload -p ${esp32Port} --fqbn espressif:esp32:esp32doit-devkit-v1 "${sketchDir}"`
      }

      exec(uploadCommand, (uploadError, stdout2, stderr2) => {
        if (uploadError) {
          return res.status(500).json({
            error: "Upload failed: " + stderr2
          })
        }

        res.json({
          success: true,
          message: `Code uploaded successfully via ${ota ? "OTA" : "USB"}`
        })
      })
    })

  } catch (error) {
    res.status(500).json({
      error: "Upload failed: " + error.message
    })
  }
})


// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
