import unittest
from sqlalchemy import inspect, text
from app.db.session import engine


class TestLiveDatabaseSchema(unittest.TestCase):
    def test_tables_exist_in_public_schema(self):
        inspector = inspect(engine)
        tables = set(inspector.get_table_names(schema="public"))
        expected_tables = {
            "alembic_version",
            "donors",
            "blood_requests",
            "hospitals",
            "doctors",
            "pharmacies",
            "verification_audit_logs",
        }
        self.assertTrue(expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}")

    def test_alembic_version(self):
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            self.assertEqual(result, "80918958c4d7")

    def test_uuid_and_timestamp_server_defaults_live(self):
        inspector = inspect(engine)
        app_tables = ["donors", "blood_requests", "hospitals", "doctors", "pharmacies"]
        for table_name in app_tables:
            columns = {col["name"]: col for col in inspector.get_columns(table_name, schema="public")}
            
            # Check ID column
            self.assertIn("id", columns)
            id_default = str(columns["id"]["default"]).lower()
            self.assertIn("gen_random_uuid", id_default, f"{table_name}.id server default is '{id_default}'")

            # Check created_at column
            self.assertIn("created_at", columns)
            created_default = str(columns["created_at"]["default"]).lower()
            self.assertIn("now", created_default, f"{table_name}.created_at server default is '{created_default}'")

            # Check updated_at column
            self.assertIn("updated_at", columns)
            updated_default = str(columns["updated_at"]["default"]).lower()
            self.assertIn("now", updated_default, f"{table_name}.updated_at server default is '{updated_default}'")

    def test_check_constraints_live(self):
        inspector = inspect(engine)
        app_tables = ["donors", "blood_requests", "hospitals", "doctors", "pharmacies"]
        for table_name in app_tables:
            check_constraints = inspector.get_check_constraints(table_name, schema="public")
            self.assertGreater(len(check_constraints), 0, f"{table_name} has no check constraints")


if __name__ == "__main__":
    unittest.main()

