import unittest
from datetime import datetime, timezone
from service.KrService import KrService

class TestKrService(unittest.TestCase):

    data_inicio = datetime.strptime("2024-02-11", "%Y-%m-%d").replace(tzinfo=timezone.utc)
    data_fim = datetime.strptime("2024-05-11", "%Y-%m-%d").replace(tzinfo=timezone.utc)
    data_calculo = datetime.strptime("2024-04-17", "%Y-%m-%d").replace(tzinfo=timezone.utc)


    def test_calculate_riskno_prazo_data_de_hoje(self):
        expected_result =KrService().NO_PRAZO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 10, 0,  100, "Aumentar até", self.data_inicio)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_high_risk_aumentar(self):
        expected_result =KrService().RISCO_ALTO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 10, 0,  100, "Aumentar até", self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_at_risk_aumentar(self):

        expected_result = KrService().EM_RISCO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 40, 0, 100,"Aumentar até", self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_delayed_aumentar(self):

        expected_result = KrService().EM_ATRASO
        result =  KrService.calculate_risk(self.data_inicio, self.data_fim, 73, 0, 100,"Aumentar até",  self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_on_time_aumentar(self):

        expected_result = KrService().NO_PRAZO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 80, 0, 100,"Aumentar até",  self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_high_risk_reduzir(self):
        expected_result = KrService().RISCO_ALTO
        result =KrService.calculate_risk(self.data_inicio, self.data_fim, 85,100, 0, "Reduzir até", self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_at_risk_reduzir(self):

        expected_result = KrService().EM_RISCO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 35,100, 0, "Reduzir até",  self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_delayed_reduzir(self):

        expected_result = KrService().EM_ATRASO
        result =  KrService.calculate_risk(self.data_inicio, self.data_fim, 28,100,  0,"Reduzir até",  self.data_calculo)

        self.assertEqual(result, expected_result)

    def test_calculate_risk_on_time_reduzir(self):

        expected_result =  KrService().NO_PRAZO
        result = KrService.calculate_risk(self.data_inicio, self.data_fim, 10,100,  0,"Reduzir até", self.data_calculo)

        self.assertEqual(result, expected_result)

        self.assertEqual(result, expected_result)

    def test_calculate_progress(self):
        progresso= KrService.calculate_progress( KrService.AUMENTAR, 0, 100, 80)
        self.assertEqual(progresso, 80)

        progresso= KrService.calculate_progress( KrService.AUMENTAR, 5, 10, 7.5)
        self.assertEqual(progresso, 50)


        progresso= KrService.calculate_progress( KrService.REDUZIR, 100, 0, 80)
        self.assertEqual(progresso, 20)

        progresso= KrService.calculate_progress( KrService.REDUZIR, 100, 50, 100)
        self.assertEqual(progresso, 0)

        progresso= KrService.calculate_progress( KrService.REDUZIR, 100, 50, 75)
        self.assertEqual(progresso, 50)

        progresso= KrService.calculate_progress( KrService.SIM_NAO, 0, 1, 1)
        self.assertEqual(progresso, 100)


if __name__ == '__main__':
    unittest.main()