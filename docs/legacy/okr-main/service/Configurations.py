# make a class Configurations which reades ENVIRONMENT variable from the environment using dotenv
import os
from dotenv import load_dotenv

class Configurations:
    PRODUCTION = "production"
    DEVELOPMENT = "development"

    def __init__(self):
        load_dotenv()
        self.environment = os.getenv("ENVIRONMENT")

        if self.environment == self.DEVELOPMENT:
            self.base_api_address = 'https://tuvia---pe.bubbleapps.io/version-test/'
            self.bubble_api_address = self.base_api_address + 'api/1.1/obj'
            self.bubble_api_wf = self.base_api_address + 'api/1.1/wf'
            self.bubble_api = os.getenv("BUBBLE_API")
            self.api_key= os.getenv("CHATGPT_API_KEY")
            self.api_token = os.getenv("API_TOKEN")
            self.brevo = os.getenv("BREVO")

        if self.environment == self.PRODUCTION:
            self.base_api_address = 'https://tuvia.ai/'
            self.bubble_api_address = self.base_api_address + 'api/1.1/obj'
            self.bubble_api_wf = self.base_api_address + 'api/1.1/wf'
            self.bubble_api = os.getenv("BUBBLE_API")
            self.api_key= os.getenv("CHATGPT_API_KEY")
            self.api_token = os.getenv("API_TOKEN")
            self.brevo = os.getenv("BREVO")
