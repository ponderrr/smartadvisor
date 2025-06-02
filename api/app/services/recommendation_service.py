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
        logger.info(f"🎯 Starting question generation for user {user.id}: {num_questions} {recommendation_type.value} questions")

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
                logger.info(f"📋 User preferences loaded: {accessibility_needs}")

            # Call OpenAI to generate questions
            logger.info("🤖 Calling OpenAI to generate questions...")
            questions_data = await openai_service.generate_questions(
                recommendation_type=recommendation_type,
                num_questions=num_questions,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            if not questions_data or len(questions_data) == 0:
                raise Exception("OpenAI returned no questions")

            logger.info(f"✅ OpenAI generated {len(questions_data)} questions")

            # Create recommendation record
            recommendation = Recommendation(
                id=str(uuid.uuid4()),
                user_id=user.id,
                type=recommendation_type.value,
                timestamp=datetime.utcnow(),
            )
            db.add(recommendation)
            await db.flush()
            logger.info(f"💾 Created recommendation record: {recommendation.id}")

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
            logger.info("✅ Questions saved to database")

            # Reload with questions
            result = await db.execute(
                select(Recommendation)
                .where(Recommendation.id == recommendation.id)
                .options(selectinload(Recommendation.questions))
            )
            recommendation = result.scalar_one()

            logger.info(f"🎉 Question generation completed successfully: {len(recommendation.questions)} questions")
            return recommendation

        except Exception as e:
            logger.error(f"❌ Error generating questions: {e}")
            await db.rollback()
            raise Exception(f"Failed to generate questions: {str(e)}")

    async def process_answers(
        self, db: AsyncSession, recommendation: Recommendation, answers: List[Answer]
    ) -> Recommendation:
        """Process user answers and generate recommendations."""
        logger.info(f"🔄 Processing {len(answers)} answers for recommendation {recommendation.id}")

        try:
            # Save answers to database
            for answer in answers:
                db_answer = RecommendationAnswer(
                    id=str(uuid.uuid4()),
                    question_id=answer.question_id,
                    answer_text=answer.answer_text,
                )
                db.add(db_answer)
                logger.info(f"💾 Saved answer for question {answer.question_id}: {answer.answer_text[:50]}...")

            await db.flush()

            # Get user data
            result = await db.execute(
                select(User).where(User.id == recommendation.user_id)
            )
            user = result.scalar_one()
            logger.info(f"👤 Processing for user: {user.email} (age: {user.age})")

            user_preferences = await self.get_user_preferences(db, user)

            # Prepare questions and answers for OpenAI
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

            logger.info(f"📝 Prepared {len(questions_and_answers)} Q&A pairs for OpenAI")

            accessibility_needs = {}
            if user_preferences:
                accessibility_needs = {
                    "exclude_violent_content": user_preferences.content_filters_exclude_violent_content,
                    "exclude_sexual_content": user_preferences.content_filters_exclude_sexual_content,
                }

            # Call OpenAI for recommendations
            logger.info(f"🤖 Calling OpenAI for {recommendation.type} recommendations...")
            ai_recommendations = await openai_service.generate_recommendations(
                recommendation_type=RecommendationType(recommendation.type),
                questions_and_answers=questions_and_answers,
                user_age=user.age,
                accessibility_needs=accessibility_needs,
            )

            if not ai_recommendations:
                logger.error("❌ OpenAI returned no recommendations")
                raise Exception("OpenAI returned no recommendations")

            logger.info(f"✅ OpenAI returned recommendations: {list(ai_recommendations.keys())}")

            # Process movie recommendations
            movies_processed = 0
            if "movies" in ai_recommendations and ai_recommendations["movies"]:
                logger.info(f"🎬 Processing {len(ai_recommendations['movies'])} movies")
                for i, movie_data in enumerate(ai_recommendations["movies"]):
                    try:
                        logger.info(f"Processing movie {i+1}: {movie_data.get('title', 'Unknown')}")

                        # Validate required fields
                        if not movie_data.get("title"):
                            logger.warning(f"❌ Movie {i+1} missing title, skipping")
                            continue

                        # Start with basic data from OpenAI
                        movie_rec_data = {
                            "title": str(movie_data.get("title", "Unknown Movie")),
                            "description": str(movie_data.get("description", "")),
                            "age_rating": str(movie_data.get("age_rating", "")) if movie_data.get("age_rating") else None,
                            "rating": None,
                            "poster_path": None,
                            "tmdb_id": None,
                            "release_date": str(movie_data.get("year", "")) if movie_data.get("year") else None,
                            "runtime": None,
                        }

                        # Try to parse rating as float
                        try:
                            if movie_data.get("rating"):
                                movie_rec_data["rating"] = float(movie_data["rating"])
                        except (ValueError, TypeError):
                            logger.warning(f"Could not parse rating for movie {movie_data.get('title')}")

                        # Try to enrich with TMDB data (non-blocking)
                        try:
                            enriched_movie = await tmdb_service.enrich_movie_data(movie_data)
                            if enriched_movie:
                                # Only update if we got valid data
                                if enriched_movie.get("title"):
                                    movie_rec_data["title"] = str(enriched_movie["title"])
                                if enriched_movie.get("description"):
                                    movie_rec_data["description"] = str(enriched_movie["description"])
                                if enriched_movie.get("rating") is not None:
                                    try:
                                        movie_rec_data["rating"] = float(enriched_movie["rating"])
                                    except (ValueError, TypeError):
                                        pass
                                if enriched_movie.get("poster_path"):
                                    movie_rec_data["poster_path"] = str(enriched_movie["poster_path"])
                                if enriched_movie.get("tmdb_id"):
                                    movie_rec_data["tmdb_id"] = str(enriched_movie["tmdb_id"])
                                if enriched_movie.get("release_date"):
                                    movie_rec_data["release_date"] = str(enriched_movie["release_date"])
                                if enriched_movie.get("runtime") is not None:
                                    try:
                                        movie_rec_data["runtime"] = int(enriched_movie["runtime"])
                                    except (ValueError, TypeError):
                                        pass
                                logger.info(f"🎬 Enriched movie data for: {movie_rec_data['title']}")
                        except Exception as tmdb_error:
                            logger.warning(f"TMDB enrichment failed for {movie_data.get('title')}: {tmdb_error}")

                        # Create movie recommendation
                        movie_rec = MovieRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            **movie_rec_data
                        )
                        db.add(movie_rec)
                        movies_processed += 1
                        logger.info(f"✅ Added movie #{movies_processed}: {movie_rec_data['title']}")

                    except Exception as e:
                        logger.error(f"❌ Error processing movie {i+1} ({movie_data.get('title', 'Unknown')}): {e}")
                        continue

            # Process book recommendations
            books_processed = 0
            if "books" in ai_recommendations and ai_recommendations["books"]:
                logger.info(f"📚 Processing {len(ai_recommendations['books'])} books")
                for i, book_data in enumerate(ai_recommendations["books"]):
                    try:
                        logger.info(f"Processing book {i+1}: {book_data.get('title', 'Unknown')}")

                        # Validate required fields
                        if not book_data.get("title"):
                            logger.warning(f"❌ Book {i+1} missing title, skipping")
                            continue

                        # Start with basic data from OpenAI
                        book_rec_data = {
                            "title": str(book_data.get("title", "Unknown Book")),
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

                        # Try to parse rating as float
                        try:
                            if book_data.get("rating"):
                                book_rec_data["rating"] = float(book_data["rating"])
                        except (ValueError, TypeError):
                            logger.warning(f"Could not parse rating for book {book_data.get('title')}")

                        # Try to enrich with Google Books data (non-blocking)
                        try:
                            enriched_book = await books_service.enrich_book_data(book_data)
                            if enriched_book:
                                # Only update if we got valid data
                                if enriched_book.get("title"):
                                    book_rec_data["title"] = str(enriched_book["title"])
                                if enriched_book.get("author"):
                                    book_rec_data["author"] = str(enriched_book["author"])
                                if enriched_book.get("description"):
                                    book_rec_data["description"] = str(enriched_book["description"])
                                if enriched_book.get("rating") is not None:
                                    try:
                                        book_rec_data["rating"] = float(enriched_book["rating"])
                                    except (ValueError, TypeError):
                                        pass
                                if enriched_book.get("poster_path"):
                                    book_rec_data["poster_path"] = str(enriched_book["poster_path"])
                                if enriched_book.get("isbn"):
                                    book_rec_data["isbn"] = str(enriched_book["isbn"])
                                if enriched_book.get("published_date"):
                                    book_rec_data["published_date"] = str(enriched_book["published_date"])
                                if enriched_book.get("page_count") is not None:
                                    try:
                                        book_rec_data["page_count"] = int(enriched_book["page_count"])
                                    except (ValueError, TypeError):
                                        pass
                                if enriched_book.get("publisher"):
                                    book_rec_data["publisher"] = str(enriched_book["publisher"])
                                logger.info(f"📚 Enriched book data for: {book_rec_data['title']}")
                        except Exception as books_error:
                            logger.warning(f"Google Books enrichment failed for {book_data.get('title')}: {books_error}")

                        # Create book recommendation
                        book_rec = BookRecommendation(
                            id=str(uuid.uuid4()),
                            recommendation_id=recommendation.id,
                            **book_rec_data
                        )
                        db.add(book_rec)
                        books_processed += 1
                        logger.info(f"✅ Added book #{books_processed}: {book_rec_data['title']}")

                    except Exception as e:
                        logger.error(f"❌ Error processing book {i+1} ({book_data.get('title', 'Unknown')}): {e}")
                        continue

            # Check if we actually processed any recommendations
            total_processed = movies_processed + books_processed
            logger.info(f"📊 Total recommendations processed: {total_processed} ({movies_processed} movies, {books_processed} books)")

            if total_processed == 0:
                logger.error("❌ No recommendations were successfully processed")
                raise Exception("OpenAI failed to generate valid recommendations. Please try again with different answers or check your internet connection.")

            # Commit all changes
            await db.commit()
            logger.info(f"💾 Committed {movies_processed} movies and {books_processed} books to database")

            # Reload with all relationships
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
            recommendation = result.scalar_one()

            # Final validation
            final_movie_count = len(recommendation.movie_recommendations or [])
            final_book_count = len(recommendation.book_recommendations or [])
            logger.info(f"🎉 Processing complete! Final counts: {final_movie_count} movies, {final_book_count} books")

            if final_movie_count == 0 and final_book_count == 0:
                logger.error("❌ No recommendations were saved to the database after commit")
                raise Exception("No recommendations were saved to the database")

            return recommendation

        except Exception as e:
            logger.error(f"❌ Error processing answers: {e}")
            await db.rollback()
            raise Exception(f"Failed to process recommendations: {str(e)}")


recommendation_service = RecommendationService()
