import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AQ.Ab8RN6LjcPry9lp05esR2t4BC36ynr13fObWwcbpyIsZpsvp0Q");

export const analyzeIssueImage = async (imageFile) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageData = await fileToBase64(imageFile);

    const prompt = `Analyze this image of a community/civic issue.
    
    Return ONLY a valid JSON object with these exact fields:
    {
      "category": "Pothole" or "Garbage/Waste" or "Broken Streetlight" or "Water Leakage" or "Damaged Road" or "Encroachment" or "Other",
      "severity": "Low" or "Medium" or "High",
      "description": "brief one line description"
    }
    
    Do not include any text before or after the JSON.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: imageFile.type,
          data: imageData
        }
      },
      prompt
    ]);

    const text = result.response.text();
    console.log("Gemini raw response:", text);
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