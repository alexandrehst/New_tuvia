import unittest
from unittest.mock import MagicMock
from service.PlanGenerator import PlanGenerator

class TestPlanGenerator(unittest.TestCase):

    def setUp(self):
        self.generator = PlanGenerator()

    def test_generate_plan(self):
        message = "Generate a plan"
        expected_result = "Generated plan"
        self.generator.model.generate = MagicMock(return_value=expected_result)

        result = self.generator.generate_plan(message)

        self.assertEqual(result, expected_result)
        self.generator.model.generate.assert_called_once_with(message, PlanGenerator.functions_plan, False)

    def test_generate_objective(self):
        message = "Generate an objective"
        expected_result = "Generated objective"
        self.generator.model.generate = MagicMock(return_value=expected_result)

        result = self.generator.generate_objective(message)

        self.assertEqual(result, expected_result)
        self.generator.model.generate.assert_called_once_with(message, PlanGenerator.functions_objective, False)

    def test_generate_key_result(self):
        message = "Generate a key result"
        expected_result = "Generated key result"
        self.generator.model.generate = MagicMock(return_value=expected_result)

        result = self.generator.generate_key_result(message)

        self.assertEqual(result, expected_result)
        self.generator.model.generate.assert_called_once_with(message, PlanGenerator.functions_kr, False)

    def test_print_response_choices(self):
        response = {'choices': ['Choice 1', 'Choice 2', 'Choice 3']}
        expected_output = "\nGenerated Plan\n--------------------\n\nChoice 1\nChoice 2\nChoice 3\n------------------\n"
        print_output = MagicMock()

        with unittest.mock.patch('builtins.print', print_output):
            self.generator.print_response_choices(response)

        print_output.assert_called_once_with(expected_output)

if __name__ == '__main__':
    unittest.main()