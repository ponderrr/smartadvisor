from typing import List, Dict, Any
import openai
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.recommendation import RecommendationType
import json
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.error("❌ OPENAI_API_KEY is not configured!")
            raise ValueError(
                "OpenAI API key is required for AI recommendations. Please set OPENAI_API_KEY in your environment variables."
            )

        if not settings.validate_openai_key():
            logger.error(
                "❌ Invalid OPENAI_API_KEY format! Key should start with 'sk-'"
            )
            raise ValueError(
                "Invalid OpenAI API key format. Key should start with 'sk-'"
            )

        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("✅ OpenAI service initialized successfully")

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
                accessibility_context = (
                    f" User accessibility and content preferences: {', '.join(needs)}."
                )

        prompt = f"""Generate {num_questions} thoughtful questions to help recommend {type_text}.{age_context}{accessibility_context}
        
        Questions should be:
        1. Specific and actionable for recommendations
        2. Diverse (covering genres, themes, mood, format preferences)
        3. Age-appropriate
        4. Engaging and easy to understand
        
        Return ONLY a JSON array of questions in this exact format:
        [
            {{"text": "What genre do you usually enjoy?", "order": 1}},
            {{"text": "Do you prefer recent releases or classics?", "order": 2}}
        ]
        
        Do not include any other text or explanation."""

        try:
            logger.info("🔄 Making OpenAI API request for questions...")
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.7,
            )

            content = response.choices[0].message.content.strip()
            logger.info(f"✅ Received response from OpenAI: {content[:100]}...")

            questions = json.loads(content)
            logger.info(f"✅ Successfully parsed {len(questions)} questions")
            return questions

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse OpenAI response as JSON: {e}")
            logger.error(f"Raw response: {content}")
            raise Exception(f"OpenAI returned invalid JSON response: {e}")

        except openai.APIError as e:
            logger.error(f"❌ OpenAI API error: {e}")
            raise Exception(f"OpenAI API error: {e}")

        except Exception as e:
            logger.error(f"❌ Unexpected error generating questions: {e}")
            raise Exception(f"Failed to generate questions: {e}")

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
            RecommendationType.MOVIE: "Recommend 5-8 movies",
            RecommendationType.BOOK: "Recommend 5-8 books",
            RecommendationType.BOTH: "Recommend 3-5 movies and 3-5 books",
        }

        prompt = f"""{type_instructions[recommendation_type]} based on these user preferences:{age_context}{accessibility_context}
        
        {qa_text}
        
        For each recommendation, provide:
        - Title
        - Brief description (2-3 sentences)
        - Why it matches their preferences
        - Age rating if applicable
        - Key genres/themes
        
        Format as JSON:
        {{
            "movies": [
                {{
                    "title": "Movie Title",
                    "description": "Brief description",
                    "why_recommended": "Why this matches their preferences", 
                    "age_rating": "PG-13",
                    "genres": ["Action", "Adventure"],
                    "year": 2023
                }}
            ],
            "books": [
                {{
                    "title": "Book Title",
                    "author": "Author Name",
                    "description": "Brief description",
                    "why_recommended": "Why this matches their preferences",
                    "age_rating": "Teen",
                    "genres": ["Fantasy", "Adventure"]
                }}
            ]
        }}
        
        Only include movies or books arrays based on the recommendation type requested."""

        try:
            logger.info("🔄 Making OpenAI API request for recommendations...")
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.8,
            )

            content = response.choices[0].message.content.strip()
            logger.info(f"✅ Received recommendations from OpenAI: {content[:100]}...")

            recommendations = json.loads(content)

            movies_count = len(recommendations.get("movies", []))
            books_count = len(recommendations.get("books", []))
            logger.info(
                f"✅ Successfully generated {movies_count} movies and {books_count} books"
            )

            return recommendations

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse recommendations JSON: {e}")
            logger.error(f"Raw response: {content}")
            raise Exception(
                f"OpenAI returned invalid JSON response for recommendations: {e}"
            )

        except openai.APIError as e:
            logger.error(f"❌ OpenAI API error generating recommendations: {e}")
            raise Exception(f"OpenAI API error: {e}")

        except Exception as e:
            logger.error(f"❌ Unexpected error generating recommendations: {e}")
            raise Exception(f"Failed to generate recommendations: {e}")


openai_service = OpenAIService()
