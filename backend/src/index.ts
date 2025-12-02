app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    const userMsg = message.toLowerCase().trim();

    // -----------------------------------------
    // 1️⃣ GREETING LOGIC
    // -----------------------------------------
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];

    if (greetings.includes(userMsg)) {
      return res.json({
        reply: `
Hello! 👋 I am the **Daly College AI Assistant**.

I can help you with:
• Campus facilities  
• Staff information  
• Boarding & pastoral care  
• Sports & co-curricular  
• Clubs, MUN, Round Square  
• Awards, APG, Alumni  
• History & heritage  
• Academics, departments & school details  

Feel free to ask me anything about Daly College!
        `
      });
    }

    // -----------------------------------------
    // 2️⃣ OUT-OF-SCOPE CHECK
    // -----------------------------------------
    const allowedKeywords = [
      "daly", "college", "dc", "indore", "school", "campus", "staff",
      "boarding", "sports", "history", "heritage", "awards",
      "apg", "round square", "mun", "club", "laboratory", "lab",
      "fees", "admission", "principal", "teacher", "house", "library",
      "hostel", "boarding", "pastoral", "counselling", "counseling",
      "career", "festival", "event", "canteen", "mess", "temple", "mosque"
    ];

    const isDalyRelated = allowedKeywords.some(word => userMsg.includes(word));

    if (!isDalyRelated) {
      return res.json({
        reply: `
I’m here to help only with **Daly College Indore**.

For queries beyond Daly College, please contact the school:

📞 **Phone:** 0731-2719000  
📧 **Email:** principal@dalycollege.org  

You can also ask me about:
• Campus  
• Staff  
• Sports  
• Boarding  
• Clubs  
• Facilities  
• Academics  
• Awards & APG  
• School history  
        `
      });
    }

    // -----------------------------------------
    // 3️⃣ AI RESPONSE (Gemini API)
    // -----------------------------------------
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }]
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
