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
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_questions(
        self,
        recommendation_type: RecommendationType,
        num_questions: int,
        user_age: int = None,
        accessibility_needs: Dict = None,
    ) -> List[Dict[str, Any]]:
        """Generate personalized questions for recommendations."""

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
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.7,
            )

            content = response.choices[0].message.content.strip()
            questions = json.loads(content)

            return questions

        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            # Fallback questions
            return self._get_fallback_questions(recommendation_type, num_questions)

    async def generate_recommendations(
        self,
        recommendation_type: RecommendationType,
        questions_and_answers: List[Dict[str, str]],
        user_age: int = None,
        accessibility_needs: Dict = None,
    ) -> Dict[str, Any]:
        """Generate recommendations based on user answers."""

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
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.8,
            )

            content = response.choices[0].message.content.strip()
            recommendations = json.loads(content)

            return recommendations

        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {"movies": [], "books": []}

    def _get_fallback_questions(
        self, rec_type: RecommendationType, num: int
    ) -> List[Dict[str, Any]]:
        """Fallback questions if OpenAI fails."""
        base_questions = [
            {"text": "What genres do you typically enjoy?", "order": 1},
            {"text": "Do you prefer newer releases or classic titles?", "order": 2},
            {"text": "What mood are you in for your next recommendation?", "order": 3},
            {
                "text": "Do you have any favorite actors, directors, or authors?",
                "order": 4,
            },
            {
                "text": "How long do you typically like to spend reading/watching?",
                "order": 5,
            },
        ]

        return base_questions[: min(num, len(base_questions))]


openai_service = OpenAIService()
