import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const analyzeIssueImage = async (imageFile) => {
  try {
    const imageData = await fileToBase64(imageFile);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.REACT_APP_GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this image of a community/civic issue. Return ONLY a valid JSON object:
                {
                  "category": "Pothole" or "Garbage/Waste" or "Broken Streetlight" or "Water Leakage" or "Damaged Road" or "Encroachment" or "Other",
                  "severity": "Low" or "Medium" or "High",
                  "description": "brief one line description"
                }`
              },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: imageData
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    console.log("Gemini response:", data);
    
    const text = data.candidates[0].content.parts[0].text;
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error("Gemini error:", error);
    return {
      category: "Other",
      severity: "Medium",
      description: "Could not analyze image"
    };
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
};