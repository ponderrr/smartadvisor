from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recommendation import (
    Recommendation,
    RecommendationQuestion,
    RecommendationAnswer,
    MovieRecommendation,
    BookRecommendation,
)
from app.models.user import User
from app.schemas.recommendation import RecommendationType, Answer
from app.services.openai_service import openai_service
from app.services.tmdb_service import tmdb_service
from app.services.books_service import books_service
import uuid
from datetime import datetime


class RecommendationService:
    async def generate_questions(
        self,
        db: AsyncSession,
        user: User,
        recommendation_type: RecommendationType,
        num_questions: int,
    ) -> Recommendation:
        """Generate questions for a recommendation session."""

        # Get user accessibility preferences
        accessibility_needs = {}
        if hasattr(user, "preferences") and user.preferences:
            prefs = user.preferences
            accessibility_needs = {
                "require_subtitles": prefs.accessibility_require_subtitles,
                "require_audio_description": prefs.accessibility_require_audio_description,
                "exclude_violent_content": prefs.content_filters_exclude_violent_content,
                "exclude_sexual_content": prefs.content_filters_exclude_sexual_content,
            }

        # Generate questions using OpenAI
        questions_data = await openai_service.generate_questions(
            recommendation_type=recommendation_type,
            num_questions=num_questions,
            user_age=user.age,
            accessibility_needs=accessibility_needs,
        )

        # Create recommendation record
        recommendation = Recommendation(
            id=str(uuid.uuid4()),
            user_id=user.id,
            type=recommendation_type.value,
            timestamp=datetime.utcnow(),
        )
        db.add(recommendation)
        await db.flush()  # Get the ID without committing

        # Create questions
        for question_data in questions_data:
            question = RecommendationQuestion(
                id=str(uuid.uuid4()),
                recommendation_id=recommendation.id,
                question_text=question_data["text"],
                question_order=question_data["order"],
            )
            db.add(question)

        await db.commit()
        await db.refresh(recommendation)
        return recommendation

    async def process_answers(
        self, db: AsyncSession, recommendation: Recommendation, answers: List[Answer]
    ) -> Recommendation:
        """Process user answers and generate recommendations."""

        # Save answers to database
        for answer in answers:
            db_answer = RecommendationAnswer(
                id=str(uuid.uuid4()),
                question_id=answer.question_id,
                answer_text=answer.answer_text,
            )
            db.add(db_answer)

        await db.flush()

        # Get questions and answers for AI processing
        questions_and_answers = []
        for question in recommendation.questions:
            question_answers = [a for a in answers if a.question_id == question.id]
            if question_answers:
                questions_and_answers.append(
                    {
                        "question": question.question_text,
                        "answer": question_answers[0].answer_text,
                    }
                )

        # Get user preferences
        user = recommendation.user
        accessibility_needs = {}
        if hasattr(user, "preferences") and user.preferences:
            prefs = user.preferences
            accessibility_needs = {
                "exclude_violent_content": prefs.content_filters_exclude_violent_content,
                "exclude_sexual_content": prefs.content_filters_exclude_sexual_content,
            }

        # Generate AI recommendations
        ai_recommendations = await openai_service.generate_recommendations(
            recommendation_type=RecommendationType(recommendation.type),
            questions_and_answers=questions_and_answers,
            user_age=user.age,
            accessibility_needs=accessibility_needs,
        )

        # Process and save movie recommendations
        if "movies" in ai_recommendations:
            for movie_data in ai_recommendations["movies"]:
                # Enrich with TMDB data
                enriched_movie = await tmdb_service.enrich_movie_data(movie_data)

                movie_rec = MovieRecommendation(
                    id=str(uuid.uuid4()),
                    recommendation_id=recommendation.id,
                    title=enriched_movie.get("title", movie_data["title"]),
                    description=enriched_movie.get(
                        "description", movie_data.get("description", "")
                    ),
                    rating=enriched_movie.get("rating"),
                    age_rating=enriched_movie.get(
                        "age_rating", movie_data.get("age_rating")
                    ),
                    poster_path=enriched_movie.get("poster_path"),
                    tmdb_id=enriched_movie.get("tmdb_id"),
                    release_date=enriched_movie.get("release_date"),
                    runtime=enriched_movie.get("runtime"),
                )
                db.add(movie_rec)

        # Process and save book recommendations
        if "books" in ai_recommendations:
            for book_data in ai_recommendations["books"]:
                # Enrich with Google Books data
                enriched_book = await books_service.enrich_book_data(book_data)

                book_rec = BookRecommendation(
                    id=str(uuid.uuid4()),
                    recommendation_id=recommendation.id,
                    title=enriched_book.get("title", book_data["title"]),
                    author=enriched_book.get("author", book_data.get("author", "")),
                    description=enriched_book.get(
                        "description", book_data.get("description", "")
                    ),
                    rating=enriched_book.get("rating"),
                    age_rating=enriched_book.get(
                        "age_rating", book_data.get("age_rating")
                    ),
                    poster_path=enriched_book.get("poster_path"),
                    isbn=enriched_book.get("isbn"),
                    published_date=enriched_book.get("published_date"),
                    page_count=enriched_book.get("page_count"),
                    publisher=enriched_book.get("publisher"),
                )
                db.add(book_rec)

        await db.commit()
        await db.refresh(recommendation)
        return recommendation


recommendation_service = RecommendationService()
