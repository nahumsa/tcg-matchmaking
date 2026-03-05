import pytest
from backend.app.api.matches.models import Match


def test_match_has_table_number():
    # This might still fail if table_number is not in __init__ if it's not a Column
    # But since it's a declarative model, it should accept it as a kwarg if it's a Column
    try:
        match = Match(tournament_id=1, round_number=1, table_number=1)
    except TypeError:
        pytest.fail("Match model does not accept table_number as a keyword argument")

    assert hasattr(match, "table_number")
    assert match.table_number == 1
