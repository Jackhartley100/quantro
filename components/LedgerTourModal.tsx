"use client";

import { useState, useEffect } from "react";
import { markTourAsSeen, updateProfileSettings } from "@/app/actions/profile";
import { formatCurrency } from "@/lib/currencyUtils";
import { supabase } from "@/lib/supabase";
import { setLocalStorageTourSeen } from "@/lib/tourVisibility";

type TourSlide = {
  title: string;
  text: string;
  hasInput?: boolean;
};

const TOUR_SLIDES: TourSlide[] = [
  {
    title: "Welcome to Quantro.",
    text: "I'll walk you through the core features so you're in control from the start.",
  },
  {
    title: "What's your monthly net goal?",
    text: "This helps us show your progress and keep you focused on what really matters: how much you keep.",
    hasInput: true,
  },
  {
    title: "Add income and expenses.",
    text: "This is the core of your tracking. Log what you earn and what you spend — daily or weekly is enough.",
  },
  {
    title: "See your real profitability.",
    text: "Net + Effective Hourly show you what you're actually keeping and what your time is worth.",
  },
  {
    title: "Categories reveal patterns.",
    text: "Understanding where money flows helps you reduce costs and increase profit over time.",
  },
];

export default function LedgerTourModal({
  isOpen,
  onClose,
  currencySymbol = "£",
}: {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [monthlyNetGoalInput, setMonthlyNetGoalInput] = useState<string>("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsAnimating(false);
      setMonthlyNetGoalInput("");
    }
  }, [isOpen]);

  const handleNext = async () => {
    // If we're on the goal step (index 1), save the goal if provided
    if (currentStep === 1 && monthlyNetGoalInput.trim() !== "") {
      const value = parseFloat(monthlyNetGoalInput);
      if (!isNaN(value) && value > 0) {
        setIsSavingGoal(true);
        await updateProfileSettings({ monthly_net_goal: value });
        setIsSavingGoal(false);
      }
    }

    if (currentStep < TOUR_SLIDES.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = async () => {
    // Write to DB first (authoritative)
    await markTourAsSeen();
    // Then write to localStorage for fast future checks
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setLocalStorageTourSeen(user.id);
    }
    onClose();
  };

  const handleFinish = async () => {
    // Write to DB first (authoritative)
    await markTourAsSeen();
    // Then write to localStorage for fast future checks
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setLocalStorageTourSeen(user.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentSlide = TOUR_SLIDES[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_SLIDES.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60] transition-opacity duration-200"
        style={{ opacity: 1 }}
        onClick={handleSkip}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full transition-all duration-200"
          style={{ opacity: 1, transform: 'scale(1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            {/* Header with Ledger Avatar and Step Counter */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center overflow-hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                  >
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="48" fill="#10b981" fillOpacity="0.15" />
                    
                    {/* Head shape - professional and calm */}
                    <ellipse cx="50" cy="48" rx="32" ry="35" fill="#10b981" fillOpacity="0.25" />
                    
                    {/* Eyes - calm and clear */}
                    <ellipse cx="42" cy="42" rx="3.5" ry="4" fill="#10b981" />
                    <ellipse cx="58" cy="42" rx="3.5" ry="4" fill="#10b981" />
                    
                    {/* Eye highlights for clarity */}
                    <circle cx="43" cy="41" r="1.2" fill="#ffffff" fillOpacity="0.9" />
                    <circle cx="59" cy="41" r="1.2" fill="#ffffff" fillOpacity="0.9" />
                    
                    {/* Gentle, professional smile */}
                    <path
                      d="M 40 58 Q 50 65 60 58"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeOpacity="0.7"
                    />
                    
                    {/* Subtle professional details */}
                    <ellipse cx="50" cy="62" rx="8" ry="3" fill="#10b981" fillOpacity="0.15" />
                  </svg>
                </div>
              </div>
              <div className="flex-shrink-0">
                <p className="text-sm text-neutral-400 whitespace-nowrap">
                  {currentStep + 1} of {TOUR_SLIDES.length}
                </p>
              </div>
            </div>

            {/* Content with fade animation */}
            <div
              className={`mb-6 transition-opacity duration-200 ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
            >
              <h4 className="text-xl font-semibold text-neutral-100 mb-3">
                {currentSlide.title}
              </h4>
              <p className="text-base text-neutral-300 leading-relaxed mb-4">
                {currentSlide.text}
              </p>
              {currentSlide.hasInput && (
                <div>
                  <input
                    type="number"
                    value={monthlyNetGoalInput}
                    onChange={(e) => setMonthlyNetGoalInput(e.target.value)}
                    placeholder={formatCurrency(3000, currencySymbol)}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    min="0"
                    step="0.01"
                    disabled={isSavingGoal}
                  />
                </div>
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex items-center gap-2 mb-6">
              {TOUR_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (index !== currentStep) {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentStep(index);
                        setIsAnimating(false);
                      }, 150);
                    }
                  }}
                  className={`transition-all duration-200 rounded-full ${
                    index === currentStep
                      ? "w-8 h-2 bg-emerald-500"
                      : "w-2 h-2 bg-neutral-700 hover:bg-neutral-600"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Skip
              </button>
              <div className="flex items-center gap-3">
                {!isFirstStep && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-sm rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                >
                  {isLastStep ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

