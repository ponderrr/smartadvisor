from typing import List, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.recommendation import RecommendationType
import json
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is required for AI recommendations. Please set it in your .env file."
            )

        if not settings.validate_openai_key():
            raise ValueError(
                f"Invalid OPENAI_API_KEY format. Key should start with 'sk-' or 'sk-proj-'. Got: {settings.OPENAI_API_KEY[:10]}..."
            )

        try:
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                timeout=60.0,  # Increased timeout
                max_retries=3,  # More retries
            )
            logger.info("✅ OpenAI service initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI client: {e}")
            raise

    async def generate_questions(
        self,
        recommendation_type: RecommendationType,
        num_questions: int,
        user_age: int = None,
        accessibility_needs: Dict = None,
    ) -> List[Dict[str, Any]]:
        """Generate personalized questions for recommendations."""

        logger.info(
            f"🤖 Generating {num_questions} questions for {recommendation_type.value}"
        )

        type_text = {
            RecommendationType.MOVIE: "movies",
            RecommendationType.BOOK: "books",
            RecommendationType.BOTH: "movies and books",
        }[recommendation_type]

        age_context = f" The user is {user_age} years old." if user_age else ""

        accessibility_context = ""
        if accessibility_needs:
            needs = []
            if accessibility_needs.get("require_subtitles"):
                needs.append("requires subtitles")
            if accessibility_needs.get("require_audio_description"):
                needs.append("requires audio descriptions")
            if accessibility_needs.get("exclude_violent_content"):
                needs.append("prefers non-violent content")
            if accessibility_needs.get("exclude_sexual_content"):
                needs.append("prefers content without sexual themes")

            if needs:
                accessibility_context = f" User preferences: {', '.join(needs)}."

        system_prompt = "You are an expert recommendation assistant. Generate thoughtful, specific questions to understand user preferences. Always return valid JSON arrays with no additional text."

        user_prompt = f"""Generate exactly {num_questions} personalized questions to help recommend {type_text}.{age_context}{accessibility_context}

Requirements:
- Questions should be specific and actionable for recommendations
- Cover diverse aspects: genres, themes, mood, recent vs classic, format preferences
- Be age-appropriate and engaging
- Help understand user's taste and preferences

Return ONLY a JSON array in this exact format:
[
    {{"text": "What genres do you enjoy most?", "order": 1}},
    {{"text": "Do you prefer recent releases or classics?", "order": 2}}
]

Generate exactly {num_questions} questions. No additional text."""

        try:
            logger.info("🔄 Making OpenAI API request for questions...")

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1000,
                temperature=0.7,
                response_format={"type": "json_object"},  # Force JSON response
            )

            content = response.choices[0].message.content.strip()
            logger.info(
                f"✅ Received OpenAI response for questions: {len(content)} characters"
            )

            # Parse JSON response
            try:
                # Sometimes OpenAI wraps the array in an object, handle both cases
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "questions" in parsed:
                    questions = parsed["questions"]
                elif isinstance(parsed, list):
                    questions = parsed
                else:
                    raise ValueError(f"Unexpected response format: {type(parsed)}")

                if not isinstance(questions, list):
                    raise ValueError("Questions is not a list")

                if len(questions) != num_questions:
                    logger.warning(
                        f"Expected {num_questions} questions, got {len(questions)}"
                    )

                # Validate question format
                for i, q in enumerate(questions):
                    if not isinstance(q, dict) or "text" not in q:
                        raise ValueError(f"Invalid question format at index {i}: {q}")
                    if "order" not in q:
                        q["order"] = i + 1

                logger.info(f"✅ Successfully parsed {len(questions)} questions")
                return questions

            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse JSON response: {e}")
                logger.error(f"Raw response: {content}")
                raise Exception(f"OpenAI returned invalid JSON: {e}")

        except Exception as e:
            logger.error(f"❌ Failed to generate questions: {e}")
            raise Exception(f"Question generation failed: {str(e)}")

    async def generate_recommendations(
        self,
        recommendation_type: RecommendationType,
        questions_and_answers: List[Dict[str, str]],
        user_age: int = None,
        accessibility_needs: Dict = None,
    ) -> Dict[str, Any]:
        """Generate recommendations based on user answers."""

        logger.info(f"🎯 Generating recommendations for {recommendation_type.value}")

        qa_text = "\n".join(
            [f"Q: {qa['question']}\nA: {qa['answer']}" for qa in questions_and_answers]
        )

        age_context = f" User age: {user_age}." if user_age else ""

        accessibility_context = ""
        if accessibility_needs:
            context_parts = []
            if accessibility_needs.get("exclude_violent_content"):
                context_parts.append("exclude violent content")
            if accessibility_needs.get("exclude_sexual_content"):
                context_parts.append("exclude sexual content")

            if context_parts:
                accessibility_context = (
                    f" Content restrictions: {', '.join(context_parts)}."
                )

        type_instructions = {
            RecommendationType.MOVIE: "Recommend 5-7 movies",
            RecommendationType.BOOK: "Recommend 5-7 books",
            RecommendationType.BOTH: "Recommend 3-4 movies and 3-4 books",
        }

        system_prompt = "You are an expert entertainment recommendation assistant. Provide personalized recommendations based on user preferences. Always return valid JSON with real, existing titles."

        user_prompt = f"""{type_instructions[recommendation_type]} based on these user preferences:{age_context}{accessibility_context}

User Responses:
{qa_text}

Requirements:
- Recommend ONLY real, existing titles
- Provide detailed descriptions (2-3 sentences each)
- Explain why each recommendation matches their preferences
- Include appropriate metadata (ratings, genres, etc.)

Return ONLY JSON in this exact format:
{{
    "movies": [
        {{
            "title": "Actual Movie Title",
            "description": "Detailed description of the movie and why it's good.",
            "why_recommended": "Specific reason why this matches their preferences",
            "age_rating": "PG-13",
            "genres": ["Genre1", "Genre2"],
            "year": 2023
        }}
    ],
    "books": [
        {{
            "title": "Actual Book Title", 
            "author": "Author Name",
            "description": "Detailed description of the book and its appeal.",
            "why_recommended": "Specific reason why this matches their preferences",
            "age_rating": "Adult",
            "genres": ["Genre1", "Genre2"]
        }}
    ]
}}

Include only the arrays for the requested type ({recommendation_type.value}). Ensure all titles are real and exist."""

        try:
            logger.info("🔄 Making OpenAI API request for recommendations...")

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=2000,
                temperature=0.8,
                response_format={"type": "json_object"},  # Force JSON response
            )

            content = response.choices[0].message.content.strip()
            logger.info(
                f"✅ Received OpenAI response for recommendations: {len(content)} characters"
            )

            try:
                recommendations = json.loads(content)

                if not isinstance(recommendations, dict):
                    raise ValueError(f"Expected dict, got {type(recommendations)}")

                # Validate the structure
                if recommendation_type in [
                    RecommendationType.MOVIE,
                    RecommendationType.BOTH,
                ]:
                    if "movies" not in recommendations:
                        recommendations["movies"] = []
                    elif not isinstance(recommendations["movies"], list):
                        raise ValueError("movies must be a list")

                if recommendation_type in [
                    RecommendationType.BOOK,
                    RecommendationType.BOTH,
                ]:
                    if "books" not in recommendations:
                        recommendations["books"] = []
                    elif not isinstance(recommendations["books"], list):
                        raise ValueError("books must be a list")

                movies_count = len(recommendations.get("movies", []))
                books_count = len(recommendations.get("books", []))
                total_count = movies_count + books_count

                if total_count == 0:
                    raise Exception(
                        "OpenAI returned no recommendations. This might be due to very restrictive preferences or an API issue."
                    )

                logger.info(
                    f"✅ Successfully generated {movies_count} movies and {books_count} books"
                )
                return recommendations

            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse recommendations JSON: {e}")
                logger.error(f"Raw response: {content}")
                raise Exception(f"OpenAI returned invalid JSON: {e}")

        except Exception as e:
            logger.error(f"❌ Failed to generate recommendations: {e}")
            raise Exception(f"Recommendation generation failed: {str(e)}")


openai_service = OpenAIService()
