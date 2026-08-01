class ExampleService:
    def greet(self, name: str) -> dict[str, str]:
        return {"message": f"Hello, {name}! This response came from ExampleService."}
