import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Add your OpenAI API key here
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/api/question", async (req, res) => {
  const topic = req.query.topic || "general knowledge";
  const prompt = `Generate one ${topic} question with 4 options (A,B,C,D) and specify the correct answer. Respond in JSON format.`;

  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt
  });

  const text = completion.output[0].content[0].text;
  res.json(JSON.parse(text));
});

app.post("/api/answer", (req, res) => {
  const { selected, correct } = req.body;
  res.json({
    correct: selected === correct,
    message: selected === correct ? "✅ Correct!" : "❌ Wrong!"
  });
});

app.listen(4000, () => console.log("Quiz backend running on port 4000"));
