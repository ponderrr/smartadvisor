import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class TMDBService:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.base_url = "https://api.themoviedb.org/3"
        self.image_base_url = "https://image.tmdb.org/t/p/w500"

    async def search_movie(
        self, title: str, year: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Search for a movie by title."""
        if not self.api_key:
            return None

        params = {"api_key": self.api_key, "query": title}

        if year:
            params["year"] = year

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/movie", params=params
                )
                response.raise_for_status()
                data = response.json()

                if data["results"]:
                    return data["results"][0]  # Return first match

        except Exception as e:
            logger.error(f"Error searching TMDB for {title}: {e}")

        return None

    async def get_movie_details(self, movie_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed movie information."""
        if not self.api_key:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/movie/{movie_id}",
                    params={"api_key": self.api_key},
                )
                response.raise_for_status()
                return response.json()

        except Exception as e:
            logger.error(f"Error getting movie details for ID {movie_id}: {e}")

        return None

    async def enrich_movie_data(self, movie_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich AI-generated movie data with TMDB information."""
        title = movie_data.get("title", "")
        year = movie_data.get("year")

        # Search for the movie
        tmdb_movie = await self.search_movie(title, year)

        if not tmdb_movie:
            return movie_data

        # Get detailed information
        movie_details = await self.get_movie_details(tmdb_movie["id"])

        enriched_data = movie_data.copy()

        if movie_details:
            enriched_data.update(
                {
                    "tmdb_id": str(movie_details["id"]),
                    "poster_path": (
                        f"{self.image_base_url}{movie_details['poster_path']}"
                        if movie_details.get("poster_path")
                        else None
                    ),
                    "release_date": movie_details.get("release_date"),
                    "runtime": movie_details.get("runtime"),
                    "rating": movie_details.get("vote_average"),
                }
            )

            # Use TMDB description if AI description is short
            if len(movie_data.get("description", "")) < 100 and movie_details.get(
                "overview"
            ):
                enriched_data["description"] = movie_details["overview"]

        return enriched_data


tmdb_service = TMDBService()
