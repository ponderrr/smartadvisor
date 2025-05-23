from pydantic import BaseModel

class User(BaseModel):
    id: str
    username: str
    email: str
    age: int
    profile_picture_url: str
    profile_picture_updated: str
    stripe_customer_id: str
    created_at: str
    updated_at: str
    