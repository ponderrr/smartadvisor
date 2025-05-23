from fastapi import FastAPI

app = FastAPI()

from models import User, Subscription, UserPreferences, UserRecommendationHistory, Recommendation

# User
app.post("/users/")
def signup(user: User):
        return user

app.post("/users/")
def signin(user: User):
        return user

app.post("/users/")
def signout(user: User):
        return user

app.post("/users/")
def reset_password(user: User):
        return user

app.put("/users/")
def reset_password(user: User):
        return user

app.put("/users/")
def update_profile(user: User):
        return user

app.get("/users/")
def get_profile(user: User):
        return user

app.delete("/users/")
def delete_profile(user: User):
        return user

# Preferences
app.get("/preferences/")
def get_preferences(user: User):
        return user

app.put("/preferences/")
def update_preferences(user: User):
        return user

# Recommendations



