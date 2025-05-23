from typing import Union

from pydantic import BaseModel

from fastapi import FastAPI

app = FastAPI()

from models import User

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
