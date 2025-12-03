app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const rawMessage = (req.body.message || "").toString().trim();
    const message = rawMessage.toLowerCase();

    if (!rawMessage) {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    // 1) SIMPLE GREETING / SMALL TALK HANDLER
    const greetingWords = ["hi", "hello", "hey", "hii", "hiii", "yo", "sup"];
    const smallTalkPhrases = [
      "who are you",
      "what are you",
      "what can you do",
      "help",
      "menu",
      "options"
    ];

    // exact greeting or greeting + something short
    if (
      greetingWords.some(
        (g) => message === g || message.startsWith(g + " ")
      )
    ) {
      return res.json({
        reply:
          "Hi! 👋 I’m the Daly College AI Assistant. I can help you with houses, academics, sports, staff, campus, heritage and more. What would you like to know?"
      });
    }

    if (smallTalkPhrases.some((p) => message.includes(p))) {
      return res.json({
        reply:
          "I’m the Daly College AI Assistant. I use official Daly College data to answer questions about the school – like houses, leadership, academics, sports, campus facilities, boarding and heritage. Just ask me in your own words, even if the spelling is not perfect. 🙂"
      });
    }

    // 2) LOAD DALY COLLEGE DATA FROM MONGODB
    // ⚠️ CHANGE 'dalycollege' and 'resources' TO YOUR ACTUAL DB / COLLECTION NAMES
    const db = client.db("dalycollege");
    const collection = db.collection("resources");

    // you can filter later if needed; for now load everything
    const docs = await collection.find({}).toArray();

    // 3) BUILD CONTEXT FOR GEMINI
    const dataText = JSON.stringify(docs, null, 2);

    const prompt = `
You are the Daly College AI Assistant.

You ONLY use the Daly College data given below to answer.
The user might make spelling mistakes, mix English and Hindi, or write very short messages.
You must still try to understand what they mean and answer from the data.

If the exact information truly does not exist in this data, say:
"I don’t have this exact information in the Daly College data, but I can help with houses, academics, sports, staff, campus and heritage."

--- DALY COLLEGE DATA START ---
${dataText}
--- DALY COLLEGE DATA END ---

User question (may have spelling mistakes):
"""${rawMessage}"""
`;

    // 4) CALL GEMINI
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const reply =
      result?.response?.text?.() ||
      "Sorry, I could not generate a response at this moment.";

    return res.json({ reply });
  } catch (e) {
    console.error("Gemini Error:", e);
    return res.status(500).json({ error: "Gemini API error", details: e });
  }
});
