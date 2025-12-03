import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    res.json({ text: data.text });
  } catch (err) {
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

app.post("/ask", async (req, res) => {
  const { question, pdfText } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a research assistant. Answer based only on the PDF content." },
        { role: "user", content: `PDF:\n${pdfText}\n\nQuestion:\n${question}` }
      ]
    })
  });

  const data = await response.json();
  res.json({ answer: data.choices[0].message.content });
});

app.listen(10000, () => console.log("Server running"));
