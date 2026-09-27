import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

export const analyzeIssueImage = async (imageFile, userDescription = '') => {
  try {
    const imageData = await fileToBase64(imageFile);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          parts: [
            {
              text: `Analyze this image and description of a community/civic issue reported in Jharkhand, India.
              Citizen's description: "${userDescription}"
              Return ONLY a valid JSON object:
              {
                "category": "Pothole" or "Garbage/Waste" or "Broken Streetlight" or "Water Leakage" or "Damaged Road" or "Encroachment" or "Healthcare Issue" or "Education Issue" or "Agriculture/Rural Issue" or "Digital Accessibility Issue" or "Other",
                "severity": "Low" or "Medium" or "High",
                "description": "brief one line description"
              }`
            },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageData
              }
            }
          ]
        }
      ]
    });

    console.log("Gemini response:", response);
    const text = response.text;
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