from backend.app.api.matches.schemas import MatchResponse

def test_match_response_schema_has_table_number():
    match_data = {
        "id": 1,
        "tournament_id": 1,
        "round_number": 1,
        "player1_id": 1,
        "player2_id": 2,
        "player1_score": 0,
        "player2_score": 0,
        "is_bye": 0,
        "is_completed": 0,
        "table_number": 1
    }
    match = MatchResponse(**match_data)
    assert hasattr(match, "table_number")
    assert match.table_number == 1
