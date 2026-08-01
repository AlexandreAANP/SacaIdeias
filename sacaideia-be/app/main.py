import os

from dotenv import load_dotenv
from fastapi import FastAPI

from app.services.example_service import ExampleService

load_dotenv()

app = FastAPI(title=os.getenv("APP_NAME", "SacaIdeias API"))
example_service = ExampleService()


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "SacaIdeias backend is running"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/example/{name}")
async def example(name: str) -> dict[str, str]:
    return example_service.greet(name)
