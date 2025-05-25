import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./QuestionsPage.css";

interface Question {
  id: number;
  text: string;
  type: "choice" | "rating" | "text" | "multiselect";
  options?: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "What type of content are you interested in?",
    type: "multiselect",
    options: ["Movies", "TV Shows", "Books", "Audiobooks"],
  },
  {
    id: 2,
    text: "What genres do you typically enjoy?",
    type: "multiselect",
    options: [
      "Action",
      "Adventure",
      "Comedy",
      "Drama",
      "Fantasy",
      "Horror",
      "Mystery",
      "Romance",
      "Sci-Fi",
      "Thriller",
    ],
  },
  {
    id: 3,
    text: "Name some of your favorite titles:",
    type: "text",
  },
  {
    id: 4,
    text: "How much time do you typically spend on entertainment per week?",
    type: "choice",
    options: [
      "Less than 2 hours",
      "2-5 hours",
      "5-10 hours",
      "More than 10 hours",
    ],
  },
  {
    id: 5,
    text: "Rate your interest in foreign/international content:",
    type: "rating",
  },
];

const QuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | number>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNextQuestion = useCallback(async () => {
    const question = questions[currentQuestion];
    let answer: string | string[] | number;

    switch (question.type) {
      case "multiselect":
        answer = selectedOptions;
        setSelectedOptions([]); // Reset for next question
        break;
      case "text":
        answer = textInput;
        setTextInput(""); // Reset for next question
        break;
      case "choice":
        answer = selectedOptions[0] || '';
        setSelectedOptions([]); // Reset for next question
        break;
      case "rating":
        answer = rating;
        setRating(0); // Reset for next question
        break;
      default:
        answer = '';
    }

    const updatedAnswers = { ...answers, [question.id]: answer };
    setAnswers(updatedAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsSubmitting(true);
      try {
        await api.submitQuestions(updatedAnswers);
        navigate("/recommendations");
      } catch (error) {
        console.error("Error submitting answers:", error);
        setSubmitError("Failed to submit your answers. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentQuestion, selectedOptions, textInput, rating, answers, navigate]);

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleOptionToggle = (option: string) => {
    const question = questions[currentQuestion];
    if (question.type === "choice") {
      setSelectedOptions([option]);
    } else if (question.type === "multiselect") {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );
    }
  };

  const handleRatingSelect = (value: number) => {
    setRating(value);
  };

  const renderQuestionContent = () => {
    const question = questions[currentQuestion];

    switch (question.type) {
      case "multiselect":
      case "choice":
        return (
          <div className="options-grid">
            {question.options?.map((option) => (
              <button
                key={option}
                className={`option-button ${
                  selectedOptions.includes(option) ? "selected" : ""
                }`}
                onClick={() => handleOptionToggle(option)}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case "text":
        return (
          <textarea
            className="text-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
          />
        );

      case "rating":
        return (
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className={`rating-button ${rating >= value ? "active" : ""}`}
                onClick={() => handleRatingSelect(value)}
              >
                {value}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const isAnswerValid = () => {
    const question = questions[currentQuestion];
    switch (question.type) {
      case "multiselect":
        return selectedOptions.length > 0;
      case "choice":
        return selectedOptions.length === 1;
      case "text":
        return textInput.trim().length > 0;
      case "rating":
        return rating > 0;
      default:
        return false;
    }
  };

  return (
    <div className="page-container questions-page">
      <div className="container">
        <div className="questions-card">
          <div className="progress-bar">
            <div
              className="progress"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          <div className="question-content">
            <h2 className="question-number">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <h3 className="question-text">{questions[currentQuestion].text}</h3>

            {renderQuestionContent()}
          </div>

          <div className="question-actions">
            {submitError && <div className="error-message">{submitError}</div>}
            <button
              className="btn-secondary"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0 || isLoading}
            >
              Previous
            </button>
            <button
              className="btn-primary"
              onClick={handleNextQuestion}
              disabled={!isAnswerValid() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : currentQuestion === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;