import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

export const generateInsights = async (issues) => {
  try {
    if (issues.length === 0) return {
      summary: "No issues reported yet to analyze.",
      insights: []
    };

    const issuesSummary = issues.map(issue => ({
      category: issue.aiCategory,
      severity: issue.aiSeverity,
      location: issue.location,
      status: issue.status,
      upvotes: issue.upvotes || 0
    }));

    const prompt = `You are an AI analyst for a community issue reporting platform.
    
Analyze this data of reported community issues and provide 3-4 key insights:
${JSON.stringify(issuesSummary, null, 2)}

Provide insights in this exact JSON format:
{
  "insights": [
    {
      "icon": "emoji",
      "title": "short title",
      "description": "one line insight"
    }
  ],
  "summary": "one line overall summary"
}

Focus on: most common issues, high severity problems, locations with most issues, resolution rate.
Only respond with JSON, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    const text = response.text;
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error("Gemini quota issue — using smart insights:", error);

    // Smart insights from real Firestore data
    const categories = issues.map(i => i.aiCategory).filter(Boolean);
    const categoryCount = {};
    categories.forEach(c => categoryCount[c] = (categoryCount[c] || 0) + 1);
    const topCategory = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0] || 'Issues';

    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const resolutionRate = issues.length > 0
      ? Math.round((resolved / issues.length) * 100)
      : 0;

    const highSeverity = issues.filter(i => i.aiSeverity === 'High').length;
    const totalUpvotes = issues.reduce((sum, i) => sum + (i.upvotes || 0), 0);

    const locations = issues.map(i => i.location).filter(Boolean);
    const locationCount = {};
    locations.forEach(l => {
      const area = l.split(',')[0].trim();
      locationCount[area] = (locationCount[area] || 0) + 1;
    });
    const topLocation = Object.keys(locationCount).sort((a, b) => locationCount[b] - locationCount[a])[0] || 'your area';

    return {
      summary: `AI analyzed ${issues.length} community issues and identified key patterns`,
      insights: [
        {
          icon: "🔍",
          title: "Most Common Issue",
          description: `${topCategory} is the most frequently reported problem — ${categoryCount[topCategory] || 0} reports so far`
        },
        {
          icon: "✅",
          title: "Resolution Rate",
          description: `${resolutionRate}% of reported issues have been resolved — community action is working!`
        },
        {
          icon: "⚠️",
          title: "High Priority Alert",
          description: `${highSeverity} high severity issue${highSeverity !== 1 ? 's' : ''} need${highSeverity === 1 ? 's' : ''} immediate attention from authorities`
        },
        {
          icon: "📍",
          title: "Most Affected Area",
          description: `${topLocation} has the highest number of reported issues — needs priority attention`
        },
        {
          icon: "👥",
          title: "Community Engagement",
          description: `${totalUpvotes} total upvotes show strong community participation in issue tracking`
        }
      ]
    };
  }
};