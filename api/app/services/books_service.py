import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class BooksService:
    def __init__(self):
        self.api_key = settings.GOOGLE_BOOKS_API_KEY
        self.base_url = "https://www.googleapis.com/books/v1"

    async def search_book(
        self, title: str, author: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Search for a book by title and author."""
        query = f"intitle:{title}"
        if author:
            query += f"+inauthor:{author}"

        params = {"q": query, "maxResults": 1}
        if self.api_key:
            params["key"] = self.api_key

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/volumes", params=params)
                response.raise_for_status()
                data = response.json()

                if data.get("items"):
                    return data["items"][0]

        except Exception as e:
            logger.error(f"Error searching Google Books for {title}: {e}")

        return None

    async def enrich_book_data(self, book_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich AI-generated book data with Google Books information."""
        title = book_data.get("title", "")
        author = book_data.get("author", "")

        # Search for the book
        google_book = await self.search_book(title, author)

        if not google_book:
            return book_data

        enriched_data = book_data.copy()
        volume_info = google_book.get("volumeInfo", {})

        # Update with Google Books data
        if volume_info:
            enriched_data.update(
                {
                    "isbn": self._extract_isbn(
                        volume_info.get("industryIdentifiers", [])
                    ),
                    "published_date": volume_info.get("publishedDate"),
                    "page_count": volume_info.get("pageCount"),
                    "publisher": volume_info.get("publisher"),
                    "poster_path": volume_info.get("imageLinks", {}).get("thumbnail"),
                    "rating": volume_info.get("averageRating"),
                }
            )

            # Use Google Books description if AI description is short
            if len(book_data.get("description", "")) < 100 and volume_info.get(
                "description"
            ):
                enriched_data["description"] = (
                    volume_info["description"][:500] + "..."
                    if len(volume_info["description"]) > 500
                    else volume_info["description"]
                )

        return enriched_data

    def _extract_isbn(self, identifiers: list) -> Optional[str]:
        """Extract ISBN from industry identifiers."""
        for identifier in identifiers:
            if identifier.get("type") in ["ISBN_13", "ISBN_10"]:
                return identifier.get("identifier")
        return None


books_service = BooksService()
