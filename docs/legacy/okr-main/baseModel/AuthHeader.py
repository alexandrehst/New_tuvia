from pydantic import BaseModel, Field


class AuthHeader(BaseModel):
    Authorization: str = Field(description='API Key')
    