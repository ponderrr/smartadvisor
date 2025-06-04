# api/app/services/recommendation_service.py - CLEAN VERSION, NO MOCK DATA
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.models.recommendation import (
    Recommendation,
    RecommendationQuestion,
    RecommendationAnswer,
    MovieRecommendation,
    BookRecommendation,
)
from app.models.user import User
from app.models.preferences import UserPreferences
from app.schemas.recommendation import RecommendationType, Answer
from app.services.openai_service import openai_service
from app.services.tmdb_service import tmdb_service
from app.services.books_service import books_service
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    async def get_user_preferences(
        self, db: AsyncSession, user: User
    ) -> Optional[UserPreferences]:
        """Get user preferences from database."""
        try:
            result = await db.execute(
                select(UserPreferences).where(UserPreferences.user_id == user.id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.warning(f"Could not fetch user preferences: {e}")
            return None

    async def generate_questions(
        self,
        db: AsyncSession,
        user: User,
        recommendation_type: RecommendationType,
        num_questions: int,
    ) -> Recommendation:
        """Generate questions for a recommendation session."""
        logger.info(f"🎯 Generating {num_questions} questions for {recommendation_type.value}")

        try:
            user_preferences = await self.get_user_preferences(db, user)

            accessibility_needs = {}
            if user_preferences:
                accessibility_needs = {
                    "require_subtitles": user_preferences.accessibility_require_subtitles,
                    "require_audio_description": user_preferences.accessibility_require_audio_description,
                    "exclude_violent_content": user_preferences.content_filters_exclude_violent_content,
                    "exclude_sexual_content": user_preferences.content_filters_exclude_sexual_content,
                }

            # Generate REAL questions via OpenAI
            questions_data = await openai_service.generate_questions(
                recommendation_type=recommendation_type,
                num_questions=num_questions,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            if not questions_data:
                raise Exception("Failed to generate questions")

            # Create recommendation record
            recommendation = Recommendation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                type=recommendation_type.value,
                timestamp=datetime.utcnow(),
            )
            db.add(recommendation)
            await db.flush()

            # Save questions to database
            for question_data in questions_data:
                question = RecommendationQuestion(
                    id=str(uuid.uuid4()),
                    recommendation_id=recommendation.id,
                    question_text=question_data["text"],
                    question_order=question_data["order"],
                )
                db.add(question)

            await db.commit()

            # Reload with questions
            result = await db.execute(
                select(Recommendation)
                .where(Recommendation.id == recommendation.id)
                .options(selectinload(Recommendation.questions))
            )
            recommendation = result.scalar_one()

            logger.info(f"✅ Generated {len(recommendation.questions)} real questions")
            return recommendation

        except Exception as e:
            logger.error(f"❌ Question generation failed: {e}")
            await db.rollback()
            raise Exception(f"Failed to generate questions: {str(e)}")

    async def process_answers(
        self, db: AsyncSession, recommendation: Recommendation, answers: List[Answer]
    ) -> Recommendation:
        """Process user answers and generate REAL recommendations."""
        logger.info(f"🔄 Processing answers for REAL recommendations")

        try:
            # Save answers to database
            for answer in answers:
                db_answer = RecommendationAnswer(
                    id=str(uuid.uuid4()),
                    question_id=answer.question_id,
                    answer_text=answer.answer_text,
                )
                db.add(db_answer)

            await db.flush()

            # Get user data
            result = await db.execute(select(User).where(User.id == recommendation.user_id))
            user = result.scalar_one()

            user_preferences = await self.get_user_preferences(db, user)

            # Prepare Q&A for OpenAI
            questions_and_answers = []
            result = await db.execute(
                select(RecommendationQuestion)
                .where(RecommendationQuestion.recommendation_id == recommendation.id)
                .options(selectinload(RecommendationQuestion.answers))
                .order_by(RecommendationQuestion.question_order)
            )
            questions = result.scalars().all()

            for question in questions:
                matching_answer = next(
                    (a for a in answers if a.question_id == question.id), None
                )
                if matching_answer:
                    questions_and_answers.append({
                        "question": question.question_text,
                        "answer": matching_answer.answer_text,
                    })

            accessibility_needs = {}
            if user_preferences:
                accessibility_needs = {
                    "exclude_violent_content": user_preferences.content_filters_exclude_violent_content,
                    "exclude_sexual_content": user_preferences.content_filters_exclude_sexual_content,
                }

            # Get REAL recommendations from OpenAI
            logger.info(f"🎯 Getting REAL recommendations for {recommendation.type}")
            ai_recommendations = await openai_service.generate_recommendations(
                recommendation_type=RecommendationType(recommendation.type),
                questions_and_answers=questions_and_answers,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            if not ai_recommendations:
                raise Exception("Failed to get recommendations from OpenAI")

            logger.info(f"✅ Received real recommendations from OpenAI")

            # Process movies (if any)
            movies_saved = 0
            if "movies" in ai_recommendations and ai_recommendations["movies"]:
                for movie_data in ai_recommendations["movies"]:
                    if not movie_data.get("title"):
                        continue

                    try:
                        # Start with OpenAI data
                        movie_rec_data = {
                            "title": str(movie_data["title"]),
                            "description": str(movie_data.get("description", "")),
                            "age_rating": str(movie_data.get("age_rating", "")) if movie_data.get("age_rating") else None,
                            "rating": None,
                            "poster_path": None,
                            "tmdb_id": None,
                            "release_date": str(movie_data.get("year", "")) if movie_data.get("year") else None,
                            "runtime": None,
                        }

                        # Try to parse rating
                        if movie_data.get("rating"):
                            try:
                                movie_rec_data["rating"] = float(movie_data["rating"])
                            except (ValueError, TypeError):
                                pass

                        # Enrich with TMDB data (optional, non-blocking)
                        try:
                            enriched_movie = await tmdb_service.enrich_movie_data(movie_data)
                            if enriched_movie:
                                if enriched_movie.get("poster_path"):
                                    movie_rec_data["poster_path"] = str(enriched_movie["poster_path"])
                                if enriched_movie.get("tmdb_id"):
                                    movie_rec_data["tmdb_id"] = str(enriched_movie["tmdb_id"])
                                if enriched_movie.get("rating") is not None:
                                    try:
                                        movie_rec_data["rating"] = float(enriched_movie["rating"])
                                    except (ValueError, TypeError):
                                        pass
                                if enriched_movie.get("runtime"):
                                    try:
                                        movie_rec_data["runtime"] = int(enriched_movie["runtime"])
                                    except (ValueError, TypeError):
                                        pass
                                logger.info(f"🎬 Enhanced: {movie_rec_data['title']}")
                        except Exception as e:
                            logger.warning(f"TMDB enhancement failed: {e}")

                        # Save to database
                        movie_rec = MovieRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            **movie_rec_data
                        )
                        db.add(movie_rec)
                        movies_saved += 1
                        logger.info(f"💾 Saved movie: {movie_rec_data['title']}")

                    except Exception as e:
                        logger.error(f"❌ Failed to save movie {movie_data.get('title', 'Unknown')}: {e}")

            # Process books (if any)
            books_saved = 0
            if "books" in ai_recommendations and ai_recommendations["books"]:
                for book_data in ai_recommendations["books"]:
                    if not book_data.get("title"):
                        continue

                    try:
                        # Start with OpenAI data
                        book_rec_data = {
                            "title": str(book_data["title"]),
                            "author": str(book_data.get("author", "Unknown Author")),
                            "description": str(book_data.get("description", "")),
                            "age_rating": str(book_data.get("age_rating", "")) if book_data.get("age_rating") else None,
                            "rating": None,
                            "poster_path": None,
                            "isbn": None,
                            "published_date": None,
                            "page_count": None,
                            "publisher": None,
                        }

                        # Try to parse rating
                        if book_data.get("rating"):
                            try:
                                book_rec_data["rating"] = float(book_data["rating"])
                            except (ValueError, TypeError):
                                pass

                        # Enrich with Google Books data (optional, non-blocking)
                        try:
                            enriched_book = await books_service.enrich_book_data(book_data)
                            if enriched_book:
                                if enriched_book.get("poster_path"):
                                    book_rec_data["poster_path"] = str(enriched_book["poster_path"])
                                if enriched_book.get("isbn"):
                                    book_rec_data["isbn"] = str(enriched_book["isbn"])
                                if enriched_book.get("published_date"):
                                    book_rec_data["published_date"] = str(enriched_book["published_date"])
                                if enriched_book.get("page_count"):
                                    try:
                                        book_rec_data["page_count"] = int(enriched_book["page_count"])
                                    except (ValueError, TypeError):
                                        pass
                                if enriched_book.get("publisher"):
                                    book_rec_data["publisher"] = str(enriched_book["publisher"])
                                logger.info(f"📚 Enhanced: {book_rec_data['title']}")
                        except Exception as e:
                            logger.warning(f"Google Books enhancement failed: {e}")

                        # Save to database
                        book_rec = BookRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            **book_rec_data
                        )
                        db.add(book_rec)
                        books_saved += 1
                        logger.info(f"💾 Saved book: {book_rec_data['title']} by {book_rec_data['author']}")

                    except Exception as e:
                        logger.error(f"❌ Failed to save book {book_data.get('title', 'Unknown')}: {e}")

            total_saved = movies_saved + books_saved
            logger.info(f"📊 Saved {total_saved} real recommendations ({movies_saved} movies, {books_saved} books)")

            if total_saved == 0:
                raise Exception("No recommendations could be saved to database")

            # Commit all changes
            await db.commit()
            logger.info(f"✅ Successfully committed {total_saved} real recommendations")

            # Return fresh data
            result = await db.execute(
                select(Recommendation)
                .where(Recommendation.id == recommendation.id)
                .options(
                    selectinload(Recommendation.questions).selectinload(
                        RecommendationQuestion.answers
                    ),
                    selectinload(Recommendation.movie_recommendations),
                    selectinload(Recommendation.book_recommendations),
                )
            )
            final_recommendation = result.scalar_one()

            final_movies = len(final_recommendation.movie_recommendations or [])
            final_books = len(final_recommendation.book_recommendations or [])

            logger.info(f"🎉 Final result: {final_movies} movies, {final_books} books - ALL REAL DATA")
            return final_recommendation

        except Exception as e:
            logger.error(f"❌ Failed to process real recommendations: {e}")
            await db.rollback()
            raise Exception(f"Failed to generate recommendations: {str(e)}")


recommendation_service = RecommendationService()
