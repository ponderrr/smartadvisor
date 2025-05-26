import React, { useState, useEffect } from "react";
import {
  Save,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Filter,
  Globe,
} from "lucide-react";
import api from "../../../services/api";

interface PreferencesData {
  accessibility_require_subtitles: boolean;
  accessibility_require_audio_description: boolean;
  accessibility_require_closed_captions: boolean;
  content_filters_exclude_violent_content: boolean;
  content_filters_exclude_sexual_content: boolean;
  language: string;
}

const PreferencesTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed =
      JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
    setHasChanges(changed);
  }, [preferences, initialPreferences]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const userPrefs = await api.getUserPreferences();
      const prefsData = {
        accessibility_require_subtitles:
          userPrefs.accessibility_require_subtitles,
        accessibility_require_audio_description:
          userPrefs.accessibility_require_audio_description,
        accessibility_require_closed_captions:
          userPrefs.accessibility_require_closed_captions,
        content_filters_exclude_violent_content:
          userPrefs.content_filters_exclude_violent_content,
        content_filters_exclude_sexual_content:
          userPrefs.content_filters_exclude_sexual_content,
        language: userPrefs.language,
      };
      setPreferences(prefsData);
      setInitialPreferences(prefsData);
    } catch (error) {
      console.error("Failed to load preferences:", error);
      // Continue with defaults if preferences don't exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (
    field: keyof PreferencesData,
    value: boolean,
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLanguageChange = (language: string) => {
    setPreferences((prev) => ({ ...prev, language }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await api.updateUserPreferences(preferences);
      setInitialPreferences(preferences);
      setSuccess("Preferences updated successfully!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update preferences",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences(initialPreferences);
    setError(null);
  };

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

  return (
    <div className="form-section">
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Preferences</h2>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="alert success">
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div className="alert error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "var(--space-8)" }}>
        {/* Accessibility Settings */}
        <div
          style={{
            background: "var(--glass-white)",
            padding: "var(--space-6)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--neutral-800)",
              marginBottom: "var(--space-6)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <Eye size={20} />
            Accessibility Options
          </h3>

          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                cursor: "pointer",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-normal)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={preferences.accessibility_require_subtitles}
                onChange={(e) =>
                  handleCheckboxChange(
                    "accessibility_require_subtitles",
                    e.target.checked,
                  )
                }
                disabled={isLoading}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-500)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  Require Subtitles
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--neutral-600)",
                  }}
                >
                  Only recommend movies with subtitle options
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                cursor: "pointer",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-normal)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={preferences.accessibility_require_audio_description}
                onChange={(e) =>
                  handleCheckboxChange(
                    "accessibility_require_audio_description",
                    e.target.checked,
                  )
                }
                disabled={isLoading}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-500)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  Require Audio Description
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--neutral-600)",
                  }}
                >
                  Only recommend movies with audio description for visually
                  impaired viewers
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                cursor: "pointer",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-normal)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={preferences.accessibility_require_closed_captions}
                onChange={(e) =>
                  handleCheckboxChange(
                    "accessibility_require_closed_captions",
                    e.target.checked,
                  )
                }
                disabled={isLoading}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-500)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  Require Closed Captions
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--neutral-600)",
                  }}
                >
                  Only recommend movies with closed caption support
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Content Filters */}
        <div
          style={{
            background: "var(--glass-white)",
            padding: "var(--space-6)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--neutral-800)",
              marginBottom: "var(--space-6)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <Filter size={20} />
            Content Filters
          </h3>

          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                cursor: "pointer",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-normal)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={preferences.content_filters_exclude_violent_content}
                onChange={(e) =>
                  handleCheckboxChange(
                    "content_filters_exclude_violent_content",
                    e.target.checked,
                  )
                }
                disabled={isLoading}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-500)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  Exclude Violent Content
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--neutral-600)",
                  }}
                >
                  Avoid recommendations with graphic violence or intense action
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                cursor: "pointer",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                transition: "all var(--transition-normal)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={preferences.content_filters_exclude_sexual_content}
                onChange={(e) =>
                  handleCheckboxChange(
                    "content_filters_exclude_sexual_content",
                    e.target.checked,
                  )
                }
                disabled={isLoading}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-500)",
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: "var(--weight-medium)",
                    color: "var(--neutral-800)",
                    fontSize: "var(--text-base)",
                  }}
                >
                  Exclude Sexual Content
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--neutral-600)",
                  }}
                >
                  Avoid recommendations with sexual themes or mature content
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Language Settings */}
        <div
          style={{
            background: "var(--glass-white)",
            padding: "var(--space-6)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--neutral-800)",
              marginBottom: "var(--space-6)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <Globe size={20} />
            Language Preferences
          </h3>

          <div className="form-group">
            <label className="form-label">Preferred Language</label>
            <select
              value={preferences.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isLoading}
              className="form-input"
              style={{ maxWidth: "300px" }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <small
              style={{
                color: "var(--neutral-500)",
                fontSize: "var(--text-sm)",
              }}
            >
              This affects the language of recommended content when available
            </small>
          </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              justifyContent: "flex-start",
              padding: "var(--space-6)",
              background: "var(--glass-white)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-save"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="btn-edit"
            >
              Reset Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreferencesTab;
