from dto.dto import dto
from model.Okr import Okr
from datetime import datetime

from model.User import User

class UserDTO(dto):

    def __init__(self, service, user=None):

        super().__init__(service)
        self.type = self.service.USER
        self.user = user

    def get_by_constraint(self, key, value):
        """
        Retrieves all published plans.

        Returns:
            A list of Plan objects.
        """

        constraint = { "key": key,"constraint_type": "equals","value": value}
        result = super().get_by_constraint([constraint])

        return result

    def set_token(self):
        """
        Updates the user token.
        Requires set the self.user attribute.

        Returns:
            Updated key result object.

        """

        result = self.service.update_generic(self.type, self.user.id, 'token', self.user.token )

        if result['error']:
            return None

        return self.user

    def _map(self, data: dict) -> 'User':
        self.user = User( **data )

        return self.user