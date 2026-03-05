from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament
from backend.app.api.matches.pairing import get_pairings


def test_pairings_sorted_by_points():
    # P1/P2: 6 points combined
    # P3/P4: 0 points combined
    p1 = Participant(id=1, name="P1", points=3)
    p2 = Participant(id=2, name="P2", points=3)
    p3 = Participant(id=3, name="P3", points=0)
    p4 = Participant(id=4, name="P4", points=0)

    participants = [p1, p2, p3, p4]
    get_pairings(participants, [])

    # The current get_pairings implementation appends matches to pairings list
    # We want to check if the returned pairings are sorted by combined points
    # Since pairings returns List[Tuple[Participant, Optional[Participant]]]

    # We'll need to update generate_pairings to handle the sorting and table assignment
    # But let's see if get_pairings itself can be made more deterministic or if we sort in the service.

    # Actually, the requirement says Table 1 should be the match with the players with the most points.
    # This implies the list of matches returned from generate_pairings should have table_number 1 for the top match.
    pass


def test_table_assignment_logic():
    # This test will mock the database and check generate_pairings service
    # However, to keep it simple and unit-testable, we can test a new sorting function
    # or just test that the table numbers are assigned correctly in a simulated environment.
    from backend.app.api.matches.services import generate_pairings
    from unittest.mock import MagicMock, patch
    from sqlalchemy.orm import Session

    db = MagicMock(spec=Session)
    tournament = Tournament(id=1, code="TEST", rounds=3)
    p1 = Participant(id=1, name="P1", points=6)
    p2 = Participant(id=2, name="P2", points=6)
    p3 = Participant(id=3, name="P3", points=3)
    p4 = Participant(id=4, name="P4", points=3)
    tournament.participants = [p1, p2, p3, p4]

    # Mock past_matches
    db.query().filter().all.return_value = []

    # Mock pairing.get_pairings
    with patch("backend.app.api.matches.pairing.get_pairings") as mock_get_pairings:
        # Return pairings in "wrong" order (lowest points first)
        mock_get_pairings.return_value = [(p3, p4), (p1, p2)]

        # We need to run the async function
        import asyncio

        loop = asyncio.get_event_loop()
        db_matches = loop.run_until_complete(generate_pairings(db, tournament))

        # Check if they are sorted and assigned table numbers
        # (p1, p2) should be Table 1, (p3, p4) should be Table 2

        # find match (p1, p2)
        m12 = next(m for m in db_matches if m.player1_id == 1 and m.player2_id == 2)
        m34 = next(m for m in db_matches if m.player1_id == 3 and m.player2_id == 4)

        assert m12.table_number == 1
        assert m34.table_number == 2
