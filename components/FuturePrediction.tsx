import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, RefreshCw, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Prediction } from '../types';
import { GoogleGenAI } from '@google/genai';

interface FuturePredictionProps {
  userName: string;
  userRole: string;
}

export const FuturePrediction: React.FC<FuturePredictionProps> = ({ userName, userRole }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const categories = [
    'Workload',
    'Project Timeline',
    'Team Performance',
    'Market Trends',
    'Resource Needs',
    'Risk Assessment',
    'Custom'
  ];

  // Load predictions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('predictions');
    if (saved) {
      setPredictions(JSON.parse(saved));
    }
  }, []);

  // Save predictions to localStorage
  useEffect(() => {
    localStorage.setItem('predictions', JSON.stringify(predictions));
  }, [predictions]);

  const getAiClient = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY is missing in the environment");
    }
    return new GoogleGenAI({ apiKey });
  };

  const generatePrediction = async (category: string, customQuery?: string) => {
    setIsGenerating(true);
    try {
      const ai = getAiClient();
      const query = customQuery || `Generate future predictions and insights about ${category.toLowerCase()} for a ${userRole} in a corporate environment. Provide actionable recommendations.`;
      
      const prompt = `You are a strategic AI advisor. Based on current trends and data patterns, provide future predictions for the following area: ${category}.

${customQuery ? `Specific query: ${customQuery}` : ''}

Please provide:
1. A clear prediction title
2. A detailed description of what might happen
3. A confidence level (0-100)
4. The timeframe (e.g., "Next 3 months", "Q2 2024")
5. The potential impact (low, medium, or high)
6. 3-5 actionable recommendations

Format your response as JSON with this structure:
{
  "title": "Prediction title",
  "description": "Detailed description",
  "confidence": 75,
  "timeframe": "Next 3 months",
  "impact": "high",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

User context: ${userName} (${userRole})`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const text = response.text || '';
      
      // Try to extract JSON from the response
      let predictionData;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          predictionData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing
          predictionData = {
            title: `Future Insights: ${category}`,
            description: text,
            confidence: 70,
            timeframe: 'Next quarter',
            impact: 'medium' as const,
            recommendations: ['Monitor trends closely', 'Prepare contingency plans', 'Stay informed']
          };
        }
      } catch (e) {
        // If JSON parsing fails, create a structured response from text
        predictionData = {
          title: `Future Insights: ${category}`,
          description: text,
          confidence: 70,
          timeframe: 'Next quarter',
          impact: 'medium' as const,
          recommendations: ['Monitor trends closely', 'Prepare contingency plans', 'Stay informed']
        };
      }

      const newPrediction: Prediction = {
        id: Date.now().toString(),
        category: category,
        title: predictionData.title || `Future Insights: ${category}`,
        description: predictionData.description || text,
        confidence: Math.min(100, Math.max(0, predictionData.confidence || 70)),
        timeframe: predictionData.timeframe || 'Next quarter',
        impact: predictionData.impact || 'medium',
        recommendations: Array.isArray(predictionData.recommendations) 
          ? predictionData.recommendations 
          : ['Monitor trends closely', 'Prepare contingency plans', 'Stay informed']
      };

      setPredictions([newPrediction, ...predictions]);
      setShowCustomForm(false);
      setCustomPrompt('');
    } catch (error) {
      console.error('Prediction generation error:', error);
      alert('Failed to generate prediction. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (category === 'Custom') {
      setShowCustomForm(true);
    } else {
      generatePrediction(category);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      generatePrediction('Custom', customPrompt);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this prediction?')) {
      setPredictions(predictions.filter(p => p.id !== id));
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const filteredPredictions = selectedCategory === 'all'
    ? predictions
    : predictions.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Future Prediction</h1>
          <p className="text-slate-600">Get AI-powered insights and predictions for your work</p>
        </div>

        {/* Category Selection */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Predictions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                disabled={isGenerating}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all
                  ${isGenerating
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300'}
                  font-medium text-sm
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles size={16} />
                    <span>{category}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter */}
        {predictions.length > 0 && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.filter(c => c !== 'Custom').map(category => {
              const count = predictions.filter(p => p.category === category).length;
              if (count === 0) return null;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <TrendingUp size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Predictions Yet</h3>
            <p className="text-slate-600 mb-4">Select a category above to generate AI-powered predictions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map(prediction => (
              <div key={prediction.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{prediction.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(prediction.impact)}`}>
                        {prediction.impact} impact
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {prediction.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                          {prediction.confidence}% confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Timeframe: {prediction.timeframe}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 mb-4 leading-relaxed">{prediction.description}</p>
                    {prediction.recommendations && prediction.recommendations.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-green-600" />
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {prediction.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-orange-600 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(prediction.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                    title="Delete"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Category: {prediction.category}</span>
                  <button
                    onClick={() => generatePrediction(prediction.category)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Prediction Form Modal */}
        {showCustomForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Custom Prediction</h2>
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomPrompt('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCustomSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    What would you like to predict or analyze?
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Predict the impact of remote work on team productivity over the next 6 months..."
                    rows={5}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isGenerating || !customPrompt.trim()}
                    className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      'Generate Prediction'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomPrompt('');
                    }}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

