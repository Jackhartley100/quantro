"use client";

import { useState, useEffect } from "react";
import ProfileTab from "./ProfileTab";
import DeleteAccountModal from "./DeleteAccountModal";
import { getProfile, updateProfileSettings } from "@/app/actions/profile";
import { showToast } from "./Toast";
import { formatCurrency, getCurrencyCodeFromSymbol } from "@/lib/currencyUtils";

type Settings = {
  currencySymbol: string;
  weekStartsOn: string;
};

const defaultSettings: Settings = {
  currencySymbol: "£",
  weekStartsOn: "Mon",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Migrate from old key to new key
    const oldStored = localStorage.getItem("coinpilot-settings");
    const stored = localStorage.getItem("quantro-settings");
    
    let settingsToUse = stored;
    
    // If old key exists but new doesn't, migrate
    if (oldStored && !stored) {
      localStorage.setItem("quantro-settings", oldStored);
      settingsToUse = oldStored;
      // Optionally remove old key after migration
      // localStorage.removeItem("coinpilot-settings");
    }
    
    if (settingsToUse) {
      try {
        const parsed = JSON.parse(settingsToUse);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem("quantro-settings", JSON.stringify(newSettings));
  };

  return { settings: mounted ? settings : defaultSettings, updateSettings };
}

type Tab = "general" | "profile";

export default function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  initialTab = "general",
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  initialTab?: Tab;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveButton, setSaveButton] = useState<JSX.Element | null>(null);
  const [monthlyNetGoal, setMonthlyNetGoal] = useState<number | null>(null);
  const [monthlyNetGoalInput, setMonthlyNetGoalInput] = useState<string>("");
  const [isLoadingGoal, setIsLoadingGoal] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Load profile when drawer opens
  useEffect(() => {
    if (isOpen && activeTab === "general") {
      setIsLoadingGoal(true);
      getProfile().then((result) => {
        if (result.ok && result.data) {
          const goal = result.data.monthly_net_goal;
          setMonthlyNetGoal(goal);
          setMonthlyNetGoalInput(goal ? goal.toString() : "");
        }
        setIsLoadingGoal(false);
      });
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    } else {
      // Clear save button when drawer closes
      setSaveButton(null);
    }
  }, [isOpen, initialTab]);

  const handleSaveMonthlyNetGoal = async () => {
    setIsSavingGoal(true);
    const value = monthlyNetGoalInput.trim() === "" ? null : parseFloat(monthlyNetGoalInput);
    
    // Validate
    if (value !== null && (isNaN(value) || value <= 0)) {
      showToast("Monthly net goal must be greater than 0", "error");
      setIsSavingGoal(false);
      return;
    }

    const result = await updateProfileSettings({
      monthly_net_goal: value,
    });

    if (result.ok) {
      setMonthlyNetGoal(value);
      showToast(result.message || "Monthly net goal saved successfully", "success");
    } else {
      showToast(result.message || "Failed to save monthly net goal", "error");
    }
    setIsSavingGoal(false);
  };

  const hasGoalChanged = monthlyNetGoalInput !== (monthlyNetGoal?.toString() || "");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-80 bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 text-xl sm:text-base"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-neutral-800 mt-4">
            <button
              onClick={() => {
                setActiveTab("general");
                setSaveButton(null);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "general"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {activeTab === "general" && (
              <div className="space-y-4 pb-24">
                <div>
                  <label className="label mb-2">Currency Symbol</label>
                  <input
                    className="input"
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => {
                      const newSettings = { ...settings, currencySymbol: e.target.value };
                      onSettingsChange(newSettings);
                    }}
                    placeholder="£"
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="label mb-2">Week Starts On</label>
                  <select
                    className="select"
                    value={settings.weekStartsOn}
                    onChange={(e) => {
                      const newSettings = { ...settings, weekStartsOn: e.target.value };
                      onSettingsChange(newSettings);
                    }}
                  >
                    <option value="Mon">Monday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="label mb-2">Monthly Net Goal</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      type="number"
                      value={monthlyNetGoalInput}
                      onChange={(e) => setMonthlyNetGoalInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      disabled={isLoadingGoal || isSavingGoal}
                    />
                    <button
                      onClick={handleSaveMonthlyNetGoal}
                      disabled={!hasGoalChanged || isLoadingGoal || isSavingGoal}
                      className="px-4 py-2 text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingGoal ? "Saving..." : "Save"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {monthlyNetGoalInput && !isNaN(parseFloat(monthlyNetGoalInput)) && parseFloat(monthlyNetGoalInput) > 0
                      ? `Preview: ${formatCurrency(parseFloat(monthlyNetGoalInput), settings.currencySymbol)}`
                      : "Set a monthly net profit goal to track your progress. Leave empty to disable."}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="w-full px-4 py-2 text-sm bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <>
                <div className="pb-24">
                  <ProfileTab onSaveButtonRender={setSaveButton} />
                </div>
                {/* Sticky Footer for Save Button */}
                {saveButton && (
                  <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 sm:py-5 border-t border-neutral-800 bg-neutral-900 -mb-4 sm:-mb-6">
                    {saveButton}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </>
  );
}

