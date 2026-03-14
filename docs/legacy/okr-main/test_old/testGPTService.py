import unittest
from unittest.mock import patch, MagicMock
from service.GPTService import GPTService

class TestGPTService(unittest.TestCase):

    @patch('openai.ChatCompletion.create')
    def test_generate(self, mock_create):
        # Arrange
        mock_response = MagicMock()
        mock_response.choices[0].finish_reason = 'tool_calls'
        mock_response.choices[0].message.tool_calls[0].function.arguments = '{"key": "value"}'
        mock_create.return_value = mock_response

        service = GPTService()

        # Act
        result = service.generate(["Hello"], "function")

        # Assert
        self.assertEqual(result, {'error': False, 'message': {"key": "value"}})

    @patch('openai.ChatCompletion.create')
    def test_generate_error(self, mock_create):
        # Arrange
        mock_create.side_effect = Exception("Test exception")
        service = GPTService()

        # Act
        result = service.generate(["Hello"], "function")

        # Assert
        self.assertEqual(result, {'error': True, 'message': "Test exception"})

if __name__ == '__main__':
    unittest.main()