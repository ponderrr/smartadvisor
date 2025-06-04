# api/app/services/openai_service.py - DEBUG VERSION
# Replace your openai_service.py with this temporarily to see what's happening

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
            raise ValueError("OPENAI_API_KEY is required for AI recommendations.")

        if not settings.validate_openai_key():
            raise ValueError(f"Invalid OPENAI_API_KEY format.")

        try:
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                timeout=60.0,
                max_retries=3,
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

        logger.info(f"🤖 Generating {num_questions} questions for {recommendation_type.value}")

        type_text = {
            RecommendationType.MOVIE: "movies",
            RecommendationType.BOOK: "books",
            RecommendationType.BOTH: "movies and books",
        }[recommendation_type]

        system_prompt = "You are an expert recommendation assistant. Generate thoughtful questions. Always return valid JSON."

        user_prompt = f"""Generate exactly {num_questions} personalized questions to help recommend {type_text}.

Return ONLY a JSON object with a "questions" array:
{{
    "questions": [
        {{"text": "What genres do you enjoy most?", "order": 1}},
        {{"text": "Do you prefer recent releases or classics?", "order": 2}}
    ]
}}

Generate exactly {num_questions} questions."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1000,
                temperature=0.7,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content.strip()
            parsed = json.loads(content)

            if isinstance(parsed, dict) and "questions" in parsed:
                questions = parsed["questions"]
            elif isinstance(parsed, list):
                questions = parsed
            else:
                raise ValueError("Invalid response format")

            for i, q in enumerate(questions):
                if not isinstance(q, dict) or "text" not in q:
                    raise ValueError(f"Invalid question format: {q}")
                if "order" not in q:
                    q["order"] = i + 1

            logger.info(f"✅ Generated {len(questions)} questions")
            return questions

        except Exception as e:
            logger.error(f"❌ Question generation failed: {e}")
            raise Exception(f"Failed to generate questions: {str(e)}")

    async def generate_recommendations(
        self,
        recommendation_type: RecommendationType,
        questions_and_answers: List[Dict[str, str]],
        user_age: int = None,
        accessibility_needs: Dict = None,
    ) -> Dict[str, Any]:
        """Generate recommendations - DEBUG VERSION to see what's happening."""

        logger.info(f"🎯 DEBUG: Starting recommendation generation for {recommendation_type.value}")
        logger.info(f"🔍 DEBUG: Received {len(questions_and_answers)} Q&A pairs")

        # Log the Q&A pairs
        for i, qa in enumerate(questions_and_answers):
            logger.info(f"🔍 DEBUG Q{i+1}: {qa['question'][:50]}...")
            logger.info(f"🔍 DEBUG A{i+1}: {qa['answer'][:50]}...")

        qa_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in questions_and_answers])

        # Simple, direct prompt
        if recommendation_type == RecommendationType.MOVIE:
            target = "exactly 1 movie"
        elif recommendation_type == RecommendationType.BOOK:
            target = "exactly 1 book"
        else:
            target = "exactly 1 movie and exactly 1 book"

        system_prompt = """You are a movie and book recommendation expert.
You must recommend real, existing titles only.
Always return valid JSON in the exact format requested."""

        user_prompt = f"""Based on these preferences, recommend {target}:

{qa_text}

Requirements:
- Only recommend real, existing titles
- Provide specific reasons why each recommendation matches their answers
- Include accurate information

Return JSON in this exact format:
{{
    "movies": [
        {{
            "title": "Real Movie Title",
            "description": "Why this movie is good and matches their preferences",
            "age_rating": "PG-13",
            "genres": ["Action", "Adventure"],
            "year": 2020
        }}
    ],
    "books": [
        {{
            "title": "Real Book Title",
            "author": "Author Name",
            "description": "Why this book matches their preferences",
            "age_rating": "Adult",
            "genres": ["Fiction", "Adventure"]
        }}
    ]
}}

For movie request: include only "movies" array with 1 item
For book request: include only "books" array with 1 item
For both: include both arrays with 1 item each

Recommend {target}."""

        try:
            logger.info("🔄 DEBUG: Making OpenAI API request...")
            logger.info(f"🔍 DEBUG: System prompt length: {len(system_prompt)}")
            logger.info(f"🔍 DEBUG: User prompt length: {len(user_prompt)}")

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1500,
                temperature=0.7,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content.strip()

            logger.info(f"🔍 DEBUG: OpenAI response length: {len(content)}")
            logger.info(f"🔍 DEBUG: OpenAI raw response: {content}")

            try:
                recommendations = json.loads(content)

                logger.info(f"🔍 DEBUG: Parsed response type: {type(recommendations)}")
                logger.info(f"🔍 DEBUG: Response keys: {list(recommendations.keys()) if isinstance(recommendations, dict) else 'Not a dict'}")

                if not isinstance(recommendations, dict):
                    logger.error(f"❌ DEBUG: Expected dict, got {type(recommendations)}")
                    raise ValueError("Invalid response format")

                # Check structure
                if recommendation_type in [RecommendationType.MOVIE, RecommendationType.BOTH]:
                    if "movies" not in recommendations:
                        logger.warning("⚠️ DEBUG: No 'movies' key in response, adding empty array")
                        recommendations["movies"] = []
                    else:
                        logger.info(f"🔍 DEBUG: Found movies array with {len(recommendations['movies'])} items")
                        for i, movie in enumerate(recommendations["movies"]):
                            logger.info(f"🔍 DEBUG: Movie {i+1}: {movie.get('title', 'No title')}")

                if recommendation_type in [RecommendationType.BOOK, RecommendationType.BOTH]:
                    if "books" not in recommendations:
                        logger.warning("⚠️ DEBUG: No 'books' key in response, adding empty array")
                        recommendations["books"] = []
                    else:
                        logger.info(f"🔍 DEBUG: Found books array with {len(recommendations['books'])} items")
                        for i, book in enumerate(recommendations["books"]):
                            logger.info(f"🔍 DEBUG: Book {i+1}: {book.get('title', 'No title')} by {book.get('author', 'No author')}")

                movies_count = len(recommendations.get("movies", []))
                books_count = len(recommendations.get("books", []))
                total_count = movies_count + books_count

                logger.info(f"📊 DEBUG: Final counts - Movies: {movies_count}, Books: {books_count}, Total: {total_count}")

                if total_count == 0:
                    logger.error("❌ DEBUG: OpenAI returned zero recommendations!")
                    logger.error(f"❌ DEBUG: This might be a prompt issue or OpenAI problem")
                    raise Exception("OpenAI returned no recommendations")

                logger.info(f"✅ DEBUG: Successfully generated {total_count} recommendations")
                return recommendations

            except json.JSONDecodeError as e:
                logger.error(f"❌ DEBUG: JSON parsing failed: {e}")
                logger.error(f"❌ DEBUG: Raw content that failed: {content}")
                raise Exception("OpenAI returned invalid JSON")

        except Exception as e:
            logger.error(f"❌ DEBUG: Recommendation generation failed: {e}")
            import traceback
            logger.error(f"❌ DEBUG: Full traceback: {traceback.format_exc()}")
            raise Exception(f"Failed to generate recommendations: {str(e)}")


openai_service = OpenAIService()
