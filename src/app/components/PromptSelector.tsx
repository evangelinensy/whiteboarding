'use client';

import React, { useState } from 'react';
import { DESIGN_PROMPTS, DesignPrompt } from '../data/prompts';

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
  onStartSession: () => void;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({ onSelectPrompt, onStartSession }) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('food-delivery-offline');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const selectedPrompt = DESIGN_PROMPTS.find((p) => p.id === selectedPromptId);

  const filteredPrompts = DESIGN_PROMPTS.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  const handleStart = () => {
    if (selectedPrompt) {
      onSelectPrompt(selectedPrompt.prompt);
      onStartSession();
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'improve-existing': 'Improve Existing',
      'new-product': 'New Product',
      'accessibility': 'Accessibility',
      'business-metric': 'Business Metric',
      'mobile-app': 'Mobile App',
      'constraint-based': 'Constraint-Based',
    };
    return labels[category] || category;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">Design Challenge Coach</h1>
          <p className="text-blue-100">
            Choose a design challenge to practice your interview skills
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Prompt List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="improve-existing">Improve Existing</option>
                    <option value="new-product">New Product</option>
                    <option value="mobile-app">Mobile App</option>
                    <option value="accessibility">Accessibility</option>
                    <option value="constraint-based">Constraint-Based</option>
                    <option value="business-metric">Business Metric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prompt List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedPromptId === prompt.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {prompt.title}
                      </h3>
                      {prompt.company && (
                        <p className="text-xs text-gray-500 mt-0.5">{prompt.company}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(
                          prompt.difficulty
                        )}`}
                      >
                        {prompt.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getCategoryLabel(prompt.category)}
                  </p>
                </button>
              ))}
              {filteredPrompts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No prompts match your filters
                </div>
              )}
            </div>
          </div>

          {/* Right: Prompt Details */}
          <div className="w-1/2 flex flex-col">
            {selectedPrompt ? (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedPrompt.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(
                          selectedPrompt.difficulty
                        )}`}
                      >
                        {selectedPrompt.difficulty.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-800">
                        {getCategoryLabel(selectedPrompt.category)}
                      </span>
                      {selectedPrompt.company && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                          {selectedPrompt.company}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                        {selectedPrompt.prompt}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-sm text-blue-900 mb-2">
                      Interview Format
                    </h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>Discovery:</strong> 20 minutes - Understand the problem, ask
                        clarifying questions
                      </p>
                      <p>
                        <strong>Heads-down:</strong> 25 minutes - Sketch solutions, create
                        wireframes
                      </p>
                      <p>
                        <strong>Presentation:</strong> 15 minutes - Present your solution and
                        rationale
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-sm text-purple-900 mb-2">Pro Tips</h3>
                    <ul className="space-y-1 text-sm text-purple-800 list-disc list-inside">
                      <li>Verbalize your thinking out loud as you work</li>
                      <li>Name screens and components clearly (e.g., "Home Screen", "Card Component")</li>
                      <li>Explain WHY you chose specific UX patterns</li>
                      <li>Call out design trade-offs and pros/cons</li>
                      <li>Reference constraints in your solution</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleStart}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Start Interview Session →
                  </button>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    You'll have 60 minutes total. Camera and microphone will be requested.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a challenge to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptSelector;
