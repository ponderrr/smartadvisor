import React, { useState, useEffect } from "react";
import {
  Card,
  Checkbox,
  Dropdown,
  Button,
  Toast,
  ToastMessage,
  ProgressSpinner,
} from "primereact";
import { useRef } from "react";
import api from "../../../services/api";
import "./AccountComponents.css";

interface PreferencesData {
  accessibility_require_subtitles: boolean;
  accessibility_require_audio_description: boolean;
  accessibility_require_closed_captions: boolean;
  content_filters_exclude_violent_content: boolean;
  content_filters_exclude_sexual_content: boolean;
  language: string;
}

const PreferencesTab: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    accessibility_require_subtitles: false,
    accessibility_require_audio_description: false,
    accessibility_require_closed_captions: false,
    content_filters_exclude_violent_content: false,
    content_filters_exclude_sexual_content: false,
    language: "en",
  });

  const [initialPreferences, setInitialPreferences] =
    useState<PreferencesData>(preferences);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    setHasChanges(
      JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    );
  }, [preferences, initialPreferences]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const userPrefs = await api.getUserPreferences();
      setPreferences(userPrefs);
      setInitialPreferences(userPrefs);
    } catch (error) {
      showToast("error", "Error", "Failed to load preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (
    field: keyof PreferencesData,
    value: boolean,
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = (value: string) => {
    setPreferences((prev) => ({ ...prev, language: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.updateUserPreferences(preferences);
      setInitialPreferences(preferences);
      showToast("success", "Success", "Preferences updated successfully.");
    } catch (error) {
      showToast("error", "Error", "Failed to update preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences(initialPreferences);
  };

  const showToast = (
    severity: ToastMessage["severity"],
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  return (
    <div className="preferences-section">
      <Toast ref={toast} />
      <h2 className="section-title">Preferences</h2>

      {isLoading && (
        <div className="loading-container">
          <ProgressSpinner />
        </div>
      )}

      <Card className="preferences-card">
        <div className="card-header">
          <h3 className="card-title">Accessibility Options</h3>
        </div>
        <div className="card-content">
        <div className="field-checkbox">
          <Checkbox
            inputId="subtitles"
            checked={preferences.accessibility_require_subtitles}
            onChange={(e) =>
              handleCheckboxChange(
                "accessibility_require_subtitles",
                e.checked!,
              )
            }
          />
          <label htmlFor="subtitles">Require Subtitles</label>
        </div>
        <div className="field-checkbox">
          <Checkbox
            inputId="audioDescription"
            checked={preferences.accessibility_require_audio_description}
            onChange={(e) =>
              handleCheckboxChange(
                "accessibility_require_audio_description",
                e.checked!,
              )
            }
          />
          <label htmlFor="audioDescription">Require Audio Description</label>
        </div>
        <div className="field-checkbox">
          <Checkbox
            inputId="closedCaptions"
            checked={preferences.accessibility_require_closed_captions}
            onChange={(e) =>
              handleCheckboxChange(
                "accessibility_require_closed_captions",
                e.checked!,
              )
            }
          />
          <label htmlFor="closedCaptions">Require Closed Captions</label>
        </div>
        </div>
      </Card>

      <Card className="preferences-card">
        <div className="card-header">
          <h3 className="card-title">Content Filters</h3>
        </div>
        <div className="card-content">
        <div className="field-checkbox">
          <Checkbox
            inputId="excludeViolent"
            checked={preferences.content_filters_exclude_violent_content}
            onChange={(e) =>
              handleCheckboxChange(
                "content_filters_exclude_violent_content",
                e.checked!,
              )
            }
          />
          <label htmlFor="excludeViolent">Exclude Violent Content</label>
        </div>
        <div className="field-checkbox">
          <Checkbox
            inputId="excludeSexual"
            checked={preferences.content_filters_exclude_sexual_content}
            onChange={(e) =>
              handleCheckboxChange(
                "content_filters_exclude_sexual_content",
                e.checked!,
              )
            }
          />
          <label htmlFor="excludeSexual">Exclude Sexual Content</label>
        </div>
        </div>
      </Card>

      <Card className="preferences-card">
        <div className="card-header">
          <h3 className="card-title">Language Preferences</h3>
        </div>
        <div className="card-content">
        <div className="field">
          <label htmlFor="language" className="field-label">Preferred Language</label>
          <Dropdown
            id="language"
            value={preferences.language}
            options={languages}
            onChange={(e) => handleLanguageChange(e.value)}
            optionLabel="name"
            optionValue="code"
            placeholder="Select a Language"
          />
        </div>
        </div>
      </Card>

      {hasChanges && (
        <div className="actions-container">
          <Button
            label="Save Preferences"
            icon="pi pi-save"
            onClick={handleSave}
            disabled={isLoading}
          />
          <Button
            label="Reset Changes"
            icon="pi pi-refresh"
            className="p-button-secondary"
            onClick={handleReset}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default PreferencesTab;
